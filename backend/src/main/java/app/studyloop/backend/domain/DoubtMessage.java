package app.studyloop.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "doubt_messages")
public class DoubtMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public DoubtMessage() {}

    public DoubtMessage(Long id, UUID roomId, UUID senderId, String message, Instant createdAt) {
        this.id = id;
        this.roomId = roomId;
        this.senderId = senderId;
        this.message = message;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public UUID getSenderId() { return senderId; }
    public void setSenderId(UUID senderId) { this.senderId = senderId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private UUID roomId;
        private UUID senderId;
        private String message;
        private Instant createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder roomId(UUID roomId) { this.roomId = roomId; return this; }
        public Builder senderId(UUID senderId) { this.senderId = senderId; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public DoubtMessage build() {
            return new DoubtMessage(id, roomId, senderId, message, createdAt);
        }
    }
}
