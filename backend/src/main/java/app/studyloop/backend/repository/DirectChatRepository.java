package app.studyloop.backend.repository;

import app.studyloop.backend.domain.DirectChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DirectChatRepository extends JpaRepository<DirectChat, UUID> {

    @Query("SELECT d FROM DirectChat d WHERE (d.user1Id = :id1 AND d.user2Id = :id2) OR (d.user1Id = :id2 AND d.user2Id = :id1)")
    Optional<DirectChat> findChatBetween(@Param("id1") UUID id1, @Param("id2") UUID id2);

    @Query("SELECT d FROM DirectChat d WHERE d.user1Id = :userId OR d.user2Id = :userId")
    List<DirectChat> findAllChatsForUser(@Param("userId") UUID userId);
}
