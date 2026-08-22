package app.studyloop.backend.repository;

import app.studyloop.backend.domain.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {
    long countByFollowerId(UUID followerId); // Total users this user is FOLLOWING
    long countByFollowingId(UUID followingId); // Total users FOLLOWING this user

    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
    Optional<UserFollow> findByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    List<UserFollow> findByFollowerId(UUID followerId); // Users followed by this user
    List<UserFollow> findByFollowingId(UUID followingId); // Followers of this user
}
