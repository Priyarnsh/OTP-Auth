<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-v5-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white" />
  <img src="https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=gmail&logoColor=white" />
</p>

<h1 align="center">🔐 OTP Auth System</h1>

<p align="center">
  <strong>Production-grade OTP Authentication with Email & Phone Verification</strong><br/>
  <em>Redis-powered OTP storage · JWT token rotation · Rate limiting · Glassmorphic UI</em>
</p>

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph CLIENT["🖥️ Frontend — Next.js 15"]
        LP[Landing Page]
        AUTH[Auth Page]
        DASH[Dashboard]
        CTX[Auth Context]
        API_LIB[API Client]
    end

    subgraph SERVER["⚙️ Backend — Express 5"]
        APP[app.js]
        ROUTER[Route Layer]
        MW[Middleware Stack]
        CTRL[Controllers]
        SVC[Service Layer]
        MDL[Model Layer]
    end

    subgraph DATA["💾 Data Layer"]
        MONGO[(MongoDB)]
        REDIS[(Redis)]
    end

    subgraph EXTERNAL["📡 External Services"]
        RESEND[Resend Email API]
        TWILIO[Twilio SMS API]
    end

    CLIENT -->|HTTP + Cookies| SERVER
    CTX --> API_LIB
    API_LIB -->|fetch /api/v1/*| APP

    APP --> MW --> ROUTER --> CTRL --> SVC
    SVC --> MDL --> MONGO
    SVC -->|OTP Store/Verify| REDIS
    SVC -->|Send Email| RESEND
    SVC -->|Send SMS| TWILIO

    style CLIENT fill:#1c1917,stroke:#f97316,color:#fafaf9
    style SERVER fill:#1c1917,stroke:#fb923c,color:#fafaf9
    style DATA fill:#1c1917,stroke:#4ade80,color:#fafaf9
    style EXTERNAL fill:#1c1917,stroke:#60a5fa,color:#fafaf9
```

---

## 🔄 Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend
    participant BE as Express Backend
    participant RD as Redis
    participant DB as MongoDB
    participant EX as Resend / Twilio

    User->>FE: Enter email or phone
    FE->>BE: POST /api/v1/auth/send-otp
    BE->>BE: Rate limit check
    BE->>RD: Generate & store OTP (TTL: 5min)
    BE->>EX: Deliver OTP via Email/SMS
    EX-->>User: 📩 OTP delivered
    BE-->>FE: 200 OK (OTP sent)

    User->>FE: Enter 6-digit OTP
    FE->>BE: POST /api/v1/auth/verify-otp
    BE->>RD: Fetch & validate OTP
    RD-->>BE: OTP match ✅
    BE->>RD: Delete OTP (one-time use)
    BE->>DB: Find or create user
    BE->>DB: Store refresh token
    BE-->>FE: 200 OK + Set HTTP-only cookies
    FE->>FE: Redirect to Dashboard
```

---

## 🔐 JWT Token Rotation & Security

```mermaid
stateDiagram-v2
    [*] --> AccessToken: Login Success
    AccessToken --> Expired: 15 min TTL
    Expired --> RefreshEndpoint: Auto-refresh
    RefreshEndpoint --> NewAccessToken: Valid refresh token
    RefreshEndpoint --> Revoked: Token reuse detected ⚠️
    Revoked --> AllSessionsKilled: Security breach response
    AllSessionsKilled --> [*]
    NewAccessToken --> AccessToken: Continue session
    
    AccessToken --> LogoutEndpoint: User logs out
    LogoutEndpoint --> TokenDeleted: Revoke refresh token
    TokenDeleted --> [*]
```

---

## 📁 Project Structure

```
otp-auth/
│
├── backend/                          # Express 5 API Server
│   ├── server.js                     # Entry — boots MongoDB, Redis, HTTP
│   ├── app.js                        # Express config, middleware chain, routes
│   ├── .env                          # Environment variables
│   │
│   └── src/
│       ├── config/
│       │   ├── env.js                # Centralized env loader
│       │   ├── db.js                 # Mongoose connection
│       │   └── redis.js              # ioredis client + fallback
│       │
│       ├── models/
│       │   ├── user.model.js         # Mongoose User schema + statics
│       │   └── token.model.js        # RefreshToken schema + TTL index
│       │
│       ├── controllers/
│       │   └── auth.controller.js    # sendOtp, verifyOtp, refresh, logout, me
│       │
│       ├── services/
│       │   ├── otp.service.js        # Redis OTP: generate, store, verify
│       │   ├── email.service.js      # Resend integration + console fallback
│       │   ├── sms.service.js        # Twilio integration + console fallback
│       │   └── token.service.js      # JWT access/refresh + rotation
│       │
│       ├── middlewares/
│       │   ├── auth.middleware.js     # JWT cookie/bearer verification
│       │   ├── validate.middleware.js # Zod schema validation
│       │   ├── rateLimiter.middleware.js # Redis-based rate limiting
│       │   └── error.middleware.js    # Global error handler + 404
│       │
│       ├── validators/
│       │   └── auth.validator.js     # Zod schemas: sendOtp, verifyOtp, profile
│       │
│       └── routes/
│           ├── index.js              # API v1 router + health check
│           └── auth.routes.js        # Auth endpoints with middleware chains
│
└── frontend/                         # Next.js 15 (App Router)
    └── src/
        ├── app/
        │   ├── layout.js             # Root layout + AuthProvider
        │   ├── page.js               # Landing page
        │   ├── globals.css           # Design system (warm palette)
        │   ├── auth/page.js          # Login → OTP verification flow
        │   └── dashboard/page.js     # Protected dashboard
        │
        ├── components/
        │   ├── Button/               # Primary/Ghost variants
        │   ├── Input/                # Text input with icon
        │   ├── OtpInput/             # 6-digit smart OTP input
        │   └── PhoneInput/           # Country code picker + phone
        │
        ├── context/
        │   └── AuthContext.js        # Auth state + API methods
        │
        └── lib/
            ├── api.js                # Fetch wrapper with credentials
            └── countries.js          # Country dial codes + flags
```

---

## 🛡️ Security Architecture

```mermaid
graph LR
    subgraph DEFENSE["Defense Layers"]
        A[Helmet.js] -->|Security Headers| B[CORS Policy]
        B -->|Origin Whitelist| C[Rate Limiter]
        C -->|Redis Counter| D[Zod Validation]
        D -->|Schema Check| E[Auth Middleware]
        E -->|JWT Verify| F[Controller]
    end

    subgraph OTP_SECURITY["OTP Protection"]
        G[Cryptographic RNG] --> H[Redis TTL — 5 min auto-expiry]
        H --> I[Max 5 attempts per OTP]
        I --> J[60s cooldown between sends]
        J --> K[Constant-time comparison]
    end

    subgraph TOKEN_SECURITY["Token Security"]
        L[HTTP-only Cookies] --> M[Secure + SameSite flags]
        M --> N[Access: 15min / Refresh: 7d]
        N --> O[Token Rotation on each refresh]
        O --> P[Reuse detection → revoke all]
    end

    style DEFENSE fill:#1c1917,stroke:#f97316,color:#fafaf9
    style OTP_SECURITY fill:#1c1917,stroke:#4ade80,color:#fafaf9
    style TOKEN_SECURITY fill:#1c1917,stroke:#60a5fa,color:#fafaf9
```

---

## ⚡ Request Lifecycle

```mermaid
flowchart TD
    REQ[Incoming Request] --> HELMET[Helmet — Security Headers]
    HELMET --> CORS[CORS — Origin Check]
    CORS --> PARSE[Body Parser — JSON]
    PARSE --> COOKIE[Cookie Parser]
    COOKIE --> LOG[Morgan — Request Logging]
    LOG --> RATE[Rate Limiter — Redis Counter]
    RATE -->|Under limit| ROUTE[Router Match]
    RATE -->|Over limit| R429[429 Too Many Requests]
    ROUTE --> VALIDATE[Zod Validation]
    VALIDATE -->|Invalid| R422[422 Validation Error]
    VALIDATE -->|Valid| AUTH_CHECK{Protected Route?}
    AUTH_CHECK -->|Yes| JWT[JWT Verify]
    AUTH_CHECK -->|No| CTRL[Controller]
    JWT -->|Invalid| R401[401 Unauthorized]
    JWT -->|Valid| CTRL
    CTRL --> SERVICE[Service Layer]
    SERVICE --> RESPONSE[JSON Response]
    CTRL -->|Error thrown| ERR[Error Handler]
    ERR --> R500[Structured Error Response]

    style REQ fill:#f97316,stroke:#f97316,color:#fff
    style RESPONSE fill:#4ade80,stroke:#4ade80,color:#000
    style R429 fill:#f87171,stroke:#f87171,color:#fff
    style R422 fill:#f87171,stroke:#f87171,color:#fff
    style R401 fill:#f87171,stroke:#f87171,color:#fff
    style R500 fill:#f87171,stroke:#f87171,color:#fff
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v20+ | Runtime |
| MongoDB | v6+ | User database |
| Redis | v7+ | OTP storage & rate limiting |

### 1. Clone & Install

```bash
git clone <repo-url> && cd otp-auth

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# backend/.env — Required
DATABASE_URL="mongodb://localhost:27017/otp_auth"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-secret-here"

# Optional (leave blank for console fallback)
RESEND_API_KEY=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api/v1 |
| Health Check | http://localhost:5000/api/v1/health |

---

## 📡 API Reference

```mermaid
graph LR
    subgraph PUBLIC["🔓 Public Endpoints"]
        A["POST /auth/send-otp"] -->|Rate: 3/10min| A1["Send OTP"]
        B["POST /auth/verify-otp"] -->|Rate: 10/10min| B1["Verify & Login"]
        C["POST /auth/refresh"] --> C1["Rotate Tokens"]
    end

    subgraph PROTECTED["🔒 Protected Endpoints"]
        D["GET /auth/me"] --> D1["Get Profile"]
        E["PATCH /auth/profile"] --> E1["Update Name"]
        F["POST /auth/logout"] --> F1["Revoke Session"]
        G["POST /auth/logout-all"] --> G1["Revoke All"]
    end

    style PUBLIC fill:#1c1917,stroke:#4ade80,color:#fafaf9
    style PROTECTED fill:#1c1917,stroke:#f97316,color:#fafaf9
```

### Send OTP
```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "type": "email",           // "email" | "phone"
  "identifier": "you@example.com"  // or "+919876543210"
}
```

### Verify OTP
```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "type": "email",
  "identifier": "you@example.com",
  "otp": "847293"
}
```

---

## 🧩 Database Schema

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String email UK "sparse index"
        String phone UK "sparse index"
        Boolean isEmailVerified
        Boolean isPhoneVerified
        String name
        String avatarUrl
        DateTime lastLoginAt
        DateTime createdAt
        DateTime updatedAt
    }

    REFRESH_TOKEN {
        ObjectId _id PK
        String token UK "indexed"
        ObjectId userId FK "indexed"
        DateTime expiresAt "TTL auto-delete"
        DateTime createdAt
    }

    USER ||--o{ REFRESH_TOKEN : "has many"
```


<p align="center">
  <sub>Built with ❤️ and lots of ☕</sub>
</p>
