package app.studyloop.backend.dto;

import app.studyloop.backend.domain.Profile;
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
public class DirectChatThreadDto {
    private UUID chatId;
    private Profile peer;
    private Instant createdAt;
}
