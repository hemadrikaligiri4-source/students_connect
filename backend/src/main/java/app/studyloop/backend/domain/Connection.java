package app.studyloop.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "connections", schema = "public")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Connection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_id", nullable = false)
    private java.util.UUID senderId;

    @Column(name = "receiver_id", nullable = false)
    private java.util.UUID receiverId;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED, BLOCKED

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
