package app.studyloop.backend.controller;

import app.studyloop.backend.domain.DirectChat;
import app.studyloop.backend.domain.DirectMessage;
import app.studyloop.backend.domain.DoubtMessage;
import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.dto.DirectChatThreadDto;
import app.studyloop.backend.repository.DirectChatRepository;
import app.studyloop.backend.repository.DirectMessageRepository;
import app.studyloop.backend.repository.DoubtMessageRepository;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final DoubtMessageRepository doubtMessageRepository;
    private final DirectChatRepository directChatRepository;
    private final DirectMessageRepository directMessageRepository;
    private final ProfileRepository profileRepository;

    public ChatController(DoubtMessageRepository doubtMessageRepository,
                          DirectChatRepository directChatRepository,
                          DirectMessageRepository directMessageRepository,
                          ProfileRepository profileRepository) {
        this.doubtMessageRepository = doubtMessageRepository;
        this.directChatRepository = directChatRepository;
        this.directMessageRepository = directMessageRepository;
        this.profileRepository = profileRepository;
    }

    @GetMapping("/doubt/{roomId}")
    public ResponseEntity<List<DoubtMessage>> getDoubtMessages(@PathVariable UUID roomId) {
        return ResponseEntity.ok(doubtMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId));
    }

    @GetMapping("/direct/{chatId}")
    public ResponseEntity<List<DirectMessage>> getDirectMessages(@PathVariable UUID chatId) {
        return ResponseEntity.ok(directMessageRepository.findByChatIdOrderByCreatedAtAsc(chatId));
    }

    @GetMapping("/direct/threads")
    public ResponseEntity<List<DirectChatThreadDto>> getDirectChatThreads(@AuthenticationPrincipal UserPrincipal principal) {
        List<DirectChat> chats = directChatRepository.findAllChatsForUser(principal.getId());
        List<DirectChatThreadDto> threads = chats.stream()
                .map(c -> {
                    UUID peerId = c.getUser1Id().equals(principal.getId()) ? c.getUser2Id() : c.getUser1Id();
                    Profile peer = profileRepository.findById(peerId).orElse(null);
                    return DirectChatThreadDto.builder()
                            .chatId(c.getId())
                            .peer(peer)
                            .createdAt(c.getCreatedAt())
                            .build();
                })
                .filter(dto -> dto.getPeer() != null)
                .collect(Collectors.toList());

        return ResponseEntity.ok(threads);
    }

    @PostMapping("/direct/init")
    public ResponseEntity<?> initDirectChat(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID peerId) {
        
        UUID currentUserId = principal.getId();
        if (currentUserId.equals(peerId)) {
            return ResponseEntity.badRequest().body("You cannot initiate a direct chat with yourself.");
        }

        // Enforce ordering to match database uniqueness check, or search using bidirectional query
        Optional<DirectChat> existing = directChatRepository.findChatBetween(currentUserId, peerId);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }

        DirectChat newChat = DirectChat.builder()
                .user1Id(currentUserId)
                .user2Id(peerId)
                .createdAt(Instant.now())
                .build();

        DirectChat savedChat = directChatRepository.save(newChat);
        return ResponseEntity.ok(savedChat);
    }
}
