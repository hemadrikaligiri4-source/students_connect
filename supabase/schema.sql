-- StudyLoop Database Schema
-- Designed for Supabase PostgreSQL with extensions support

-- Create custom schema types if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    avatar_url TEXT,
    college VARCHAR(150),
    department VARCHAR(100),
    year INT CHECK (year BETWEEN 1 AND 5),
    gender VARCHAR(20) DEFAULT 'male',
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    teaching_skills TEXT[] DEFAULT '{}',
    learning_goals TEXT[] DEFAULT '{}',
    xp INT DEFAULT 0 CHECK (xp >= 0),
    coins INT DEFAULT 0 CHECK (coins >= 0),
    level VARCHAR(50) DEFAULT 'Beginner',
    reputation NUMERIC(3, 2) DEFAULT 5.00 CHECK (reputation BETWEEN 0.00 AND 5.00),
    streak INT DEFAULT 0 CHECK (streak >= 0),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for profiles queries (searching, discovery ranking, leaderboards)
CREATE INDEX IF NOT EXISTS idx_profiles_college ON public.profiles(college);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_college_xp ON public.profiles(college, xp DESC);

-- Trigger to automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating it (Supabase handles this in standard setups)
-- Note: In Supabase, the trigger is typically bound to the auth.users table:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Connections Table (LinkedIn-style network)
CREATE TABLE IF NOT EXISTS public.connections (
    id BIGSERIAL PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_sender_receiver UNIQUE (sender_id, receiver_id),
    CONSTRAINT check_self_connect CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_sender ON public.connections(sender_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- 17. User Follows (Instagram-style follower / following relationships)
CREATE TABLE IF NOT EXISTS public.user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_follow UNIQUE (follower_id, following_id),
    CONSTRAINT check_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- 3. College Exam Calendar (Boosts feed content during exams)
CREATE TABLE IF NOT EXISTS public.college_exam_calendar (
    id BIGSERIAL PRIMARY KEY,
    college VARCHAR(150) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exam_calendar_search ON public.college_exam_calendar(college, exam_date);

-- 4. Doubt Rooms (Live doubt help sessions)
CREATE TABLE IF NOT EXISTS public.doubt_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'SOLVED', 'CLOSED')),
    subject VARCHAR(100) NOT NULL,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    helper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    college VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    solved_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_creator_helper CHECK (creator_id <> helper_id)
);

CREATE INDEX IF NOT EXISTS idx_doubt_rooms_status ON public.doubt_rooms(status);
CREATE INDEX IF NOT EXISTS idx_doubt_rooms_college ON public.doubt_rooms(college);
CREATE INDEX IF NOT EXISTS idx_doubt_rooms_subject ON public.doubt_rooms(subject);

-- 5. Doubt Messages (Group chat for live doubt rooms)
CREATE TABLE IF NOT EXISTS public.doubt_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.doubt_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doubt_messages_room ON public.doubt_messages(room_id);

-- 6. Direct Chats (Conversation handles for 1:1 messaging)
CREATE TABLE IF NOT EXISTS public.direct_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_chat_pair UNIQUE (user1_id, user2_id),
    CONSTRAINT check_self_chat CHECK (user1_id <> user2_id)
);

CREATE INDEX IF NOT EXISTS idx_direct_chats_users ON public.direct_chats(user1_id, user2_id);

-- 7. Direct Messages (Individual 1:1 messages)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.direct_chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_chat ON public.direct_messages(chat_id);

-- 8. Reels (Educational videos/content shorts)
CREATE TABLE IF NOT EXISTS public.reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    likes_count INT DEFAULT 0 CHECK (likes_count >= 0),
    comments_count INT DEFAULT 0 CHECK (comments_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reels_creator ON public.reels(creator_id);
CREATE INDEX IF NOT EXISTS idx_reels_subject ON public.reels(subject);

-- 9. Reel Likes
CREATE TABLE IF NOT EXISTS public.reel_likes (
    id BIGSERIAL PRIMARY KEY,
    reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_reel_user_like UNIQUE (reel_id, user_id)
);

-- 10. Reel Comments
CREATE TABLE IF NOT EXISTS public.reel_comments (
    id BIGSERIAL PRIMARY KEY,
    reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reel_comments_reel ON public.reel_comments(reel_id);

-- 11. Badge Rules (Gamification definition rules database table)
CREATE TABLE IF NOT EXISTS public.badge_rules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    criteria_type VARCHAR(50) NOT NULL, -- DOUBTS_SOLVED, SESSIONS_TAUGHT, XP_EARNED, STREAK_DAYS, SUBJECT_SPECIALIST
    criteria_value INT NOT NULL,
    icon_url TEXT
);

-- 12. User Badges (Awarded badges database table)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id BIGINT NOT NULL REFERENCES public.badge_rules(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- 13. Admin Users (Separate from student users table)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'moderator' CHECK (role IN ('super_admin', 'moderator', 'finance_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Peer Endorsements Table
CREATE TABLE IF NOT EXISTS public.endorsements (
    id BIGSERIAL PRIMARY KEY,
    endorser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_endorsement UNIQUE (endorser_id, recipient_id, skill),
    CONSTRAINT check_self_endorse CHECK (endorser_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_endorsements_recipient ON public.endorsements(recipient_id);

-- 16. Coin Transactions Ledger Table (Wallet & Coin Rewards)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- REWARD, SPEND, BONUS
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON public.coin_transactions(user_id);

-- Insert default badge rules
INSERT INTO public.badge_rules (name, description, criteria_type, criteria_value, icon_url)
VALUES 
('First Doubt Solved', 'Help another student solve their first academic doubt.', 'DOUBTS_SOLVED', 1, '/badges/first_solved.png'),
('10 Sessions Taught', 'Teach 10 academic sessions in StudyLoop live rooms.', 'SESSIONS_TAUGHT', 10, '/badges/mentor_10.png'),
('Expert Tutor', 'Earn more than 600 total Experience Points (XP).', 'XP_EARNED', 600, '/badges/expert_tutor.png'),
('7-Day Streak', 'Log in and learn/teach 7 days in a row.', 'STREAK_DAYS', 7, '/badges/streak_7.png')
ON CONFLICT (name) DO NOTHING;

