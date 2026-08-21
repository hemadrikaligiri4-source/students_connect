package app.studyloop.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "doubt_rooms", schema = "public")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoubtRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(length = 20)
    @Builder.Default
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
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "solved_at")
    private Instant solvedAt;
}
