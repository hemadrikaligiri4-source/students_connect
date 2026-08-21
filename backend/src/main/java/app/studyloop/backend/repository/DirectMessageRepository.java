package app.studyloop.backend.repository;

import app.studyloop.backend.domain.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    List<DirectMessage> findByChatIdOrderByCreatedAtAsc(UUID chatId);
}
