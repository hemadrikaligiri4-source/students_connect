package app.studyloop.backend.repository;

import app.studyloop.backend.domain.Endorsement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EndorsementRepository extends JpaRepository<Endorsement, Long> {
    List<Endorsement> findByRecipientId(UUID recipientId);
    Optional<Endorsement> findByEndorserIdAndRecipientIdAndSkill(UUID endorserId, UUID recipientId, String skill);
    boolean existsByEndorserIdAndRecipientIdAndSkill(UUID endorserId, UUID recipientId, String skill);
    long countByRecipientId(UUID recipientId);
}
