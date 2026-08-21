package app.studyloop.backend.repository;

import app.studyloop.backend.domain.BadgeRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BadgeRuleRepository extends JpaRepository<BadgeRule, Long> {
}
