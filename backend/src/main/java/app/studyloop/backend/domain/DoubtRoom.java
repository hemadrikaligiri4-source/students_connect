package app.studyloop.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "doubt_rooms")
public class DoubtRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(length = 20)
    private String status = "OPEN"; // OPEN, SOLVED, CLOSED

    @Column(nullable = false)
    private String subject;

    @Column(name = "creator_id", nullable = false)
    private UUID creatorId;

    @Column(name = "helper_id")
    private UUID helperId;

    @Column(nullable = false)
    private String college;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "solved_at")
    private Instant solvedAt;

    public DoubtRoom() {}

    public DoubtRoom(UUID id, String title, String description, String status, String subject,
                     UUID creatorId, UUID helperId, String college, Instant createdAt, Instant solvedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status != null ? status : "OPEN";
        this.subject = subject;
        this.creatorId = creatorId;
        this.helperId = helperId;
        this.college = college;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.solvedAt = solvedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public UUID getCreatorId() { return creatorId; }
    public void setCreatorId(UUID creatorId) { this.creatorId = creatorId; }

    public UUID getHelperId() { return helperId; }
    public void setHelperId(UUID helperId) { this.helperId = helperId; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getSolvedAt() { return solvedAt; }
    public void setSolvedAt(Instant solvedAt) { this.solvedAt = solvedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private String title;
        private String description;
        private String status = "OPEN";
        private String subject;
        private UUID creatorId;
        private UUID helperId;
        private String college;
        private Instant createdAt;
        private Instant solvedAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder creatorId(UUID creatorId) { this.creatorId = creatorId; return this; }
        public Builder helperId(UUID helperId) { this.helperId = helperId; return this; }
        public Builder college(String college) { this.college = college; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder solvedAt(Instant solvedAt) { this.solvedAt = solvedAt; return this; }

        public DoubtRoom build() {
            return new DoubtRoom(id, title, description, status, subject, creatorId, helperId, college, createdAt, solvedAt);
        }
    }
}
