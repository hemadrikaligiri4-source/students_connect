package app.studyloop.backend.controller;

import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final ProfileRepository profileRepository;

    public LeaderboardController(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @GetMapping
    public ResponseEntity<List<Profile>> getLeaderboard(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "college", required = false) String college,
            @RequestParam(name = "subject", required = false) String subject) {
        
        String targetCollege = college;
        if (targetCollege == null || targetCollege.trim().isEmpty()) {
            Profile user = profileRepository.findById(principal.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Student profile not found"));
            targetCollege = user.getCollege();
        }

        if (targetCollege == null || targetCollege.trim().isEmpty()) {
            return ResponseEntity.badRequest().build(); // user needs a college set or must specify one
        }

        // Fetch profiles sorted by XP descending
        List<Profile> leaders = profileRepository.findByCollege(targetCollege);
        
        // Filter by subject if specified (check if subject is in their teaching_skills or skills)
        if (subject != null && !subject.trim().isEmpty()) {
            final String subLower = subject.trim().toLowerCase();
            leaders = leaders.stream()
                    .filter(p -> {
                        boolean match = false;
                        if (p.getTeachingSkills() != null) {
                            match = p.getTeachingSkills().stream().anyMatch(s -> s.toLowerCase().contains(subLower));
                        }
                        if (!match && p.getSkills() != null) {
                            match = p.getSkills().stream().anyMatch(s -> s.toLowerCase().contains(subLower));
                        }
                        return match;
                    })
                    .collect(Collectors.toList());
        }

        // Sort by XP descending, and cap/rank
        leaders.sort((p1, p2) -> {
            int xp1 = p1.getXp() != null ? p1.getXp() : 0;
            int xp2 = p2.getXp() != null ? p2.getXp() : 0;
            return Integer.compare(xp2, xp1);
        });

        return ResponseEntity.ok(leaders);
    }
}
