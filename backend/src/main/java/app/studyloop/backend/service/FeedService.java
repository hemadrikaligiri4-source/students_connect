package app.studyloop.backend.service;

import app.studyloop.backend.domain.*;
import app.studyloop.backend.dto.FeedItemDto;
import app.studyloop.backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class FeedService {

    private final DoubtRoomRepository doubtRoomRepository;
    private final ReelRepository reelRepository;
    private final ProfileRepository profileRepository;
    private final CollegeExamCalendarRepository examCalendarRepository;

    public FeedService(DoubtRoomRepository doubtRoomRepository,
                       ReelRepository reelRepository,
                       ProfileRepository profileRepository,
                       CollegeExamCalendarRepository examCalendarRepository) {
        this.doubtRoomRepository = doubtRoomRepository;
        this.reelRepository = reelRepository;
        this.profileRepository = profileRepository;
        this.examCalendarRepository = examCalendarRepository;
    }

    public List<FeedItemDto> getHomeFeed(Profile viewer) {
        List<FeedItemDto> feedItems = new ArrayList<>();

        // 1. Fetch live doubt rooms
        List<DoubtRoom> liveDoubts = doubtRoomRepository.findByStatusOrderByCreatedAtDesc("OPEN");
        for (DoubtRoom room : liveDoubts) {
            Profile creator = profileRepository.findById(room.getCreatorId()).orElse(null);
            feedItems.add(FeedItemDto.builder()
                    .type("DOUBT_ROOM")
                    .id(room.getId())
                    .title(room.getTitle())
                    .description(room.getDescription())
                    .subject(room.getSubject())
                    .college(room.getCollege())
                    .createdAt(room.getCreatedAt())
                    .creator(creator)
                    .doubtRoom(room)
                    .build());
        }

        // 2. Fetch educational reels
        List<Reel> reels = reelRepository.findAllByOrderByCreatedAtDesc();
        for (Reel reel : reels) {
            Profile creator = profileRepository.findById(reel.getCreatorId()).orElse(null);
            // Fetch creator's college if available to check college match
            String college = creator != null ? creator.getCollege() : "";
            feedItems.add(FeedItemDto.builder()
                    .type("REEL")
                    .id(reel.getId())
                    .title("Educational Reel")
                    .description(reel.getDescription())
                    .subject(reel.getSubject())
                    .college(college)
                    .createdAt(reel.getCreatedAt())
                    .creator(creator)
                    .reel(reel)
                    .build());
        }

        // 3. Fetch viewer's college exams to apply exam radar boost
        List<CollegeExamCalendar> upcomingExams = new ArrayList<>();
        if (viewer.getCollege() != null) {
            upcomingExams = examCalendarRepository.findByCollegeAndExamDateGreaterThanEqual(
                    viewer.getCollege(), LocalDate.now());
        }

        // 4. Calculate scores for all items
        for (FeedItemDto item : feedItems) {
            int score = calculateScore(viewer, item, upcomingExams);
            item.setScore(score);
        }

        // 5. Sort feed items: highest score first, then by recency
        feedItems.sort((i1, i2) -> {
            int scoreCompare = Integer.compare(i2.getScore(), i1.getScore());
            if (scoreCompare != 0) {
                return scoreCompare;
            }
            return i2.getCreatedAt().compareTo(i1.getCreatedAt());
        });

        return feedItems;
    }

    private int calculateScore(Profile viewer, FeedItemDto item, List<CollegeExamCalendar> upcomingExams) {
        int score = 0;

        // A. Matches viewer subject interest (+30)
        boolean matchesInterest = false;
        if (item.getSubject() != null) {
            String subject = item.getSubject().trim().toLowerCase();
            
            // Check learning goals
            if (viewer.getLearningGoals() != null) {
                for (String goal : viewer.getLearningGoals()) {
                    if (goal.trim().toLowerCase().contains(subject) || subject.contains(goal.trim().toLowerCase())) {
                        matchesInterest = true;
                        break;
                    }
                }
            }
            // Check current skills
            if (!matchesInterest && viewer.getSkills() != null) {
                for (String skill : viewer.getSkills()) {
                    if (skill.trim().toLowerCase().contains(subject) || subject.contains(skill.trim().toLowerCase())) {
                        matchesInterest = true;
                        break;
                    }
                }
            }
        }
        if (matchesInterest) {
            score += 30;
        }

        // B. Is live Doubt Room (+40) (live urgency)
        if ("DOUBT_ROOM".equals(item.getType())) {
            score += 40;
        }

        // C. Same College Content (+25)
        if (viewer.getCollege() != null && viewer.getCollege().equalsIgnoreCase(item.getCollege())) {
            score += 25;
        }

        // D. Exam Week Relevance (+35): if subject has an exam in <= 10 days
        boolean hasUpcomingExam = false;
        if (item.getSubject() != null && !upcomingExams.isEmpty()) {
            LocalDate today = LocalDate.now();
            for (CollegeExamCalendar exam : upcomingExams) {
                if (exam.getSubject().equalsIgnoreCase(item.getSubject())) {
                    long daysToExam = Duration.between(today.atStartOfDay(), exam.getExamDate().atStartOfDay()).toDays();
                    if (daysToExam >= 0 && daysToExam <= 10) {
                        hasUpcomingExam = true;
                        break;
                    }
                }
            }
        }
        if (hasUpcomingExam) {
            score += 35;
        }

        // E. Recency Decay (newer content scores higher, decays over 48h)
        long hoursOld = Duration.between(item.getCreatedAt(), Instant.now()).toHours();
        // Linear decay: 50 points max, drops to 0 at 48 hours (decay factor of 1.04 points/hour)
        int recencyScore = (int) Math.max(0, 50 - (hoursOld * 1.04));
        score += recencyScore;

        // F. Engagement Velocity
        int engagementScore = 0;
        if ("REEL".equals(item.getType()) && item.getReel() != null) {
            Reel r = item.getReel();
            int likes = r.getLikesCount() != null ? r.getLikesCount() : 0;
            int comments = r.getCommentsCount() != null ? r.getCommentsCount() : 0;
            // 2 points per interaction, capped at +30 points
            engagementScore = Math.min(30, (likes + comments) * 2);
        } else if ("DOUBT_ROOM".equals(item.getType()) && item.getDoubtRoom() != null) {
            // Live room has active helper (+15 points for visual activity velocity)
            if (item.getDoubtRoom().getHelperId() != null) {
                engagementScore = 15;
            }
        }
        score += engagementScore;

        return score;
    }
}
