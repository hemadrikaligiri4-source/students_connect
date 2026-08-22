package app.studyloop.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "admin_audit_logs")
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_id")
    private UUID adminId;

    @Column(nullable = false)
    private String action;

    @Column(columnDefinition = "text")
    private String details;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public AdminAuditLog() {}

    public AdminAuditLog(Long id, UUID adminId, String action, String details, Instant createdAt) {
        this.id = id;
        this.adminId = adminId;
        this.action = action;
        this.details = details;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getAdminId() { return adminId; }
    public void setAdminId(UUID adminId) { this.adminId = adminId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private UUID adminId;
        private String action;
        private String details;
        private Instant createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder adminId(UUID adminId) { this.adminId = adminId; return this; }
        public Builder action(String action) { this.action = action; return this; }
        public Builder details(String details) { this.details = details; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public AdminAuditLog build() {
            return new AdminAuditLog(id, adminId, action, details, createdAt);
        }
    }
}
