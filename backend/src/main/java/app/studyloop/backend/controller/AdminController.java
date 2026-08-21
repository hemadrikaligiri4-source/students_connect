package app.studyloop.backend.controller;

import app.studyloop.backend.domain.*;
import app.studyloop.backend.repository.*;
import app.studyloop.backend.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminUserRepository adminUserRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final ProfileRepository profileRepository;
    private final DoubtRoomRepository doubtRoomRepository;
    private final ReelRepository reelRepository;
    private final BadgeRuleRepository badgeRuleRepository;

    public AdminController(AdminUserRepository adminUserRepository,
                           AdminAuditLogRepository auditLogRepository,
                           ProfileRepository profileRepository,
                           DoubtRoomRepository doubtRoomRepository,
                           ReelRepository reelRepository,
                           BadgeRuleRepository badgeRuleRepository) {
        this.adminUserRepository = adminUserRepository;
        this.auditLogRepository = auditLogRepository;
        this.profileRepository = profileRepository;
        this.doubtRoomRepository = doubtRoomRepository;
        this.reelRepository = reelRepository;
        this.badgeRuleRepository = badgeRuleRepository;
    }

    private AdminUser verifyAdmin(UserPrincipal principal) {
        // Authenticate admin based on their Supabase authenticated email
        return adminUserRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Access Denied: Not registered as administrator."));
    }

    private void logAdminAction(UUID adminId, String action, String details) {
        AdminAuditLog logEntry = AdminAuditLog.builder()
                .adminId(adminId)
                .action(action)
                .details(details)
                .createdAt(Instant.now())
                .build();
        auditLogRepository.save(logEntry);
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkAdminStatus(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            AdminUser admin = verifyAdmin(principal);
            return ResponseEntity.ok(admin);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(@AuthenticationPrincipal UserPrincipal principal) {
        verifyAdmin(principal);

        long totalUsers = profileRepository.count();
        long totalDoubts = doubtRoomRepository.count();
        long solvedDoubts = doubtRoomRepository.findByStatusOrderByCreatedAtDesc("SOLVED").size();
        long liveDoubts = doubtRoomRepository.findByStatusOrderByCreatedAtDesc("OPEN").size();
        long totalReels = reelRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalDoubts", totalDoubts);
        stats.put("solvedDoubts", solvedDoubts);
        stats.put("liveDoubts", liveDoubts);
        stats.put("totalReels", totalReels);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal UserPrincipal principal) {
        verifyAdmin(principal);
        return ResponseEntity.ok(profileRepository.findAll());
    }

    @PostMapping("/users/{id}/reputation")
    public ResponseEntity<?> updateUserReputation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam double rating) {
        
        AdminUser admin = verifyAdmin(principal);
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        double oldRep = profile.getReputation().doubleValue();
        profile.setReputation(new java.math.BigDecimal(String.valueOf(rating)));
        profileRepository.save(profile);

        logAdminAction(admin.getId(), "UPDATE_REPUTATION", 
                String.format("Updated user %s reputation from %f to %f", id, oldRep, rating));

        return ResponseEntity.ok(profile);
    }

    @PostMapping("/users/{id}/suspend")
    public ResponseEntity<?> suspendUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        AdminUser admin = verifyAdmin(principal);
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        // Simulate suspension by resetting XP / resetting fields
        profile.setBio("[SUSPENDED BY ADMIN]");
        profile.setReputation(java.math.BigDecimal.ZERO);
        profileRepository.save(profile);

        logAdminAction(admin.getId(), "SUSPEND_USER", 
                String.format("Suspended user %s and reset reputation to 0", id));

        return ResponseEntity.ok(Map.of("message", "User has been suspended."));
    }

    @GetMapping("/doubts")
    public ResponseEntity<?> getAllDoubts(@AuthenticationPrincipal UserPrincipal principal) {
        verifyAdmin(principal);
        return ResponseEntity.ok(doubtRoomRepository.findAll());
    }

    @PostMapping("/badges/rule")
    public ResponseEntity<?> configureBadgeRule(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody BadgeRule badgeRuleData) {
        
        AdminUser admin = verifyAdmin(principal);
        
        BadgeRule rule;
        if (badgeRuleData.getId() != null) {
            rule = badgeRuleRepository.findById(badgeRuleData.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Rule not found"));
            rule.setName(badgeRuleData.getName());
            rule.setDescription(badgeRuleData.getDescription());
            rule.setCriteriaType(badgeRuleData.getCriteriaType());
            rule.setCriteriaValue(badgeRuleData.getCriteriaValue());
            rule.setIconUrl(badgeRuleData.getIconUrl());
        } else {
            rule = badgeRuleData;
        }

        BadgeRule savedRule = badgeRuleRepository.save(rule);
        logAdminAction(admin.getId(), "CONFIGURE_BADGE_RULE", 
                String.format("Configured badge rule: %s (%s)", savedRule.getName(), savedRule.getCriteriaType()));

        return ResponseEntity.ok(savedRule);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(@AuthenticationPrincipal UserPrincipal principal) {
        verifyAdmin(principal);
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc());
    }
}
