package app.studyloop.backend.controller;

import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.domain.UserFollow;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.repository.UserFollowRepository;
import app.studyloop.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileRepository profileRepository;
    private final UserFollowRepository userFollowRepository;

    public ProfileController(ProfileRepository profileRepository, UserFollowRepository userFollowRepository) {
        this.profileRepository = profileRepository;
        this.userFollowRepository = userFollowRepository;
    }

    private Profile enrichProfile(Profile profile) {
        if (profile == null) return null;
        profile.setFollowersCount(userFollowRepository.countByFollowingId(profile.getId()));
        profile.setFollowingCount(userFollowRepository.countByFollowerId(profile.getId()));
        return profile;
    }

    @GetMapping("/me")
    public ResponseEntity<Profile> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        Profile profile = profileRepository.findById(principal.getId())
                .orElseGet(() -> {
                    // Fallback registration in case database triggers were bypassed
                    Profile newProfile = Profile.builder()
                            .id(principal.getId())
                            .email(principal.getEmail())
                            .fullName(principal.getEmail().split("@")[0])
                            .createdAt(Instant.now())
                            .build();
                    return profileRepository.save(newProfile);
                });
        
        // Update last active timestamp
        profile.setLastActiveAt(Instant.now());
        profileRepository.save(profile);
        
        return ResponseEntity.ok(enrichProfile(profile));
    }

    @PutMapping("/me")
    public ResponseEntity<Profile> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Profile updatedData) {
        
        Profile profile = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if (updatedData.getFullName() != null) profile.setFullName(updatedData.getFullName());
        if (updatedData.getAvatarUrl() != null) profile.setAvatarUrl(updatedData.getAvatarUrl());
        if (updatedData.getCollege() != null) profile.setCollege(updatedData.getCollege());
        if (updatedData.getDepartment() != null) profile.setDepartment(updatedData.getDepartment());
        if (updatedData.getYear() != null) profile.setYear(updatedData.getYear());
        if (updatedData.getGender() != null) profile.setGender(updatedData.getGender());
        if (updatedData.getBio() != null) profile.setBio(updatedData.getBio());
        if (updatedData.getSkills() != null) profile.setSkills(updatedData.getSkills());
        if (updatedData.getTeachingSkills() != null) profile.setTeachingSkills(updatedData.getTeachingSkills());
        if (updatedData.getLearningGoals() != null) profile.setLearningGoals(updatedData.getLearningGoals());

        profile.setLastActiveAt(Instant.now());
        Profile savedProfile = profileRepository.save(profile);
        return ResponseEntity.ok(enrichProfile(savedProfile));
    }

    @PutMapping("/me/avatar")
    public ResponseEntity<Profile> updateAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        
        String avatarUrl = body.get("avatarUrl");
        if (avatarUrl == null || avatarUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Profile profile = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        profile.setAvatarUrl(avatarUrl);
        profile.setLastActiveAt(Instant.now());
        Profile savedProfile = profileRepository.save(profile);
        return ResponseEntity.ok(enrichProfile(savedProfile));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profile> getProfileById(@PathVariable UUID id) {
        return profileRepository.findById(id)
                .map(this::enrichProfile)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<?> followUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        UUID followerId = principal.getId();
        if (followerId.equals(id)) {
            return ResponseEntity.badRequest().body("You cannot follow yourself");
        }

        if (!profileRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        if (!userFollowRepository.existsByFollowerIdAndFollowingId(followerId, id)) {
            UserFollow follow = UserFollow.builder()
                    .followerId(followerId)
                    .followingId(id)
                    .createdAt(Instant.now())
                    .build();
            userFollowRepository.save(follow);
        }

        long followersCount = userFollowRepository.countByFollowingId(id);
        return ResponseEntity.ok(Map.of(
            "following", true,
            "followersCount", followersCount
        ));
    }

    @PostMapping("/{id}/unfollow")
    public ResponseEntity<?> unfollowUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        UUID followerId = principal.getId();
        userFollowRepository.findByFollowerIdAndFollowingId(followerId, id)
                .ifPresent(userFollowRepository::delete);

        long followersCount = userFollowRepository.countByFollowingId(id);
        return ResponseEntity.ok(Map.of(
            "following", false,
            "followersCount", followersCount
        ));
    }

    @GetMapping("/{id}/follow-status")
    public ResponseEntity<?> getFollowStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        boolean following = userFollowRepository.existsByFollowerIdAndFollowingId(principal.getId(), id);
        long followersCount = userFollowRepository.countByFollowingId(id);
        long followingCount = userFollowRepository.countByFollowerId(id);

        return ResponseEntity.ok(Map.of(
            "following", following,
            "followersCount", followersCount,
            "followingCount", followingCount
        ));
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<List<Profile>> getFollowers(@PathVariable UUID id) {
        List<UserFollow> follows = userFollowRepository.findByFollowingId(id);
        List<UUID> followerIds = follows.stream().map(UserFollow::getFollowerId).collect(Collectors.toList());
        List<Profile> followers = profileRepository.findAllById(followerIds).stream()
                .map(this::enrichProfile)
                .collect(Collectors.toList());

        return ResponseEntity.ok(followers);
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<List<Profile>> getFollowing(@PathVariable UUID id) {
        List<UserFollow> follows = userFollowRepository.findByFollowerId(id);
        List<UUID> followingIds = follows.stream().map(UserFollow::getFollowingId).collect(Collectors.toList());
        List<Profile> following = profileRepository.findAllById(followingIds).stream()
                .map(this::enrichProfile)
                .collect(Collectors.toList());

        return ResponseEntity.ok(following);
    }
}
