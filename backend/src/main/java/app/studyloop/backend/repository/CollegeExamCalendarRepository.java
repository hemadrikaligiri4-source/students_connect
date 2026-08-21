package app.studyloop.backend.repository;

import app.studyloop.backend.domain.CollegeExamCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CollegeExamCalendarRepository extends JpaRepository<CollegeExamCalendar, Long> {
    List<CollegeExamCalendar> findByCollege(String college);
    List<CollegeExamCalendar> findByCollegeAndExamDateGreaterThanEqual(String college, LocalDate date);
}
