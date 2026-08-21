package app.studyloop.backend.controller;

import app.studyloop.backend.domain.Connection;
import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.dto.ConnectionDto;
import app.studyloop.backend.repository.ConnectionRepository;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private final ConnectionRepository connectionRepository;
    private final ProfileRepository profileRepository;

    public ConnectionController(ConnectionRepository connectionRepository, ProfileRepository profileRepository) {
        this.connectionRepository = connectionRepository;
        this.profileRepository = profileRepository;
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendConnectionRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID receiverId) {
        
        UUID senderId = principal.getId();
        if (senderId.equals(receiverId)) {
            return ResponseEntity.badRequest().body("You cannot connect with yourself");
        }

        // Check if connection already exists
        Optional<Connection> existing = connectionRepository.findConnectionBetween(senderId, receiverId);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("Connection request or link already exists");
        }

        Connection newConnection = Connection.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .status("PENDING")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        connectionRepository.save(newConnection);
        return ResponseEntity.ok(Map.of("message", "Connection request sent successfully"));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptConnection(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        
        Connection connection = connectionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));

        if (!connection.getReceiverId().equals(principal.getId())) {
            return ResponseEntity.status(403).body("You can only accept requests sent to you");
        }

        connection.setStatus("ACCEPTED");
        connection.setUpdatedAt(Instant.now());
        connectionRepository.save(connection);

        return ResponseEntity.ok(Map.of("message", "Connection accepted"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectConnection(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        
        Connection connection = connectionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));

        if (!connection.getReceiverId().equals(principal.getId()) && !connection.getSenderId().equals(principal.getId())) {
            return ResponseEntity.status(430).body("Access Denied");
        }

        // Rejection deletes the link in this model to allow re-sending requests later
        connectionRepository.delete(connection);
        return ResponseEntity.ok(Map.of("message", "Connection request deleted"));
    }

    @PostMapping("/block")
    public ResponseEntity<?> blockUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID blockeeId) {
        
        UUID blockerId = principal.getId();
        if (blockerId.equals(blockeeId)) {
            return ResponseEntity.badRequest().body("You cannot block yourself");
        }

        Optional<Connection> existing = connectionRepository.findConnectionBetween(blockerId, blockeeId);
        if (existing.isPresent()) {
            Connection conn = existing.get();
            conn.setSenderId(blockerId);
            conn.setReceiverId(blockeeId);
            conn.setStatus("BLOCKED");
            conn.setUpdatedAt(Instant.now());
            connectionRepository.save(conn);
        } else {
            Connection conn = Connection.builder()
                    .senderId(blockerId)
                    .receiverId(blockeeId)
                    .status("BLOCKED")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            connectionRepository.save(conn);
        }

        return ResponseEntity.ok(Map.of("message", "User blocked successfully"));
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<List<ConnectionDto>> getPendingRequests(@AuthenticationPrincipal UserPrincipal principal) {
        List<Connection> requests = connectionRepository.findByReceiverIdAndStatus(principal.getId(), "PENDING");
        List<ConnectionDto> dtos = requests.stream()
                .map(c -> {
                    Profile sender = profileRepository.findById(c.getSenderId()).orElse(null);
                    return ConnectionDto.builder()
                            .connectionId(c.getId())
                            .profile(sender)
                            .status(c.getStatus())
                            .createdAt(c.getCreatedAt())
                            .build();
                })
                .filter(dto -> dto.getProfile() != null)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ConnectionDto>> getActiveConnections(@AuthenticationPrincipal UserPrincipal principal) {
        List<Connection> connections = connectionRepository.findActiveConnectionsFor(principal.getId(), "ACCEPTED");
        List<ConnectionDto> dtos = connections.stream()
                .map(c -> {
                    UUID peerId = c.getSenderId().equals(principal.getId()) ? c.getReceiverId() : c.getSenderId();
                    Profile peer = profileRepository.findById(peerId).orElse(null);
                    return ConnectionDto.builder()
                            .connectionId(c.getId())
                            .profile(peer)
                            .status(c.getStatus())
                            .createdAt(c.getCreatedAt())
                            .build();
                })
                .filter(dto -> dto.getProfile() != null)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
