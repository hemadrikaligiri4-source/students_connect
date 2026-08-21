package app.studyloop.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "endorsements")
public class Endorsement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "endorser_id", nullable = false)
    private UUID endorserId;

    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    @Column(nullable = false)
    private String skill;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public Endorsement() {}

    public Endorsement(Long id, UUID endorserId, UUID recipientId, String skill, Instant createdAt) {
        this.id = id;
        this.endorserId = endorserId;
        this.recipientId = recipientId;
        this.skill = skill;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getEndorserId() { return endorserId; }
    public void setEndorserId(UUID endorserId) { this.endorserId = endorserId; }

    public UUID getRecipientId() { return recipientId; }
    public void setRecipientId(UUID recipientId) { this.recipientId = recipientId; }

    public String getSkill() { return skill; }
    public void setSkill(String skill) { this.skill = skill; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private UUID endorserId;
        private UUID recipientId;
        private String skill;
        private Instant createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder endorserId(UUID endorserId) { this.endorserId = endorserId; return this; }
        public Builder recipientId(UUID recipientId) { this.recipientId = recipientId; return this; }
        public Builder skill(String skill) { this.skill = skill; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public Endorsement build() {
            return new Endorsement(id, endorserId, recipientId, skill, createdAt);
        }
    }
}
