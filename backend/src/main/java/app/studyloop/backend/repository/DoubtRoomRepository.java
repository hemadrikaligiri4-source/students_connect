package app.studyloop.backend.repository;

import app.studyloop.backend.domain.DoubtRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DoubtRoomRepository extends JpaRepository<DoubtRoom, UUID> {
    List<DoubtRoom> findByStatusAndCollegeOrderByCreatedAtDesc(String status, String college);
    List<DoubtRoom> findByCreatorIdOrderByCreatedAtDesc(UUID creatorId);
    List<DoubtRoom> findByHelperIdOrderByCreatedAtDesc(UUID helperId);
    List<DoubtRoom> findByStatusOrderByCreatedAtDesc(String status);
    long countByHelperIdAndStatus(UUID helperId, String status);
}
