package app.studyloop.backend.controller;

import app.studyloop.backend.domain.BadgeRule;
import app.studyloop.backend.domain.CoinTransaction;
import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.domain.UserBadge;
import app.studyloop.backend.repository.*;
import app.studyloop.backend.security.UserPrincipal;
import app.studyloop.backend.service.GamificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/gamification")
public class GamificationController {

    private final ProfileRepository profileRepository;
    private final DoubtRoomRepository doubtRoomRepository;
    private final BadgeRuleRepository badgeRuleRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final EndorsementRepository endorsementRepository;
    private final CoinTransactionRepository coinTransactionRepository;
    private final UserFollowRepository userFollowRepository;
    private final GamificationService gamificationService;

    public GamificationController(ProfileRepository profileRepository,
                                  DoubtRoomRepository doubtRoomRepository,
                                  BadgeRuleRepository badgeRuleRepository,
                                  UserBadgeRepository userBadgeRepository,
                                  EndorsementRepository endorsementRepository,
                                  CoinTransactionRepository coinTransactionRepository,
                                  UserFollowRepository userFollowRepository,
                                  GamificationService gamificationService) {
        this.profileRepository = profileRepository;
        this.doubtRoomRepository = doubtRoomRepository;
        this.badgeRuleRepository = badgeRuleRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.endorsementRepository = endorsementRepository;
        this.coinTransactionRepository = coinTransactionRepository;
        this.userFollowRepository = userFollowRepository;
        this.gamificationService = gamificationService;
    }

    @GetMapping("/badges")
    public ResponseEntity<List<BadgeRule>> getMyBadges(@AuthenticationPrincipal UserPrincipal principal) {
        List<UserBadge> userBadges = userBadgeRepository.findByUserId(principal.getId());
        List<Long> badgeIds = userBadges.stream().map(UserBadge::getBadgeId).collect(Collectors.toList());
        List<BadgeRule> badges = badgeRuleRepository.findAllById(badgeIds);
        return ResponseEntity.ok(badges);
    }

    @GetMapping("/rules")
    public ResponseEntity<List<BadgeRule>> getBadgeRules() {
        return ResponseEntity.ok(badgeRuleRepository.findAll());
    }

    @PostMapping("/streak/claim")
    public ResponseEntity<Profile> claimStreak(@AuthenticationPrincipal UserPrincipal principal) {
        Profile updated = gamificationService.claimDailyStreak(principal.getId());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/endorse")
    public ResponseEntity<?> endorsePeerSkill(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID recipientId,
            @RequestParam String skill) {
        
        try {
            gamificationService.endorseSkill(principal.getId(), recipientId, skill);
            return ResponseEntity.ok(Map.of("message", "Skill endorsed successfully! +10 XP awarded to recipient."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/coins/transactions")
    public ResponseEntity<List<CoinTransaction>> getCoinTransactions(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(coinTransactionRepository.findByUserIdOrderByCreatedAtDesc(principal.getId()));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData(@AuthenticationPrincipal UserPrincipal principal) {
        Profile profile = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        long doubtsSolved = doubtRoomRepository.countByHelperIdAndStatus(principal.getId(), "SOLVED");
        long endorsementsReceived = endorsementRepository.countByRecipientId(principal.getId());

        // Calculate rank on college leaderboard
        int campusRank = 1;
        if (profile.getCollege() != null) {
            List<Profile> collegeStudents = profileRepository.findByCollege(profile.getCollege());
            collegeStudents.sort((p1, p2) -> {
                int xp1 = p1.getXp() != null ? p1.getXp() : 0;
                int xp2 = p2.getXp() != null ? p2.getXp() : 0;
                return Integer.compare(xp2, xp1);
            });

            for (int i = 0; i < collegeStudents.size(); i++) {
                if (collegeStudents.get(i).getId().equals(profile.getId())) {
                    campusRank = i + 1;
                    break;
                }
            }
        }

        // Fetch earned badges
        List<UserBadge> userBadges = userBadgeRepository.findByUserId(principal.getId());
        List<Long> badgeIds = userBadges.stream().map(UserBadge::getBadgeId).collect(Collectors.toList());
        List<BadgeRule> earnedBadges = badgeRuleRepository.findAllById(badgeIds);

        int xp = profile.getXp() != null ? profile.getXp() : 0;
        int prevThreshold = 0;
        int nextThreshold = 200;
        String currentLevel = profile.getLevel();

        if ("Intermediate".equalsIgnoreCase(currentLevel)) {
            prevThreshold = 200;
            nextThreshold = 600;
        } else if ("Expert".equalsIgnoreCase(currentLevel)) {
            prevThreshold = 600;
            nextThreshold = 1500;
        } else if ("Master".equalsIgnoreCase(currentLevel)) {
            prevThreshold = 1500;
            nextThreshold = 5000;
        }

        int range = nextThreshold - prevThreshold;
        int progress = xp - prevThreshold;
        double progressPercent = ((double) progress / range) * 100;
        if (progressPercent > 100) progressPercent = 100;
        if (progressPercent < 0) progressPercent = 0;

        Map<String, Object> data = new HashMap<>();
        data.put("profile", enrichProfile(profile));
        data.put("doubtsSolved", doubtsSolved);
        data.put("endorsementsReceived", endorsementsReceived);
        data.put("campusRank", campusRank);
        data.put("badges", earnedBadges);
        data.put("prevLevelXpThreshold", prevThreshold);
        data.put("nextLevelXpThreshold", nextThreshold);
        data.put("xpProgressPercentage", (int) progressPercent);

        return ResponseEntity.ok(data);
    }

    private Profile enrichProfile(Profile p) {
        if (p == null) return null;
        if (userFollowRepository != null) {
            p.setFollowersCount(userFollowRepository.countByFollowingId(p.getId()));
            p.setFollowingCount(userFollowRepository.countByFollowerId(p.getId()));
        }
        return p;
    }
}
