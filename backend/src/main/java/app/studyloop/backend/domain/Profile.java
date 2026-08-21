package app.studyloop.backend.domain;

import app.studyloop.backend.util.ListToStringConverter;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "profiles", schema = "public")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Convert(converter = ListToStringConverter.class)
    @Column(name = "teaching_skills", columnDefinition = "text")
    @Builder.Default
    private List<String> teachingSkills = new ArrayList<>();

    @Convert(converter = ListToStringConverter.class)
    @Column(name = "learning_goals", columnDefinition = "text")
    @Builder.Default
    private List<String> learningGoals = new ArrayList<>();

    @Builder.Default
    private Integer xp = 0;

    @Builder.Default
    private Integer coins = 0;

    @Builder.Default
    private String level = "Beginner";

    @Builder.Default
    private BigDecimal reputation = new BigDecimal("5.00");

    @Builder.Default
    private Integer streak = 0;

    @Column(name = "last_active_at")
    @Builder.Default
    private Instant lastActiveAt = Instant.now();

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
