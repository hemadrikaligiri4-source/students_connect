package app.studyloop.backend.controller;

import app.studyloop.backend.domain.DoubtRoom;
import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.repository.DoubtRoomRepository;
import app.studyloop.backend.repository.ProfileRepository;
import app.studyloop.backend.security.UserPrincipal;
import app.studyloop.backend.service.GamificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/doubts")
public class DoubtRoomController {

    private final DoubtRoomRepository doubtRoomRepository;
    private final ProfileRepository profileRepository;
    private final GamificationService gamificationService;

    public DoubtRoomController(DoubtRoomRepository doubtRoomRepository, 
                               ProfileRepository profileRepository, 
                               GamificationService gamificationService) {
        this.doubtRoomRepository = doubtRoomRepository;
        this.profileRepository = profileRepository;
        this.gamificationService = gamificationService;
    }

    @PostMapping
    public ResponseEntity<?> createDoubtRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody DoubtRoom doubtRoomData) {
        
        Profile creator = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Creator profile not found"));

        if (creator.getCollege() == null) {
            return ResponseEntity.badRequest().body("Please update your profile with your college name before creating a doubt room.");
        }

        DoubtRoom newRoom = DoubtRoom.builder()
                .title(doubtRoomData.getTitle())
                .description(doubtRoomData.getDescription())
                .subject(doubtRoomData.getSubject())
                .creatorId(creator.getId())
                .college(creator.getCollege())
                .status("OPEN")
                .createdAt(Instant.now())
                .build();

        DoubtRoom savedRoom = doubtRoomRepository.save(newRoom);
        return ResponseEntity.ok(savedRoom);
    }

    @GetMapping("/live")
    public ResponseEntity<List<DoubtRoom>> getLiveDoubtRooms(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "allColleges", defaultValue = "false") boolean allColleges) {
        
        Profile user = profileRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found"));

        List<DoubtRoom> rooms;
        if (allColleges || user.getCollege() == null) {
            rooms = doubtRoomRepository.findByStatusOrderByCreatedAtDesc("OPEN");
        } else {
            rooms = doubtRoomRepository.findByStatusAndCollegeOrderByCreatedAtDesc("OPEN", user.getCollege());
        }
        
        return ResponseEntity.ok(rooms);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinDoubtRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        DoubtRoom room = doubtRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doubt room not found"));

        if (!"OPEN".equals(room.getStatus())) {
            return ResponseEntity.badRequest().body("This doubt room is no longer open.");
        }

        if (room.getCreatorId().equals(principal.getId())) {
            return ResponseEntity.badRequest().body("You cannot join your own doubt room as a helper.");
        }

        if (room.getHelperId() != null) {
            if (room.getHelperId().equals(principal.getId())) {
                return ResponseEntity.ok(room); // Already joined
            }
            return ResponseEntity.badRequest().body("Another student is already helping in this room.");
        }

        room.setHelperId(principal.getId());
        DoubtRoom updatedRoom = doubtRoomRepository.save(room);
        return ResponseEntity.ok(updatedRoom);
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveDoubtRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        DoubtRoom room = doubtRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doubt room not found"));

        if (room.getHelperId() != null && room.getHelperId().equals(principal.getId())) {
            room.setHelperId(null);
            doubtRoomRepository.save(room);
            return ResponseEntity.ok(Map.of("message", "You have left helping this doubt room."));
        }

        return ResponseEntity.badRequest().body("You are not the registered helper for this doubt room.");
    }

    @PostMapping("/{id}/solve")
    public ResponseEntity<?> solveDoubtRoom(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        
        DoubtRoom room = doubtRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doubt room not found"));

        if (!room.getCreatorId().equals(principal.getId())) {
            return ResponseEntity.status(403).body("Only the creator of the doubt room can mark it solved.");
        }

        if ("SOLVED".equals(room.getStatus())) {
            return ResponseEntity.badRequest().body("This room is already solved.");
        }

        room.setStatus("SOLVED");
        room.setSolvedAt(Instant.now());
        DoubtRoom savedRoom = doubtRoomRepository.save(room);

        // Award +10 XP to helper if there is one
        if (room.getHelperId() != null) {
            gamificationService.awardXp(room.getHelperId(), 10);
        }

        return ResponseEntity.ok(savedRoom);
    }

    @GetMapping("/my-created")
    public ResponseEntity<List<DoubtRoom>> getMyCreatedDoubts(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(doubtRoomRepository.findByCreatorIdOrderByCreatedAtDesc(principal.getId()));
    }

    @GetMapping("/my-helping")
    public ResponseEntity<List<DoubtRoom>> getMyHelpingDoubts(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(doubtRoomRepository.findByHelperIdOrderByCreatedAtDesc(principal.getId()));
    }
}
