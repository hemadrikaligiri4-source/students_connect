package app.studyloop.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "college_exam_calendar", schema = "public")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollegeExamCalendar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String college;

    @Column(nullable = false)
    private String subject;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;
}
