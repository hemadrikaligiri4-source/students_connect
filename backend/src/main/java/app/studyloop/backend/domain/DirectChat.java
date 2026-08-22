package app.studyloop.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "direct_chats")
public class DirectChat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user1_id", nullable = false)
    private UUID user1Id;

    @Column(name = "user2_id", nullable = false)
    private UUID user2Id;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public DirectChat() {}

    public DirectChat(UUID id, UUID user1Id, UUID user2Id, Instant createdAt) {
        this.id = id;
        this.user1Id = user1Id;
        this.user2Id = user2Id;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUser1Id() { return user1Id; }
    public void setUser1Id(UUID user1Id) { this.user1Id = user1Id; }

    public UUID getUser2Id() { return user2Id; }
    public void setUser2Id(UUID user2Id) { this.user2Id = user2Id; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private UUID user1Id;
        private UUID user2Id;
        private Instant createdAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder user1Id(UUID user1Id) { this.user1Id = user1Id; return this; }
        public Builder user2Id(UUID user2Id) { this.user2Id = user2Id; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public DirectChat build() {
            return new DirectChat(id, user1Id, user2Id, createdAt);
        }
    }
}
