package app.studyloop.backend.service;

import app.studyloop.backend.domain.Connection;
import app.studyloop.backend.domain.Profile;
import app.studyloop.backend.dto.DiscoveryCandidateDto;
import app.studyloop.backend.repository.ConnectionRepository;
import app.studyloop.backend.repository.ProfileRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DiscoveryService {

    private final ProfileRepository profileRepository;
    private final ConnectionRepository connectionRepository;

    public DiscoveryService(ProfileRepository profileRepository, ConnectionRepository connectionRepository) {
        this.profileRepository = profileRepository;
        this.connectionRepository = connectionRepository;
    }

    public List<DiscoveryCandidateDto> getDiscoverablePeers(Profile viewer, boolean filterSameCollegeOnly) {
        // Fetch all other student profiles
        List<Profile> candidates = profileRepository.findAll().stream()
                .filter(p -> !p.getId().equals(viewer.getId()))
                .collect(Collectors.toList());

        // Get viewer's accepted connection IDs to calculate mutual connections
        Set<UUID> viewerConnectionIds = getAcceptedConnectionUserIds(viewer.getId());

        List<DiscoveryCandidateDto> scoredCandidates = new ArrayList<>();

        for (Profile candidate : candidates) {
            // Apply filtering: default is to show same college first, unless filterSameCollegeOnly is disabled
            if (filterSameCollegeOnly && viewer.getCollege() != null && !viewer.getCollege().equalsIgnoreCase(candidate.getCollege())) {
                continue;
            }

            int score = calculateDiscoveryScore(viewer, candidate, viewerConnectionIds);
            scoredCandidates.add(new DiscoveryCandidateDto(candidate, score));
        }

        // Sort descending by score, and then by reputation
        scoredCandidates.sort((c1, c2) -> {
            int scoreCompare = Integer.compare(c2.getScore(), c1.getScore());
            if (scoreCompare != 0) {
                return scoreCompare;
            }
            return c2.getProfile().getReputation().compareTo(c1.getProfile().getReputation());
        });

        return scoredCandidates;
    }

    private int calculateDiscoveryScore(Profile viewer, Profile candidate, Set<UUID> viewerConnectionIds) {
        int score = 0;

        // 1. Same College (+50)
        if (viewer.getCollege() != null && viewer.getCollege().equalsIgnoreCase(candidate.getCollege())) {
            score += 50;
        }

        // 2. Same Department (+20)
        if (viewer.getDepartment() != null && viewer.getDepartment().equalsIgnoreCase(candidate.getDepartment())) {
            score += 20;
        }

        // 3. Same Year (+15)
        if (viewer.getYear() != null && viewer.getYear().equals(candidate.getYear())) {
            score += 15;
        }

        // 4. Shared Skills Count (* 8): Skills in candidate's teaching_skills matching viewer's learning_goals
        int sharedSkills = 0;
        if (viewer.getLearningGoals() != null && candidate.getTeachingSkills() != null) {
            for (String goal : viewer.getLearningGoals()) {
                for (String teachSkill : candidate.getTeachingSkills()) {
                    if (goal.trim().equalsIgnoreCase(teachSkill.trim())) {
                        sharedSkills++;
                    }
                }
            }
        }
        score += sharedSkills * 8;

        // 5. Shared Learning Goals (* 6): Learning goals in common
        int sharedGoals = 0;
        if (viewer.getLearningGoals() != null && candidate.getLearningGoals() != null) {
            for (String vGoal : viewer.getLearningGoals()) {
                for (String cGoal : candidate.getLearningGoals()) {
                    if (vGoal.trim().equalsIgnoreCase(cGoal.trim())) {
                        sharedGoals++;
                    }
                }
            }
        }
        score += sharedGoals * 6;

        // 6. Mutual Connections (* 4)
        Set<UUID> candidateConnectionIds = getAcceptedConnectionUserIds(candidate.getId());
        Set<UUID> mutualConnections = new HashSet<>(viewerConnectionIds);
        mutualConnections.retainAll(candidateConnectionIds);
        score += mutualConnections.size() * 4;

        // 7. Teaching Rating (* 5): Reputation * 5
        double reputationVal = (candidate.getReputation() != null) ? candidate.getReputation().doubleValue() : 5.0;
        score += (int) (reputationVal * 5);

        // 8. Recently Active (+10): Active in the last 24 hours
        if (candidate.getLastActiveAt() != null) {
            Instant oneDayAgo = Instant.now().minus(24, ChronoUnit.HOURS);
            if (candidate.getLastActiveAt().isAfter(oneDayAgo)) {
                score += 10;
            }
        }

        return score;
    }

    private Set<UUID> getAcceptedConnectionUserIds(UUID userId) {
        List<Connection> connections = connectionRepository.findActiveConnectionsFor(userId, "ACCEPTED");
        Set<UUID> ids = new HashSet<>();
        for (Connection c : connections) {
            if (c.getSenderId().equals(userId)) {
                ids.add(c.getReceiverId());
            } else {
                ids.add(c.getSenderId());
            }
        }
        return ids;
    }

    public List<DiscoveryCandidateDto> getSeniorMentors(Profile viewer) {
        if (viewer.getYear() == null || viewer.getCollege() == null) {
            return new ArrayList<>();
        }

        List<Profile> seniors = profileRepository.findByCollege(viewer.getCollege()).stream()
                .filter(p -> !p.getId().equals(viewer.getId()))
                .filter(p -> p.getYear() != null && p.getYear() > viewer.getYear())
                .collect(Collectors.toList());

        Set<UUID> viewerConnectionIds = getAcceptedConnectionUserIds(viewer.getId());
        List<DiscoveryCandidateDto> matches = new ArrayList<>();

        for (Profile senior : seniors) {
            // Check if senior teaches anything viewer wants to learn
            boolean matchesNeed = false;
            if (viewer.getLearningGoals() != null && senior.getTeachingSkills() != null) {
                for (String goal : viewer.getLearningGoals()) {
                    for (String teach : senior.getTeachingSkills()) {
                        if (goal.trim().equalsIgnoreCase(teach.trim())) {
                            matchesNeed = true;
                            break;
                        }
                    }
                }
            }

            if (matchesNeed) {
                int score = calculateDiscoveryScore(viewer, senior, viewerConnectionIds);
                matches.add(new DiscoveryCandidateDto(senior, score));
            }
        }

        // Sort seniors: highest score first
        matches.sort((c1, c2) -> Integer.compare(c2.getScore(), c1.getScore()));
        return matches;
    }

    public List<DiscoveryCandidateDto> getSkillSwapMatches(Profile viewer) {
        if (viewer.getCollege() == null) {
            return new ArrayList<>();
        }

        List<Profile> peers = profileRepository.findByCollege(viewer.getCollege()).stream()
                .filter(p -> !p.getId().equals(viewer.getId()))
                .collect(Collectors.toList());

        Set<UUID> viewerConnectionIds = getAcceptedConnectionUserIds(viewer.getId());
        List<DiscoveryCandidateDto> matches = new ArrayList<>();

        for (Profile peer : peers) {
            boolean viewerCanLearnFromPeer = false;
            boolean peerCanLearnFromViewer = false;

            // 1. Can viewer learn from peer?
            if (viewer.getLearningGoals() != null && peer.getTeachingSkills() != null) {
                for (String vGoal : viewer.getLearningGoals()) {
                    for (String pTeach : peer.getTeachingSkills()) {
                        if (vGoal.trim().equalsIgnoreCase(pTeach.trim())) {
                            viewerCanLearnFromPeer = true;
                            break;
                        }
                    }
                }
            }

            // 2. Can peer learn from viewer?
            if (peer.getLearningGoals() != null && viewer.getTeachingSkills() != null) {
                for (String pGoal : peer.getLearningGoals()) {
                    for (String vTeach : viewer.getTeachingSkills()) {
                        if (pGoal.trim().equalsIgnoreCase(vTeach.trim())) {
                            peerCanLearnFromViewer = true;
                            break;
                        }
                    }
                }
            }

            // Bilateral swap match
            if (viewerCanLearnFromPeer && peerCanLearnFromViewer) {
                int score = calculateDiscoveryScore(viewer, peer, viewerConnectionIds);
                matches.add(new DiscoveryCandidateDto(peer, score));
            }
        }

        matches.sort((c1, c2) -> Integer.compare(c2.getScore(), c1.getScore()));
        return matches;
    }
}
