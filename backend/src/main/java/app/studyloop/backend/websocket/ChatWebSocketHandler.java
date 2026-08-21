package app.studyloop.backend.websocket;

import app.studyloop.backend.domain.DirectChat;
import app.studyloop.backend.domain.DirectMessage;
import app.studyloop.backend.domain.DoubtMessage;
import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.repository.DirectChatRepository;
import app.studyloop.backend.repository.DirectMessageRepository;
import app.studyloop.backend.repository.DoubtMessageRepository;
import app.studyloop.backend.repository.ProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    @Value("${supabase.jwt.secret:}")
    private String jwtSecret;

    @Value("${supabase.jwt.verify-signature:false}")
    private boolean verifySignature;

    private final ProfileRepository profileRepository;
    private final DoubtMessageRepository doubtMessageRepository;
    private final DirectChatRepository directChatRepository;
    private final DirectMessageRepository directMessageRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map of userId -> Set of WebSocketSessions
    private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    
    // Map of session ID -> userId
    private final Map<String, UUID> sessionUsers = new ConcurrentHashMap<>();
    
    // Map of roomId -> Set of userIds currently in the room
    private final Map<UUID, Set<UUID>> roomParticipants = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(ProfileRepository profileRepository,
                                 DoubtMessageRepository doubtMessageRepository,
                                 DirectChatRepository directChatRepository,
                                 DirectMessageRepository directMessageRepository,
                                 StringRedisTemplate redisTemplate) {
        this.profileRepository = profileRepository;
        this.doubtMessageRepository = doubtMessageRepository;
        this.directChatRepository = directChatRepository;
        this.directMessageRepository = directMessageRepository;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID userId = extractUserId(session);
        if (userId == null) {
            log.warn("WebSocket connection attempt rejected: Invalid JWT token");
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        sessionUsers.put(session.getId(), userId);
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);

        // Update online presence in Redis (Upstash) with 60 second expiry
        updatePresenceInRedis(userId, true);

        log.info("User {} connected with WebSocket session {}", userId, session.getId());
        
        // Send connection confirmation
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
            "type", "CONNECTED",
            "userId", userId.toString()
        ))));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID senderId = sessionUsers.get(session.getId());
        if (senderId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        try {
            WsMessage wsMsg = objectMapper.readValue(message.getPayload(), WsMessage.class);
            wsMsg.setSenderId(senderId);

            switch (wsMsg.getType()) {
                case "HEARTBEAT":
                    updatePresenceInRedis(senderId, true);
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("type", "HEARTBEAT_ACK"))));
                    break;

                case "JOIN_ROOM":
                    if (wsMsg.getRoomId() != null) {
                        roomParticipants.computeIfAbsent(wsMsg.getRoomId(), k -> ConcurrentHashMap.newKeySet()).add(senderId);
                        log.info("User {} joined Doubt Room {}", senderId, wsMsg.getRoomId());
                    }
                    break;

                case "LEAVE_ROOM":
                    if (wsMsg.getRoomId() != null) {
                        Set<UUID> participants = roomParticipants.get(wsMsg.getRoomId());
                        if (participants != null) {
                            participants.remove(senderId);
                        }
                        log.info("User {} left Doubt Room {}", senderId, wsMsg.getRoomId());
                    }
                    break;

                case "CHAT_MSG": // Room doubt chat message
                    handleRoomChatMessage(senderId, wsMsg);
                    break;

                case "DIRECT_MSG": // 1:1 direct message
                    handleDirectMessage(senderId, wsMsg);
                    break;

                case "RTC_SIGNAL": // WebRTC signaling
                    handleRtcSignal(senderId, wsMsg);
                    break;

                default:
                    log.warn("Unknown message type: {}", wsMsg.getType());
            }
        } catch (Exception e) {
            log.error("Error processing websocket message: {}", e.getMessage(), e);
        }
    }

    private void handleRoomChatMessage(UUID senderId, WsMessage wsMsg) throws IOException {
        if (wsMsg.getRoomId() == null || !StringUtils.hasText(wsMsg.getMessage())) {
            return;
        }

        // Save to database
        DoubtMessage dbMsg = DoubtMessage.builder()
                .roomId(wsMsg.getRoomId())
                .senderId(senderId)
                .message(wsMsg.getMessage())
                .createdAt(Instant.now())
                .build();
        doubtMessageRepository.save(dbMsg);

        // Fetch sender details
        Profile sender = profileRepository.findById(senderId).orElse(null);
        String senderName = sender != null ? sender.getFullName() : "Student";
        String senderAvatar = sender != null ? sender.getAvatarUrl() : "";

        // Broadcast to all participants in this room
        Set<UUID> participants = roomParticipants.get(wsMsg.getRoomId());
        if (participants != null) {
            Map<String, Object> outboundPayload = new HashMap<>();
            outboundPayload.put("type", "ROOM_MSG");
            outboundPayload.put("roomId", wsMsg.getRoomId().toString());
            outboundPayload.put("senderId", senderId.toString());
            outboundPayload.put("senderName", senderName);
            outboundPayload.put("senderAvatar", senderAvatar);
            outboundPayload.put("message", wsMsg.getMessage());
            outboundPayload.put("createdAt", dbMsg.getCreatedAt().toString());

            String outboundJson = objectMapper.writeValueAsString(outboundPayload);
            broadcastToUsers(participants, outboundJson);
        }
    }

    private void handleDirectMessage(UUID senderId, WsMessage wsMsg) throws IOException {
        if (wsMsg.getChatId() == null || !StringUtils.hasText(wsMsg.getMessage())) {
            return;
        }

        DirectChat chat = directChatRepository.findById(wsMsg.getChatId()).orElse(null);
        if (chat == null) {
            return;
        }

        // Identify recipient
        UUID recipientId = chat.getUser1Id().equals(senderId) ? chat.getUser2Id() : chat.getUser1Id();

        // Save to database
        DirectMessage dbMsg = DirectMessage.builder()
                .chatId(wsMsg.getChatId())
                .senderId(senderId)
                .message(wsMsg.getMessage())
                .createdAt(Instant.now())
                .build();
        directMessageRepository.save(dbMsg);

        // Fetch sender details
        Profile sender = profileRepository.findById(senderId).orElse(null);
        String senderName = sender != null ? sender.getFullName() : "Student";
        String senderAvatar = sender != null ? sender.getAvatarUrl() : "";

        Map<String, Object> outboundPayload = new HashMap<>();
        outboundPayload.put("type", "DIRECT_MSG");
        outboundPayload.put("chatId", wsMsg.getChatId().toString());
        outboundPayload.put("senderId", senderId.toString());
        outboundPayload.put("senderName", senderName);
        outboundPayload.put("senderAvatar", senderAvatar);
        outboundPayload.put("message", wsMsg.getMessage());
        outboundPayload.put("createdAt", dbMsg.getCreatedAt().toString());

        String outboundJson = objectMapper.writeValueAsString(outboundPayload);

        // Forward to both sender and recipient sessions (since user can have multiple devices/sessions open)
        sendToUser(senderId, outboundJson);
        sendToUser(recipientId, outboundJson);
    }

    private void handleRtcSignal(UUID senderId, WsMessage wsMsg) throws IOException {
        if (wsMsg.getTargetUserId() == null) {
            return;
        }

        Profile sender = profileRepository.findById(senderId).orElse(null);
        String senderName = sender != null ? sender.getFullName() : "Student";
        String senderAvatar = sender != null ? sender.getAvatarUrl() : "";

        Map<String, Object> outboundPayload = new HashMap<>();
        outboundPayload.put("type", "RTC_SIGNAL");
        outboundPayload.put("senderId", senderId.toString());
        outboundPayload.put("senderName", senderName);
        outboundPayload.put("senderAvatar", senderAvatar);
        outboundPayload.put("roomId", wsMsg.getRoomId() != null ? wsMsg.getRoomId().toString() : null);
        outboundPayload.put("signalData", wsMsg.getSignalData());

        String outboundJson = objectMapper.writeValueAsString(outboundPayload);
        sendToUser(wsMsg.getTargetUserId(), outboundJson);
    }

    private void sendToUser(UUID userId, String payload) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(new TextMessage(payload));
                    } catch (IOException e) {
                        log.error("Failed to send message to session {}: {}", session.getId(), e.getMessage());
                    }
                }
            }
        }
    }

    private void broadcastToUsers(Collection<UUID> userIds, String payload) {
        for (UUID uId : userIds) {
            sendToUser(uId, payload);
        }
    }

    private void updatePresenceInRedis(UUID userId, boolean isOnline) {
        try {
            String key = "user:" + userId.toString() + ":online";
            if (isOnline) {
                // Set online status in Redis with a 60 second TTL (refreshed by heartbeat)
                redisTemplate.opsForValue().set(key, "true", 60, TimeUnit.SECONDS);
            } else {
                redisTemplate.delete(key);
            }
        } catch (Exception e) {
            // Log warning but fallback gracefully (permits offline/local startup without Redis)
            log.debug("Redis presence cache update bypassed: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        UUID userId = sessionUsers.remove(session.getId());
        if (userId != null) {
            Set<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                    updatePresenceInRedis(userId, false);
                    log.info("User {} disconnected completely", userId);
                }
            }

            // Remove from room participants mapping
            for (Map.Entry<UUID, Set<UUID>> entry : roomParticipants.entrySet()) {
                entry.getValue().remove(userId);
            }
        }
    }

    private UUID extractUserId(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri == null) return null;

            String query = uri.getQuery();
            if (!StringUtils.hasText(query)) return null;

            String token = null;
            for (String param : query.split("&")) {
                String[] pair = param.split("=");
                if (pair.length == 2 && "token".equalsIgnoreCase(pair[0])) {
                    token = pair[1];
                    break;
                }
            }

            if (!StringUtils.hasText(token)) return null;

            if (verifySignature && StringUtils.hasText(jwtSecret)) {
                Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(key)
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                return UUID.fromString(claims.getSubject());
            } else {
                // Decode payload without verification in developer mode
                String[] parts = token.split("\\.");
                if (parts.length >= 2) {
                    String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                    Map<String, Object> claims = objectMapper.readValue(payloadJson, Map.class);
                    return UUID.fromString((String) claims.get("sub"));
                }
            }
        } catch (Exception e) {
            log.error("Failed to authenticate WebSocket connection: {}", e.getMessage());
        }
        return null;
    }

    @Data
    private static class WsMessage {
        private String type; // HEARTBEAT, JOIN_ROOM, LEAVE_ROOM, CHAT_MSG, DIRECT_MSG, RTC_SIGNAL
        private UUID roomId;
        private UUID chatId;
        private UUID senderId;
        private String message;
        private UUID targetUserId;
        private Object signalData; // WebRTC offer, answer, or candidates
    }
}
