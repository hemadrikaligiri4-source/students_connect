package app.studyloop.backend.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "college_exam_calendar")
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

    public CollegeExamCalendar() {}

    public CollegeExamCalendar(Long id, String college, String subject, LocalDate examDate) {
        this.id = id;
        this.college = college;
        this.subject = subject;
        this.examDate = examDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String college;
        private String subject;
        private LocalDate examDate;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder college(String college) { this.college = college; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder examDate(LocalDate examDate) { this.examDate = examDate; return this; }

        public CollegeExamCalendar build() {
            return new CollegeExamCalendar(id, college, subject, examDate);
        }
    }
}
