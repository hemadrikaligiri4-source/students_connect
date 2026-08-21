package app.studyloop.backend.dto;

import app.studyloop.backend.domain.DoubtRoom;
import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.domain.Reel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedItemDto {
    private String type; // "DOUBT_ROOM" or "REEL"
    private UUID id;
    private String title;
    private String description;
    private String subject;
    private String college;
    private Instant createdAt;
    private Profile creator;
    private int score;
    private DoubtRoom doubtRoom;
    private Reel reel;
}
