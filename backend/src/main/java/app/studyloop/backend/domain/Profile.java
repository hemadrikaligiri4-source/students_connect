package app.studyloop.backend.domain;

import app.studyloop.backend.util.ListToStringConverter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    private String college;
    private String department;
    private Integer year;
    private String bio;

    @Convert(converter = ListToStringConverter.class)
    @Column(columnDefinition = "text")
    private List<String> skills = new ArrayList<>();

    @Convert(converter = ListToStringConverter.class)
    @Column(name = "teaching_skills", columnDefinition = "text")
    private List<String> teachingSkills = new ArrayList<>();

    @Convert(converter = ListToStringConverter.class)
    @Column(name = "learning_goals", columnDefinition = "text")
    private List<String> learningGoals = new ArrayList<>();

    private Integer xp = 0;
    private Integer coins = 0;
    private String level = "Beginner";
    private BigDecimal reputation = new BigDecimal("5.00");
    private Integer streak = 0;

    @Column(name = "last_active_at")
    private Instant lastActiveAt = Instant.now();

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public Profile() {}

    public Profile(UUID id, String email, String fullName, String avatarUrl, String college,
                   String department, Integer year, String bio, List<String> skills,
                   List<String> teachingSkills, List<String> learningGoals, Integer xp,
                   Integer coins, String level, BigDecimal reputation, Integer streak,
                   Instant lastActiveAt, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        this.college = college;
        this.department = department;
        this.year = year;
        this.bio = bio;
        this.skills = skills != null ? skills : new ArrayList<>();
        this.teachingSkills = teachingSkills != null ? teachingSkills : new ArrayList<>();
        this.learningGoals = learningGoals != null ? learningGoals : new ArrayList<>();
        this.xp = xp != null ? xp : 0;
        this.coins = coins != null ? coins : 0;
        this.level = level != null ? level : "Beginner";
        this.reputation = reputation != null ? reputation : new BigDecimal("5.00");
        this.streak = streak != null ? streak : 0;
        this.lastActiveAt = lastActiveAt != null ? lastActiveAt : Instant.now();
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public List<String> getTeachingSkills() { return teachingSkills; }
    public void setTeachingSkills(List<String> teachingSkills) { this.teachingSkills = teachingSkills; }

    public List<String> getLearningGoals() { return learningGoals; }
    public void setLearningGoals(List<String> learningGoals) { this.learningGoals = learningGoals; }

    public Integer getXp() { return xp; }
    public void setXp(Integer xp) { this.xp = xp; }

    public Integer getCoins() { return coins; }
    public void setCoins(Integer coins) { this.coins = coins; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public BigDecimal getReputation() { return reputation; }
    public void setReputation(BigDecimal reputation) { this.reputation = reputation; }

    public Integer getStreak() { return streak; }
    public void setStreak(Integer streak) { this.streak = streak; }

    public Instant getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(Instant lastActiveAt) { this.lastActiveAt = lastActiveAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID id;
        private String email;
        private String fullName;
        private String avatarUrl;
        private String college;
        private String department;
        private Integer year;
        private String bio;
        private List<String> skills = new ArrayList<>();
        private List<String> teachingSkills = new ArrayList<>();
        private List<String> learningGoals = new ArrayList<>();
        private Integer xp = 0;
        private Integer coins = 0;
        private String level = "Beginner";
        private BigDecimal reputation = new BigDecimal("5.00");
        private Integer streak = 0;
        private Instant lastActiveAt;
        private Instant createdAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public Builder college(String college) { this.college = college; return this; }
        public Builder department(String department) { this.department = department; return this; }
        public Builder year(Integer year) { this.year = year; return this; }
        public Builder bio(String bio) { this.bio = bio; return this; }
        public Builder skills(List<String> skills) { this.skills = skills; return this; }
        public Builder teachingSkills(List<String> teachingSkills) { this.teachingSkills = teachingSkills; return this; }
        public Builder learningGoals(List<String> learningGoals) { this.learningGoals = learningGoals; return this; }
        public Builder xp(Integer xp) { this.xp = xp; return this; }
        public Builder coins(Integer coins) { this.coins = coins; return this; }
        public Builder level(String level) { this.level = level; return this; }
        public Builder reputation(BigDecimal reputation) { this.reputation = reputation; return this; }
        public Builder streak(Integer streak) { this.streak = streak; return this; }
        public Builder lastActiveAt(Instant lastActiveAt) { this.lastActiveAt = lastActiveAt; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public Profile build() {
            return new Profile(id, email, fullName, avatarUrl, college, department, year, bio,
                    skills, teachingSkills, learningGoals, xp, coins, level, reputation, streak,
                    lastActiveAt, createdAt);
        }
    }
}
