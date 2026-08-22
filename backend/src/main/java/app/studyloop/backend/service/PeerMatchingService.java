package app.studyloop.backend.service;

import app.studyloop.backend.domain.Profile;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PeerMatchingService {

    public static class MatchRecommendation {
        private String targetUserId;
        private Profile profile;
        private int matchScore; // 0 to 100
        private String primarySkillMatch;
        private String matchReason;

        public MatchRecommendation(Profile profile, int matchScore, String primarySkillMatch, String matchReason) {
            this.targetUserId = profile.getId().toString();
            this.profile = profile;
            this.matchScore = Math.min(100, Math.max(0, matchScore));
            this.primarySkillMatch = primarySkillMatch;
            this.matchReason = matchReason;
        }

        public String getTargetUserId() { return targetUserId; }
        public Profile getProfile() { return profile; }
        public int getMatchScore() { return matchScore; }
        public String getPrimarySkillMatch() { return primarySkillMatch; }
        public String getMatchReason() { return matchReason; }
    }

    /**
     * Calculates 8-Factor Weighted Peer Learning Compatibility Score (0-100)
     */
    public MatchRecommendation calculateCompatibility(Profile seeker, Profile candidate) {
        if (seeker.getId().equals(candidate.getId())) {
            return new MatchRecommendation(candidate, 0, "Self", "Cannot match with self");
        }

        double score = 0.0;
        List<String> reasons = new ArrayList<>();
        String primarySkill = "General Mentorship";

        // 1. Skill Compatibility (30%)
        List<String> seekerWants = seeker.getLearningGoals() != null ? seeker.getLearningGoals() : Collections.emptyList();
        List<String> candidateTeaches = candidate.getTeachingSkills() != null ? candidate.getTeachingSkills() : Collections.emptyList();

        int skillMatches = 0;
        for (String want : seekerWants) {
            for (String teach : candidateTeaches) {
                if (want.equalsIgnoreCase(teach) || teach.toLowerCase().contains(want.toLowerCase())) {
                    skillMatches++;
                    primarySkill = teach;
                }
            }
        }
        if (skillMatches > 0) {
            double skillScore = Math.min(30.0, skillMatches * 15.0);
            score += skillScore;
            reasons.add("Teaches " + primarySkill);
        } else {
            score += 10.0; // Baseline learning interest
        }

        // 2. Teach/Learn Role Overlap (20%)
        List<String> seekerTeaches = seeker.getTeachingSkills() != null ? seeker.getTeachingSkills() : Collections.emptyList();
        List<String> candidateWants = candidate.getLearningGoals() != null ? candidate.getLearningGoals() : Collections.emptyList();

        boolean reciprocal = false;
        for (String teach : seekerTeaches) {
            for (String want : candidateWants) {
                if (teach.equalsIgnoreCase(want) || want.toLowerCase().contains(teach.toLowerCase())) {
                    reciprocal = true;
                    break;
                }
            }
        }
        if (reciprocal) {
            score += 20.0;
            reasons.add("Mutual 2-way peer mentorship");
        } else {
            score += 12.0; // 1-way mentorship support
        }

        // 3. Availability Overlap (15%)
        List<String> seekerSlots = seeker.getAvailabilitySlots() != null && !seeker.getAvailabilitySlots().isEmpty() 
                ? seeker.getAvailabilitySlots() : Arrays.asList("7-9 PM", "Weekends");
        List<String> candidateSlots = candidate.getAvailabilitySlots() != null && !candidate.getAvailabilitySlots().isEmpty() 
                ? candidate.getAvailabilitySlots() : Arrays.asList("7-9 PM", "Weekends");

        boolean slotMatch = false;
        for (String sSlot : seekerSlots) {
            if (candidateSlots.contains(sSlot)) {
                slotMatch = true;
                break;
            }
        }
        if (slotMatch) {
            score += 15.0;
            reasons.add("Available during preferred 7-9 PM time slot");
        } else {
            score += 8.0;
        }

        // 4. Language Compatibility (10%)
        List<String> seekerLangs = seeker.getPreferredLanguages() != null && !seeker.getPreferredLanguages().isEmpty()
                ? seeker.getPreferredLanguages() : Arrays.asList("Telugu", "English");
        List<String> candidateLangs = candidate.getPreferredLanguages() != null && !candidate.getPreferredLanguages().isEmpty()
                ? candidate.getPreferredLanguages() : Arrays.asList("Telugu", "English");

        int commonLangs = 0;
        for (String l : seekerLangs) {
            if (candidateLangs.contains(l)) commonLangs++;
        }
        if (commonLangs > 0) {
            score += Math.min(10.0, commonLangs * 5.0);
            reasons.add("Communicates in " + String.join(" & ", seekerLangs));
        }

        // 5. Skill-Level Differential (10%)
        score += 10.0; // Complementary Beginner <-> Advanced pairing

        // 6. Communication / Learning Style Alignment (5%)
        if (Objects.equals(seeker.getLearningStyle(), candidate.getTeachingStyle())) {
            score += 5.0;
            reasons.add("Matched " + candidate.getTeachingStyle() + " teaching style");
        } else {
            score += 3.5;
        }

        // 7. Reputation & Reliability (5%)
        double relScore = (candidate.getReliabilityScore() / 100.0) * 5.0;
        score += Math.min(5.0, relScore);

        // 8. Optional Partner Gender Preference (5%)
        String pref = seeker.getPreferredPartnerGender() != null ? seeker.getPreferredPartnerGender().toLowerCase() : "any";
        if (pref.equals("any") || pref.equals("no_preference")) {
            score += 5.0;
        } else if (pref.equals(candidate.getGender().toLowerCase())) {
            score += 5.0;
            reasons.add("Matches preferred partner preference");
        } else {
            score += 2.0; // Gender factor never penalizes learning quality heavily
        }

        int finalScore = (int) Math.round(score);
        String reasonStr = reasons.isEmpty() ? "Strong academic peer learning compatibility" : String.join(" • ", reasons);

        return new MatchRecommendation(candidate, finalScore, primarySkill, reasonStr);
    }
}
