package app.studyloop.backend.dto;

import app.studyloop.backend.domain.Profile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionDto {
    private Long connectionId;
    private Profile profile;
    private String status;
    private Instant createdAt;
}
