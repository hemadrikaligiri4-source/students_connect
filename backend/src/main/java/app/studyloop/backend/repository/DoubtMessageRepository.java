package app.studyloop.backend.repository;

import app.studyloop.backend.domain.DoubtMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DoubtMessageRepository extends JpaRepository<DoubtMessage, Long> {
    List<DoubtMessage> findByRoomIdOrderByCreatedAtAsc(UUID roomId);
}
