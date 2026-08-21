package app.studyloop.backend.dto;

import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.domain.ReelComment;

public class ReelCommentDto {
    private ReelComment comment;
    private Profile user;

    public ReelCommentDto() {}

    public ReelCommentDto(ReelComment comment, Profile user) {
        this.comment = comment;
        this.user = user;
    }

    public ReelComment getComment() { return comment; }
    public void setComment(ReelComment comment) { this.comment = comment; }

    public Profile getUser() { return user; }
    public void setUser(Profile user) { this.user = user; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private ReelComment comment;
        private Profile user;

        public Builder comment(ReelComment comment) { this.comment = comment; return this; }
        public Builder user(Profile user) { this.user = user; return this; }

        public ReelCommentDto build() {
            return new ReelCommentDto(comment, user);
        }
    }
}
