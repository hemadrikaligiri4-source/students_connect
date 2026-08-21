package app.studyloop.backend.repository;

import app.studyloop.backend.domain.Reel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReelRepository extends JpaRepository<Reel, UUID> {
    List<Reel> findBySubjectOrderByCreatedAtDesc(String subject);
    List<Reel> findAllByOrderByCreatedAtDesc();
    List<Reel> findByCreatorIdOrderByCreatedAtDesc(UUID creatorId);
}
