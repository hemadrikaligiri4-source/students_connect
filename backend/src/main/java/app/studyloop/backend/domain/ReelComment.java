package app.studyloop.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reel_comments")
public class ReelComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reel_id", nullable = false)
    private UUID reelId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, columnDefinition = "text")
    private String comment;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public ReelComment() {}

    public ReelComment(Long id, UUID reelId, UUID userId, String comment, Instant createdAt) {
        this.id = id;
        this.reelId = reelId;
        this.userId = userId;
        this.comment = comment;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getReelId() { return reelId; }
    public void setReelId(UUID reelId) { this.reelId = reelId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private UUID reelId;
        private UUID userId;
        private String comment;
        private Instant createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder reelId(UUID reelId) { this.reelId = reelId; return this; }
        public Builder userId(UUID userId) { this.userId = userId; return this; }
        public Builder comment(String comment) { this.comment = comment; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public ReelComment build() {
            return new ReelComment(id, reelId, userId, comment, createdAt);
        }
    }
}
