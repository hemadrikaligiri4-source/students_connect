package app.studyloop.backend.controller;

import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileRepository profileRepository;

    public ProfileController(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
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
        
        return ResponseEntity.ok(profile);
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
        if (updatedData.getBio() != null) profile.setBio(updatedData.getBio());
        if (updatedData.getSkills() != null) profile.setSkills(updatedData.getSkills());
        if (updatedData.getTeachingSkills() != null) profile.setTeachingSkills(updatedData.getTeachingSkills());
        if (updatedData.getLearningGoals() != null) profile.setLearningGoals(updatedData.getLearningGoals());

        profile.setLastActiveAt(Instant.now());
        Profile savedProfile = profileRepository.save(profile);
        return ResponseEntity.ok(savedProfile);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profile> getProfileById(@PathVariable UUID id) {
        return profileRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
