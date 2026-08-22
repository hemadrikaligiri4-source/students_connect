package app.studyloop.backend.dto;

import app.studyloop.backend.domain.Profile;

public class DiscoveryCandidateDto {
    private Profile profile;
    private int score;

    public DiscoveryCandidateDto() {}

    public DiscoveryCandidateDto(Profile profile, int score) {
        this.profile = profile;
        this.score = score;
    }

    public Profile getProfile() {
        return profile;
    }

    public void setProfile(Profile profile) {
        this.profile = profile;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Profile profile;
        private int score;

        public Builder profile(Profile profile) {
            this.profile = profile;
            return this;
        }

        public Builder score(int score) {
            this.score = score;
            return this;
        }

        public DiscoveryCandidateDto build() {
            return new DiscoveryCandidateDto(profile, score);
        }
    }
}
