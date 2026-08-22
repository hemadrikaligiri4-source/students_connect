# 🛠️ StudyLoop — Complete Technology Stack

> A full breakdown of every language, framework, library, tool, API, and service used to build the StudyLoop peer-to-peer learning platform.

---

## 📋 Table of Contents

1. [Programming Languages](#-programming-languages)
2. [Backend Framework & Libraries](#-backend-framework--libraries)
3. [Frontend Framework & Libraries](#-frontend-framework--libraries)
4. [Database & Storage](#-database--storage)
5. [Authentication & Security](#-authentication--security)
6. [Real-Time Communication](#-real-time-communication)
7. [Build Tools & Package Managers](#-build-tools--package-managers)
8. [Styling & Design System](#-styling--design-system)
9. [APIs & External Services](#-apis--external-services)
10. [Development & DevOps Tools](#-development--devops-tools)
11. [Architecture Patterns](#-architecture-patterns)
12. [File Structure Overview](#-file-structure-overview)

---

## 🔤 Programming Languages

| Language | Version | Where Used |
|----------|---------|------------|
| **Java** | 21 (LTS) | Backend REST API, WebSocket server, business logic, JPA entities |
| **JavaScript (ES6+)** | ES2022 | Frontend SPA, Admin panel, WebSocket client, WebRTC |
| **JSX** | — | React component templates (`.jsx` files) |
| **CSS3** | — | Design system, animations, responsive layout |
| **HTML5** | — | Entry point pages (`index.html`), semantic structure |
| **SQL** | PostgreSQL dialect | Database schema, seed data, JPA queries (JPQL) |

---

## ⚙️ Backend Framework & Libraries

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Spring Boot** | 3.x | Main backend framework — REST API, dependency injection, auto-configuration |
| **Spring Web (MVC)** | — | REST controllers, request mapping, HTTP handling |
| **Spring Data JPA** | — | ORM layer, repository pattern, JPQL queries |
| **Spring Security** | — | Authentication filter chain, CORS configuration, endpoint security |
| **Spring WebSocket** | — | Real-time bidirectional communication server |

### Java Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **Hibernate** | 6.x | JPA implementation — entity mapping, query execution, schema generation |
| **Jakarta Persistence (JPA)** | 3.x | Entity annotations (`@Entity`, `@Table`, `@Column`, `@Convert`) |
| **Jakarta Validation** | — | Bean validation annotations |
| **JJWT (io.jsonwebtoken)** | 0.11.5 | JWT token parsing, signature verification (HMAC-SHA) |
| **Jackson (FasterXML)** | — | JSON serialization/deserialization for REST APIs and WebSocket messages |
| **Spring Data Redis** | — | Redis client for online presence tracking |
| **Lettuce** | — | Non-blocking Redis driver (Spring Data Redis default) |
| **H2 Database** | — | In-memory SQL database for local development |
| **PostgreSQL JDBC Driver** | — | Production database connectivity |
| **Lombok** | — | Boilerplate reduction (`@Builder`, `@Getter`, `@Setter`, `@NoArgsConstructor`) |
| **SLF4J + Logback** | — | Logging framework (via Spring Boot starter) |

---

## 🖥️ Frontend Framework & Libraries

### Student Frontend (Port 5173)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI component library — state management, effects, context API |
| **React DOM** | 18.2.0 | DOM rendering engine |
| **Lucide React** | 0.292.0 | Icon library — 40+ icons used (HelpCircle, Award, Trophy, Flame, etc.) |
| **Supabase JS Client** | 2.38.4 | Authentication SDK — OAuth, magic link OTP, session management |

### Admin Frontend (Port 5174)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | Admin panel UI components |
| **React DOM** | 18.2.0 | DOM rendering engine |
| **Lucide React** | 0.292.0 | Admin icons (Shield, BarChart3, Users, History, etc.) |

### React Patterns Used

| Pattern | Where |
|---------|-------|
| **Context API** (`createContext`, `useContext`) | `AuthContext` — global auth state |
| **Hooks** (`useState`, `useEffect`, `useRef`) | All components |
| **Conditional Rendering** | Tab switching, modal toggling, auth guards |
| **Controlled Components** | All form inputs |
| **Ref-based DOM Access** | `localVideoRef`, `remoteVideoRef` for WebRTC |
| **Component Composition** | Sidebar, overlays, screen dispatcher |

---

## 🗄️ Database & Storage

### Primary Database

| Technology | Environment | Purpose |
|------------|-------------|---------|
| **H2 Database** | Development | In-memory SQL database with web console (`/h2-console`) |
| **PostgreSQL** | Production | Persistent relational database via Supabase |

### Database Features Used

| Feature | Details |
|---------|---------|
| **JPA Entity Mapping** | 16 domain entities with `@Entity`, `@Table`, `@Column` |
| **Auto DDL** | `spring.jpa.hibernate.ddl-auto=update` (schema auto-generation) |
| **UUID Primary Keys** | Used for Profile, DoubtRoom, DirectChat, Reel entities |
| **Auto-increment IDs** | Used for Connection, Message, Badge, Endorsement entities |
| **Custom Type Converters** | `ListToStringConverter` — stores `List<String>` as comma-separated text |
| **JPQL Queries** | Custom `@Query` annotations in repositories (bidirectional lookups) |
| **Cascade & Relationships** | Foreign key references via UUID columns (not JPA `@ManyToOne`) |

### Caching Layer

| Technology | Purpose |
|------------|---------|
| **Redis (Upstash)** | Online presence tracking with 60-second TTL keys (`user:{id}:online`) |
| **Spring Data Redis** | `StringRedisTemplate` for key-value operations |

---

## 🔐 Authentication & Security

| Technology | Purpose |
|------------|---------|
| **Supabase Auth** | Cloud authentication provider — manages user accounts |
| **JWT (JSON Web Tokens)** | Stateless session tokens passed via `Authorization: Bearer` header |
| **JJWT Library** | Server-side JWT parsing and optional HMAC-SHA signature verification |
| **Magic Link / OTP** | Passwordless email-based login via Supabase |
| **Google OAuth 2.0** | Social login via Supabase OAuth provider |
| **Spring Security Filter Chain** | Custom `JwtAuthenticationFilter` in the security pipeline |
| **CORS Configuration** | Whitelisted origins: `localhost:5173`, `localhost:5174` |
| **Mock JWT (Dev Mode)** | Base64-encoded payload with `sub`, `email`, `role` — signature skipped |
| **UserPrincipal** | Custom `Authentication` principal carrying `id`, `email`, `role` |
| **Admin Auth** | Separate email-based lookup in `admin_users` table |
| **Audit Logging** | `AdminAuditLog` entity tracks all admin actions with timestamps |

### Security Rules

| Rule | Implementation |
|------|----------------|
| Public endpoints | `/`, `/health`, `/h2-console/**`, `/ws/**` |
| Protected endpoints | All `/api/**` routes require valid JWT |
| Self-endorsement prevention | Check `endorserId != recipientId` in `GamificationService` |
| Duplicate endorsement prevention | Unique constraint on `(endorser_id, recipient_id, skill)` |
| Connection self-request prevention | Check `senderId != receiverId` in `ConnectionController` |

---

## 📡 Real-Time Communication

### WebSocket

| Technology | Details |
|------------|---------|
| **Spring WebSocket** | Server-side handler (`TextWebSocketHandler`) |
| **Native WebSocket API** | Browser-side `new WebSocket()` connection |
| **JSON Protocol** | All messages serialized as JSON objects |
| **Heartbeat** | 30-second interval keep-alive from client |
| **Room-based Broadcasting** | `roomParticipants` map tracks users per doubt room |
| **Multi-session Support** | `userSessions` map supports multiple tabs/devices per user |
| **Redis Presence** | Online status stored with 60s TTL, refreshed on heartbeat |

### WebSocket Message Types

| Message Type | Direction | Payload |
|-------------|-----------|---------|
| `HEARTBEAT` | Client → Server | `{}` |
| `HEARTBEAT_ACK` | Server → Client | `{}` |
| `CONNECTED` | Server → Client | `{ userId }` |
| `JOIN_ROOM` | Client → Server | `{ roomId }` |
| `LEAVE_ROOM` | Client → Server | `{ roomId }` |
| `CHAT_MSG` | Client → Server | `{ roomId, message }` |
| `ROOM_MSG` | Server → Clients | `{ roomId, senderId, senderName, senderAvatar, message, createdAt }` |
| `DIRECT_MSG` | Bidirectional | `{ chatId, senderId, senderName, message, createdAt }` |
| `RTC_SIGNAL` | Bidirectional | `{ targetUserId, roomId, signalData }` |

### WebRTC (Video/Audio Calling)

| Technology | Details |
|------------|---------|
| **WebRTC API** | `RTCPeerConnection`, `getUserMedia`, `getDisplayMedia` |
| **STUN Server** | `stun:stun.l.google.com:19302` (Google public STUN) |
| **Signaling** | SDP offers/answers and ICE candidates relayed via WebSocket |
| **Screen Sharing** | `navigator.mediaDevices.getDisplayMedia()` with track replacement |
| **Camera/Mic Access** | `navigator.mediaDevices.getUserMedia({ video: true, audio: true })` |

---

## 🔧 Build Tools & Package Managers

### Backend

| Tool | Version | Purpose |
|------|---------|---------|
| **Apache Maven** | 3.x | Java build tool, dependency management (`pom.xml`) |
| **Maven Wrapper** | — | `mvnw` / `mvnw.cmd` for consistent builds without global Maven |
| **Spring Boot Maven Plugin** | — | Executable JAR packaging |

### Frontend

| Tool | Version | Purpose |
|------|---------|---------|
| **Vite** | 5.0.0 | Lightning-fast dev server with HMR, production bundler |
| **npm** | — | Package manager for JavaScript dependencies |
| **@vitejs/plugin-react** | 4.2.0 | React Fast Refresh and JSX transform |
| **ESLint** | — | JavaScript linting (configured but optional) |

### Vite Configuration

| Feature | Frontend (5173) | Admin (5174) |
|---------|----------------|--------------|
| **API Proxy** | `/api` → `http://localhost:8080` | `/api` → `http://localhost:8080` |
| **WebSocket Proxy** | `/ws` → `ws://localhost:8080` | Not configured |
| **Hot Module Replacement** | ✅ Enabled | ✅ Enabled |

---

## 🎨 Styling & Design System

### CSS Architecture

| Component | Details |
|-----------|---------|
| **Methodology** | Vanilla CSS with CSS Custom Properties (variables) |
| **No CSS Frameworks** | No Tailwind, Bootstrap, or Material UI |
| **Design Tokens** | CSS variables in `:root` for colors, shadows, radii, transitions |
| **Responsive** | Media queries at 640px, 768px, 992px breakpoints |

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#fcfbfc` | Page background |
| `--bg-secondary` | `#ffffff` | Card backgrounds |
| `--bg-tertiary` | `#f1f5f9` | Subtle backgrounds |
| `--text-primary` | `#0f172a` | Ink Navy — headings & body |
| `--text-secondary` | `#475569` | Slate — secondary text |
| `--text-muted` | `#94a3b8` | Muted text |
| `--accent-color` | `#d97706` | Warm Amber — primary accent |
| `--accent-light` | `#fef3c7` | Soft yellow amber |
| `--accent-dark` | `#b45309` | Rich terracotta |
| `--success-color` | `#059669` | Forest green |
| `--danger-color` | `#dc2626` | Crimson red |
| Admin `--primary-color` | `#3b82f6` | Admin blue |

### Typography

| Font | Type | Source | Usage |
|------|------|--------|-------|
| **Fraunces** | Variable Serif | Google Fonts | Headings (`h1`–`h4`), `.font-serif` |
| **Inter** | Sans-serif | Google Fonts | Body text, buttons, inputs |

### CSS Animations

| Animation | Effect | Duration |
|-----------|--------|----------|
| `pulse` | Live indicator dot pulsing | 1.5s infinite |
| `float` | Gentle vertical floating | 4s ease-in-out infinite |
| `pulseGlow` | Amber glow effect | 3s infinite |
| `spin` | 360° rotation | continuous |
| `slideUp` | Fade-in from below | 0.6s cubic-bezier |
| `shimmer` | Loading shimmer effect | continuous |

### UI Component Classes

| Class | Usage |
|-------|-------|
| `.card` | Standard bordered card with hover shadow |
| `.card-premium` | Elevated card with hover lift transform |
| `.glass-card` | Glassmorphism with backdrop blur |
| `.gradient-border` | Pseudo-element gradient border |
| `.gradient-text` | CSS gradient text fill |
| `.btn-primary` | Dark navy button |
| `.btn-accent` | Amber accent button |
| `.btn-secondary` | Outlined button |
| `.btn-danger` | Red destructive button |
| `.btn-icon` | Minimal icon-only button |
| `.tag` / `.tag-accent` | Skill/category pill tags |
| `.live-indicator` / `.live-dot` | Pulsing "LIVE" badge |
| `.empty-state` | Dashed-border empty content placeholder |
| `.grid-2` / `.grid-3` | Responsive CSS Grid layouts |

---

## 🌐 APIs & External Services

| Service | Purpose | URL / Endpoint |
|---------|---------|----------------|
| **Supabase** | Auth provider + PostgreSQL hosting | `VITE_SUPABASE_URL` env var |
| **Google STUN** | NAT traversal for WebRTC | `stun:stun.l.google.com:19302` |
| **Upstash Redis** | Serverless Redis for presence | `SPRING_REDIS_HOST` env var |
| **DiceBear Avatars** | Auto-generated user avatars | `https://api.dicebear.com/7.x/avataaars/svg?seed={name}` |
| **DiceBear Initials** | Fallback initial-based avatars | `https://api.dicebear.com/7.x/initials/svg?seed={name}` |
| **Google Fonts** | Fraunces + Inter font loading | `https://fonts.googleapis.com/css2?...` |
| **Unsplash** | Placeholder images in mock data | `https://images.unsplash.com/...` |
| **Google Sample Videos** | Sample reel video content | `https://commondatastorage.googleapis.com/gtv-videos-bucket/...` |

---

## 🧰 Development & DevOps Tools

| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **H2 Web Console** | In-browser SQL explorer at `/h2-console` |
| **Vite Dev Server** | Frontend hot-reload dev server |
| **Spring Boot DevTools** | (Available) Auto-restart on code changes |
| **Maven Wrapper** | Portable Maven builds without global install |
| **Environment Variables** | `.env.example` template for secrets |
| **LocalStorage** | Client-side session persistence (`studyloop_mock_session`, `studyloop_admin_token`) |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous API key |
| `SPRING_DATASOURCE_URL` | PostgreSQL connection string |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `SUPABASE_JWT_SECRET` | JWT signing secret for verification |
| `SPRING_REDIS_HOST` | Upstash Redis hostname |
| `SPRING_REDIS_PORT` | Redis port (default 6379) |
| `SPRING_REDIS_PASSWORD` | Redis auth password |

---

## 🏗️ Architecture Patterns

| Pattern | Where Used |
|---------|------------|
| **Layered Architecture** | Controller → Service → Repository → Entity |
| **Repository Pattern** | Spring Data JPA interfaces with derived queries |
| **DTO Pattern** | `FeedItemDto`, `DiscoveryCandidateDto`, `ConnectionDto`, `DirectChatThreadDto`, `ReelCommentDto` |
| **Builder Pattern** | All entities and DTOs use `@Builder` or manual builder classes |
| **Context API** | React `AuthContext` for global auth state |
| **Monolith SPA** | Single `App.jsx` file contains all frontend components |
| **Proxy Pattern** | Vite dev server proxies `/api` and `/ws` to Spring Boot |
| **Observer Pattern** | WebSocket `onmessage` event-driven message handling |
| **Scoring/Ranking** | Discovery and Feed services use weighted multi-factor scoring |
| **Stateless Auth** | No server-side sessions — JWT carries all auth info |
| **Seed Data** | `CommandLineRunner` populates initial data on startup |
| **Graceful Degradation** | Redis, Supabase, and signature verification all fail-safe to dev mode |

---

## 📁 File Structure Overview

```
students_connect/
├── .env.example                    # Environment variable template
├── .gitignore                      # Git exclusions
├── TECH_STACK.md                   # ← This file
│
├── backend/                        # Spring Boot Java Backend
│   ├── pom.xml                     # Maven dependencies
│   ├── mvnw / mvnw.cmd            # Maven wrapper
│   └── src/main/
│       ├── java/app/studyloop/backend/
│       │   ├── BackendApplication.java      # Main entry point
│       │   ├── config/
│       │   │   ├── SecurityConfig.java      # Spring Security config
│       │   │   ├── WebSocketConfig.java     # WebSocket endpoint registration
│       │   │   └── StartupSeedData.java     # Initial data seeder
│       │   ├── controller/                  # 11 REST controllers
│       │   ├── domain/                      # 16 JPA entities
│       │   ├── dto/                         # 5 data transfer objects
│       │   ├── repository/                  # 16 JPA repositories
│       │   ├── security/
│       │   │   ├── JwtAuthenticationFilter.java
│       │   │   └── UserPrincipal.java
│       │   ├── service/                     # 3 business services
│       │   ├── util/
│       │   │   └── ListToStringConverter.java
│       │   └── websocket/
│       │       └── ChatWebSocketHandler.java
│       └── resources/
│           ├── application.properties       # Main config
│           └── application-local.properties # Local overrides
│
├── frontend/                       # Student React SPA
│   ├── package.json                # npm dependencies
│   ├── vite.config.js              # Vite + proxy config
│   ├── index.html                  # Entry HTML (SEO meta, fonts)
│   └── src/
│       ├── main.jsx                # React DOM mount
│       ├── App.jsx                 # All 13 components (3913 lines)
│       └── index.css               # Design system (407 lines)
│
├── admin/                          # Admin React SPA
│   ├── package.json                # npm dependencies
│   ├── vite.config.js              # Vite + proxy config
│   ├── index.html                  # Entry HTML
│   └── src/
│       ├── main.jsx                # React DOM mount
│       ├── AdminApp.jsx            # 6 admin tabs (723 lines)
│       └── index.css               # Admin theme (207 lines)
│
└── supabase/
    └── schema.sql                  # Full PostgreSQL schema definition
```

---

## 📊 Quick Stats

| Metric | Count |
|--------|-------|
| **Languages** | 6 (Java, JavaScript, JSX, CSS, HTML, SQL) |
| **Backend Dependencies** | 11 major libraries |
| **Frontend Dependencies** | 4 npm packages |
| **JPA Entities** | 16 |
| **REST Endpoints** | ~35 |
| **React Components** | 13 (frontend) + 7 (admin) |
| **WebSocket Message Types** | 9 |
| **CSS Animations** | 6 |
| **Total Lines of Code** | ~9,000 |
| **External Services** | 6 (Supabase, Redis, Google STUN, DiceBear, Google Fonts, Unsplash) |

---

*Last updated: August 2026*
