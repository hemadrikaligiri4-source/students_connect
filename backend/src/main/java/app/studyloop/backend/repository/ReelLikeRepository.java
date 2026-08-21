package app.studyloop.backend.repository;

import app.studyloop.backend.domain.ReelLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReelLikeRepository extends JpaRepository<ReelLike, Long> {
    Optional<ReelLike> findByReelIdAndUserId(UUID reelId, UUID userId);
    boolean existsByReelIdAndUserId(UUID reelId, UUID userId);
}
