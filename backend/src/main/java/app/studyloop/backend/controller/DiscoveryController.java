package app.studyloop.backend.controller;

import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.dto.DiscoveryCandidateDto;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.security.UserPrincipal;
import app.studyloop.backend.service.DiscoveryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/discovery")
public class DiscoveryController {

    private final DiscoveryService discoveryService;
    private final ProfileRepository profileRepository;

    public DiscoveryController(DiscoveryService discoveryService, ProfileRepository profileRepository) {
        this.discoveryService = discoveryService;
        this.profileRepository = profileRepository;
    }

    @GetMapping
    public ResponseEntity<List<DiscoveryCandidateDto>> getDiscoverablePeers(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "sameCollege", defaultValue = "true") boolean sameCollege) {
        
        Profile viewer = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Viewer profile not found"));

        List<DiscoveryCandidateDto> candidates = discoveryService.getDiscoverablePeers(viewer, sameCollege);
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/mentors")
    public ResponseEntity<List<DiscoveryCandidateDto>> getSeniorMentors(@AuthenticationPrincipal UserPrincipal principal) {
        Profile viewer = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Viewer profile not found"));
        return ResponseEntity.ok(discoveryService.getSeniorMentors(viewer));
    }

    @GetMapping("/skill-swap")
    public ResponseEntity<List<DiscoveryCandidateDto>> getSkillSwapMatches(@AuthenticationPrincipal UserPrincipal principal) {
        Profile viewer = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Viewer profile not found"));
        return ResponseEntity.ok(discoveryService.getSkillSwapMatches(viewer));
    }
}
