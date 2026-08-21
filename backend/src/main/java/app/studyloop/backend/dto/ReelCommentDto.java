package app.studyloop.backend.dto;

import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.domain.ReelComment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReelCommentDto {
    private ReelComment comment;
    private Profile user;
}
