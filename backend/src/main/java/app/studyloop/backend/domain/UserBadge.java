package app.studyloop.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_badges")
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "badge_id", nullable = false)
    private Long badgeId;

    @Column(name = "awarded_at", updatable = false)
    private Instant awardedAt = Instant.now();

    public UserBadge() {}

    public UserBadge(Long id, UUID userId, Long badgeId, Instant awardedAt) {
        this.id = id;
        this.userId = userId;
        this.badgeId = badgeId;
        this.awardedAt = awardedAt != null ? awardedAt : Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Long getBadgeId() { return badgeId; }
    public void setBadgeId(Long badgeId) { this.badgeId = badgeId; }

    public Instant getAwardedAt() { return awardedAt; }
    public void setAwardedAt(Instant awardedAt) { this.awardedAt = awardedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private UUID userId;
        private Long badgeId;
        private Instant awardedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder userId(UUID userId) { this.userId = userId; return this; }
        public Builder badgeId(Long badgeId) { this.badgeId = badgeId; return this; }
        public Builder awardedAt(Instant awardedAt) { this.awardedAt = awardedAt; return this; }

        public UserBadge build() {
            return new UserBadge(id, userId, badgeId, awardedAt);
        }
    }
}
