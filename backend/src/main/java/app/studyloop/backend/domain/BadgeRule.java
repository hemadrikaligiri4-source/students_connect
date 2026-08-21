package app.studyloop.backend.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "badge_rules", schema = "public")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}
