package app.studyloop.backend.controller;

import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.domain.Reel;
import app.studyloop.backend.domain.ReelComment;
import app.studyloop.backend.domain.ReelLike;
import app.studyloop.backend.dto.ReelCommentDto;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.repository.ReelCommentRepository;
import app.studyloop.backend.repository.ReelLikeRepository;
import app.studyloop.backend.repository.ReelRepository;
import app.studyloop.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reels")
public class ReelController {

    private final ReelRepository reelRepository;
    private final ReelLikeRepository reelLikeRepository;
    private final ReelCommentRepository reelCommentRepository;
    private final ProfileRepository profileRepository;

    public ReelController(ReelRepository reelRepository,
                          ReelLikeRepository reelLikeRepository,
                          ReelCommentRepository reelCommentRepository,
                          ProfileRepository profileRepository) {
        this.reelRepository = reelRepository;
        this.reelLikeRepository = reelLikeRepository;
        this.reelCommentRepository = reelCommentRepository;
        this.profileRepository = profileRepository;
    }

    @GetMapping
    public ResponseEntity<List<Reel>> getAllReels() {
        return ResponseEntity.ok(reelRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<?> createReel(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Reel reelData) {
        
        if (reelData.getVideoUrl() == null || reelData.getVideoUrl().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Video URL is required");
        }
        if (reelData.getSubject() == null || reelData.getSubject().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Subject is required");
        }

        Reel newReel = Reel.builder()
                .creatorId(principal.getId())
                .videoUrl(reelData.getVideoUrl())
                .thumbnailUrl(reelData.getThumbnailUrl())
                .description(reelData.getDescription())
                .subject(reelData.getSubject())
                .likesCount(0)
                .commentsCount(0)
                .createdAt(Instant.now())
                .build();

        Reel savedReel = reelRepository.save(newReel);
        return ResponseEntity.ok(savedReel);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        Reel reel = reelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reel not found"));

        Optional<ReelLike> existingLike = reelLikeRepository.findByReelIdAndUserId(id, principal.getId());
        boolean liked;

        if (existingLike.isPresent()) {
            reelLikeRepository.delete(existingLike.get());
            reel.setLikesCount(Math.max(0, reel.getLikesCount() - 1));
            liked = false;
        } else {
            ReelLike newLike = ReelLike.builder()
                    .reelId(id)
                    .userId(principal.getId())
                    .createdAt(Instant.now())
                    .build();
            reelLikeRepository.save(newLike);
            reel.setLikesCount(reel.getLikesCount() + 1);
            liked = true;
        }

        reelRepository.save(reel);
        return ResponseEntity.ok(Map.of(
            "liked", liked,
            "likesCount", reel.getLikesCount()
        ));
    }

    @GetMapping("/{id}/like-status")
    public ResponseEntity<?> getLikeStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        boolean liked = reelLikeRepository.existsByReelIdAndUserId(id, principal.getId());
        return ResponseEntity.ok(Map.of("liked", liked));
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        
        String commentText = body.get("comment");
        if (commentText == null || commentText.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Comment text is required");
        }

        Reel reel = reelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reel not found"));

        ReelComment newComment = ReelComment.builder()
                .reelId(id)
                .userId(principal.getId())
                .comment(commentText)
                .createdAt(Instant.now())
                .build();

        reelCommentRepository.save(newComment);
        reel.setCommentsCount(reel.getCommentsCount() + 1);
        reelRepository.save(reel);

        Profile user = profileRepository.findById(principal.getId()).orElse(null);
        ReelCommentDto dto = ReelCommentDto.builder()
                .comment(newComment)
                .user(user)
                .build();

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<ReelCommentDto>> getComments(@PathVariable UUID id) {
        List<ReelComment> comments = reelCommentRepository.findByReelIdOrderByCreatedAtDesc(id);
        List<ReelCommentDto> dtos = comments.stream()
                .map(c -> {
                    Profile user = profileRepository.findById(c.getUserId()).orElse(null);
                    return ReelCommentDto.builder()
                            .comment(c)
                            .user(user)
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
