package app.studyloop.backend.repository;

import app.studyloop.backend.domain.ReelComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReelCommentRepository extends JpaRepository<ReelComment, Long> {
    List<ReelComment> findByReelIdOrderByCreatedAtDesc(UUID reelId);
}
