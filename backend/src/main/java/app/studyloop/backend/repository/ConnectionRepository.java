package app.studyloop.backend.repository;

import app.studyloop.backend.domain.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    @Query("SELECT c FROM Connection c WHERE (c.senderId = :id1 AND c.receiverId = :id2) OR (c.senderId = :id2 AND c.receiverId = :id1)")
    Optional<Connection> findConnectionBetween(@Param("id1") UUID id1, @Param("id2") UUID id2);

    List<Connection> findBySenderIdAndStatus(UUID senderId, String status);
    
    List<Connection> findByReceiverIdAndStatus(UUID receiverId, String status);

    @Query("SELECT c FROM Connection c WHERE (c.senderId = :userId OR c.receiverId = :userId) AND c.status = :status")
    List<Connection> findActiveConnectionsFor(@Param("userId") UUID userId, @Param("status") String status);
}
