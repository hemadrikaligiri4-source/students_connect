package app.studyloop.backend.dto;

import app.studyloop.backend.domain.Profile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscoveryCandidateDto {
    private Profile profile;
    private int score;
}
