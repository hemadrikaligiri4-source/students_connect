package app.studyloop.backend.controller;

import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.dto.FeedItemDto;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.security.UserPrincipal;
import app.studyloop.backend.service.FeedService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/feed")
public class FeedController {

    private final FeedService feedService;
    private final ProfileRepository profileRepository;

    public FeedController(FeedService feedService, ProfileRepository profileRepository) {
        this.feedService = feedService;
        this.profileRepository = profileRepository;
    }

    @GetMapping
    public ResponseEntity<List<FeedItemDto>> getHomeFeed(@AuthenticationPrincipal UserPrincipal principal) {
        Profile viewer = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Viewer profile not found"));

        List<FeedItemDto> feed = feedService.getHomeFeed(viewer);
        return ResponseEntity.ok(feed);
    }
}
