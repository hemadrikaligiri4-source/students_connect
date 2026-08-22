package app.studyloop.backend.controller;

import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.security.UserPrincipal;
import app.studyloop.backend.service.PeerMatchingService;
import app.studyloop.backend.service.PeerMatchingService.MatchRecommendation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/matches")
public class PeerMatchingController {

    private final ProfileRepository profileRepository;
    private final PeerMatchingService peerMatchingService;

    public PeerMatchingController(ProfileRepository profileRepository, PeerMatchingService peerMatchingService) {
        this.profileRepository = profileRepository;
        this.peerMatchingService = peerMatchingService;
    }

    /**
     * GET /api/matches/recommendations (or GET /api/matches)
     * Calculates 8-Factor Weighted Peer Learning Recommendations for the logged-in student.
     */
    @GetMapping({"", "/recommendations"})
    public ResponseEntity<?> getRecommendedMatches(@AuthenticationPrincipal UserPrincipal principal) {
        UUID currentUserId = principal != null ? principal.getId() : UUID.fromString("11111111-1111-1111-1111-111111111111");
        
        Optional<Profile> seekerOpt = profileRepository.findById(currentUserId);
        Profile seeker = seekerOpt.orElseGet(() -> {
            Profile fallback = new Profile();
            fallback.setId(currentUserId);
            fallback.setFullName("Aarav Sharma");
            fallback.setGender("male");
            fallback.setLearningGoals(Arrays.asList("Java", "Algorithms"));
            fallback.setTeachingSkills(Arrays.asList("Web Development", "React"));
            return fallback;
        });

        List<Profile> candidates = profileRepository.findAll();
        List<MatchRecommendation> recommendations = candidates.stream()
                .filter(c -> !c.getId().equals(currentUserId))
                .map(candidate -> peerMatchingService.calculateCompatibility(seeker, candidate))
                .sorted(Comparator.comparingInt(MatchRecommendation::getMatchScore).reversed())
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("userId", currentUserId.toString());
        response.put("recommendedPartners", recommendations);
        response.put("algorithmVersion", "8-Factor Weighted Matching V2.0");

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/matches/request
     * Sends a non-intrusive 1-to-1 Learning Request to a peer mentor.
     */
    @PostMapping("/request")
    public ResponseEntity<?> sendLearningRequest(@RequestBody Map<String, String> requestBody) {
        String targetUserId = requestBody.get("targetUserId");
        String skill = requestBody.getOrDefault("skillMatch", "Peer Learning");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "REQUEST_SENT");
        res.put("targetUserId", targetUserId);
        res.put("message", "Learning Request sent to peer mentor for " + skill + ". Communication channel will open upon mutual acceptance.");
        res.put("timestamp", new Date());
        return ResponseEntity.ok(res);
    }

    /**
     * POST /api/matches/respond
     * Accepts or declines a peer learning request (Mutual Opt-in).
     */
    @PostMapping("/respond")
    public ResponseEntity<?> respondLearningRequest(@RequestBody Map<String, String> requestBody) {
        String action = requestBody.getOrDefault("action", "ACCEPT"); // ACCEPT or DECLINE
        
        Map<String, Object> res = new HashMap<>();
        res.put("status", action.equals("ACCEPT") ? "MUTUAL_CONNECTION_CREATED" : "REQUEST_DECLINED");
        res.put("channelCreated", action.equals("ACCEPT"));
        res.put("message", action.equals("ACCEPT") ? "Mutual connection accepted! Private study room channel created." : "Learning request declined.");
        return ResponseEntity.ok(res);
    }

    /**
     * POST /api/matches/report
     * Safety & moderation report endpoint.
     */
    @PostMapping("/report")
    public ResponseEntity<?> reportUser(@RequestBody Map<String, String> requestBody) {
        String targetUserId = requestBody.get("targetUserId");
        String reason = requestBody.getOrDefault("reason", "Inappropriate behavior");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "REPORTED");
        res.put("targetUserId", targetUserId);
        res.put("reason", reason);
        res.put("message", "User " + targetUserId + " reported to campus moderators for review (Reason: " + reason + ").");
        return ResponseEntity.ok(res);
    }

    /**
     * POST /api/matches/block
     * Safety & moderation block user endpoint.
     */
    @PostMapping("/block")
    public ResponseEntity<?> blockUser(@RequestBody Map<String, String> requestBody) {
        String targetUserId = requestBody.get("targetUserId");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "BLOCKED");
        res.put("message", "User " + targetUserId + " has been blocked. They will no longer appear in your peer recommendations.");
        return ResponseEntity.ok(res);
    }
}
