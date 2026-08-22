package app.studyloop.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reels")
public class Reel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "creator_id", nullable = false)
    private UUID creatorId;

    @Column(name = "video_url", nullable = false)
    private String videoUrl;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    private String description;

    @Column(nullable = false)
    private String subject;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @Column(name = "comments_count")
    private Integer commentsCount = 0;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public Reel() {}

    public Reel(UUID id, UUID creatorId, String videoUrl, String thumbnailUrl, String description,
                String subject, Integer likesCount, Integer commentsCount, Instant createdAt) {
        this.id = id;
        this.creatorId = creatorId;
        this.videoUrl = videoUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.description = description;
        this.subject = subject;
        this.likesCount = likesCount != null ? likesCount : 0;
        this.commentsCount = commentsCount != null ? commentsCount : 0;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCreatorId() { return creatorId; }
    public void setCreatorId(UUID creatorId) { this.creatorId = creatorId; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public Integer getLikesCount() { return likesCount; }
    public void setLikesCount(Integer likesCount) { this.likesCount = likesCount; }

    public Integer getCommentsCount() { return commentsCount; }
    public void setCommentsCount(Integer commentsCount) { this.commentsCount = commentsCount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private UUID creatorId;
        private String videoUrl;
        private String thumbnailUrl;
        private String description;
        private String subject;
        private Integer likesCount = 0;
        private Integer commentsCount = 0;
        private Instant createdAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder creatorId(UUID creatorId) { this.creatorId = creatorId; return this; }
        public Builder videoUrl(String videoUrl) { this.videoUrl = videoUrl; return this; }
        public Builder thumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder likesCount(Integer likesCount) { this.likesCount = likesCount; return this; }
        public Builder commentsCount(Integer commentsCount) { this.commentsCount = commentsCount; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public Reel build() {
            return new Reel(id, creatorId, videoUrl, thumbnailUrl, description, subject, likesCount, commentsCount, createdAt);
        }
    }
}
