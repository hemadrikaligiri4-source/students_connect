package app.studyloop.backend.dto;

import app.studyloop.backend.domain.DoubtRoom;
import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.domain.Reel;

import java.time.Instant;
import java.util.UUID;

public class FeedItemDto {
    private String type; // "DOUBT_ROOM" or "REEL"
    private UUID id;
    private String title;
    private String description;
    private String subject;
    private String college;
    private Instant createdAt;
    private Profile creator;
    private int score;
    private DoubtRoom doubtRoom;
    private Reel reel;

    public FeedItemDto() {}

    public FeedItemDto(String type, UUID id, String title, String description, String subject,
                       String college, Instant createdAt, Profile creator, int score,
                       DoubtRoom doubtRoom, Reel reel) {
        this.type = type;
        this.id = id;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.college = college;
        this.createdAt = createdAt;
        this.creator = creator;
        this.score = score;
        this.doubtRoom = doubtRoom;
        this.reel = reel;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Profile getCreator() { return creator; }
    public void setCreator(Profile creator) { this.creator = creator; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public DoubtRoom getDoubtRoom() { return doubtRoom; }
    public void setDoubtRoom(DoubtRoom doubtRoom) { this.doubtRoom = doubtRoom; }

    public Reel getReel() { return reel; }
    public void setReel(Reel reel) { this.reel = reel; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String type;
        private UUID id;
        private String title;
        private String description;
        private String subject;
        private String college;
        private Instant createdAt;
        private Profile creator;
        private int score;
        private DoubtRoom doubtRoom;
        private Reel reel;

        public Builder type(String type) { this.type = type; return this; }
        public Builder id(UUID id) { this.id = id; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder college(String college) { this.college = college; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder creator(Profile creator) { this.creator = creator; return this; }
        public Builder score(int score) { this.score = score; return this; }
        public Builder doubtRoom(DoubtRoom doubtRoom) { this.doubtRoom = doubtRoom; return this; }
        public Builder reel(Reel reel) { this.reel = reel; return this; }

        public FeedItemDto build() {
            return new FeedItemDto(type, id, title, description, subject, college, createdAt, creator, score, doubtRoom, reel);
        }
    }
}
