package app.studyloop.backend.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "badge_rules")
public class BadgeRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(name = "criteria_type", nullable = false)
    private String criteriaType; // DOUBTS_SOLVED, SESSIONS_TAUGHT, XP_EARNED, STREAK_DAYS, SUBJECT_SPECIALIST

    @Column(name = "criteria_value", nullable = false)
    private Integer criteriaValue;

    @Column(name = "icon_url")
    private String iconUrl;

    public BadgeRule() {}

    public BadgeRule(Long id, String name, String description, String criteriaType, Integer criteriaValue, String iconUrl) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.criteriaType = criteriaType;
        this.criteriaValue = criteriaValue;
        this.iconUrl = iconUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCriteriaType() { return criteriaType; }
    public void setCriteriaType(String criteriaType) { this.criteriaType = criteriaType; }

    public Integer getCriteriaValue() { return criteriaValue; }
    public void setCriteriaValue(Integer criteriaValue) { this.criteriaValue = criteriaValue; }

    public String getIconUrl() { return iconUrl; }
    public void setIconUrl(String iconUrl) { this.iconUrl = iconUrl; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String name;
        private String description;
        private String criteriaType;
        private Integer criteriaValue;
        private String iconUrl;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder criteriaType(String criteriaType) { this.criteriaType = criteriaType; return this; }
        public Builder criteriaValue(Integer criteriaValue) { this.criteriaValue = criteriaValue; return this; }
        public Builder iconUrl(String iconUrl) { this.iconUrl = iconUrl; return this; }

        public BadgeRule build() {
            return new BadgeRule(id, name, description, criteriaType, criteriaValue, iconUrl);
        }
    }
}
