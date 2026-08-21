package app.studyloop.backend.service;

import app.studyloop.backend.domain.*;
import app.studyloop.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class GamificationService {

    private final ProfileRepository profileRepository;
    private final BadgeRuleRepository badgeRuleRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final DoubtRoomRepository doubtRoomRepository;
    private final EndorsementRepository endorsementRepository;
    private final CoinTransactionRepository coinTransactionRepository;

    public GamificationService(ProfileRepository profileRepository,
                               BadgeRuleRepository badgeRuleRepository,
                               UserBadgeRepository userBadgeRepository,
                               DoubtRoomRepository doubtRoomRepository,
                               EndorsementRepository endorsementRepository,
                               CoinTransactionRepository coinTransactionRepository) {
        this.profileRepository = profileRepository;
        this.badgeRuleRepository = badgeRuleRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.doubtRoomRepository = doubtRoomRepository;
        this.endorsementRepository = endorsementRepository;
        this.coinTransactionRepository = coinTransactionRepository;
    }

    @Transactional
    public Profile awardXp(UUID userId, int xpAmount) {
        return awardXpAndCoins(userId, xpAmount, 0, "XP Award");
    }

    @Transactional
    public Profile awardXpAndCoins(UUID userId, int xpAmount, int coinsAmount, String description) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found"));

        int currentXp = (profile.getXp() != null) ? profile.getXp() : 0;
        int newXp = currentXp + xpAmount;
        profile.setXp(newXp);

        if (coinsAmount > 0) {
            int currentCoins = (profile.getCoins() != null) ? profile.getCoins() : 0;
            profile.setCoins(currentCoins + coinsAmount);

            app.studyloop.backend.domain.CoinTransaction tx = app.studyloop.backend.domain.CoinTransaction.builder()
                    .userId(userId)
                    .amount(coinsAmount)
                    .type("REWARD")
                    .description(description)
                    .createdAt(Instant.now())
                    .build();
            coinTransactionRepository.save(tx);
        }
        
        // Recalculate level
        String newLevel = calculateLevel(newXp);
        profile.setLevel(newLevel);
        profile.setLastActiveAt(Instant.now());

        Profile savedProfile = profileRepository.save(profile);

        // Evaluate badge rules automatically
        try {
            checkAndAwardBadges(userId);
        } catch (Exception e) {
            System.err.println("Error evaluating badges: " + e.getMessage());
        }

        return savedProfile;
    }

    @Transactional
    public void endorseSkill(UUID endorserId, UUID recipientId, String skill) {
        if (endorserId.equals(recipientId)) {
            throw new IllegalArgumentException("You cannot endorse your own skill");
        }

        boolean exists = endorsementRepository.existsByEndorserIdAndRecipientIdAndSkill(endorserId, recipientId, skill);
        if (exists) {
            throw new IllegalArgumentException("You have already endorsed this skill for this user");
        }

        app.studyloop.backend.domain.Endorsement endorsement = app.studyloop.backend.domain.Endorsement.builder()
                .endorserId(endorserId)
                .recipientId(recipientId)
                .skill(skill)
                .createdAt(Instant.now())
                .build();
        endorsementRepository.save(endorsement);

        // Award +10 XP and +5 Coins to recipient for receiving an endorsement
        awardXpAndCoins(recipientId, 10, 5, "Peer Skill Endorsement: " + skill);
    }

    @Transactional
    public Profile claimDailyStreak(UUID userId) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found"));

        int currentStreak = (profile.getStreak() != null) ? profile.getStreak() : 0;
        profile.setStreak(currentStreak + 1);

        // Award +2 XP and +1 Coin for daily streak login
        return awardXpAndCoins(userId, 2, 1, "Daily Login Streak Claim");
    }

    @Transactional
    public void checkAndAwardBadges(UUID userId) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found"));

        long solvedCount = doubtRoomRepository.countByHelperIdAndStatus(userId, "SOLVED");
        int currentXp = (profile.getXp() != null) ? profile.getXp() : 0;
        int currentStreak = (profile.getStreak() != null) ? profile.getStreak() : 0;

        List<app.studyloop.backend.domain.BadgeRule> rules = badgeRuleRepository.findAll();
        for (app.studyloop.backend.domain.BadgeRule rule : rules) {
            if (userBadgeRepository.existsByUserIdAndBadgeId(userId, rule.getId())) {
                continue;
            }

            boolean qualifies = false;
            switch (rule.getCriteriaType()) {
                case "DOUBTS_SOLVED":
                    qualifies = solvedCount >= rule.getCriteriaValue();
                    break;
                case "SESSIONS_TAUGHT":
                    qualifies = solvedCount >= rule.getCriteriaValue();
                    break;
                case "XP_EARNED":
                    qualifies = currentXp >= rule.getCriteriaValue();
                    break;
                case "STREAK_DAYS":
                    qualifies = currentStreak >= rule.getCriteriaValue();
                    break;
            }

            if (qualifies) {
                app.studyloop.backend.domain.UserBadge award = app.studyloop.backend.domain.UserBadge.builder()
                        .userId(userId)
                        .badgeId(rule.getId())
                        .awardedAt(Instant.now())
                        .build();
                userBadgeRepository.save(award);
            }
        }
    }

    public String calculateLevel(int xp) {
        if (xp >= 1500) {
            return "Master";
        } else if (xp >= 600) {
            return "Expert";
        } else if (xp >= 200) {
            return "Intermediate";
        } else {
            return "Beginner";
        }
    }
}
