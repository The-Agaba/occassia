# Occassia - Developer Guide

> **Audience:** Backend engineers, frontend engineers, IoT/hardware integrators, and DevOps.
> **Companion doc:** [README.md](./README.md) (product overview & quick start)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository Layout](#2-repository-layout)
3. [Prerequisites & Tooling](#3-prerequisites--tooling)
4. [Local Development Setup](#4-local-development-setup)
5. [Configuration Reference](#5-configuration-reference)
6. [Database & Migrations](#6-database--migrations)
7. [Authentication & Security](#7-authentication--security)
8. [REST API Conventions](#8-rest-api-conventions)
9. [API Documentation (Swagger)](#9-api-documentation-swagger)
10. [WebSocket / Real-time Layer](#10-websocket--real-time-layer)
11. [Business Rules (Must Not Break)](#11-business-rules-must-not-break)
12. [Multi-Tenancy & RBAC](#12-multi-tenancy--rbac)
13. [Module Deep Dive](#13-module-deep-dive)
14. [IoT / Gate Device Integration](#14-iot--gate-device-integration)
15. [Excel Import Formats](#15-excel-import-formats)
16. [Frontend Architecture](#16-frontend-architecture)
17. [Build, Test & Run](#17-build-test--run)
18. [Docker Deployment](#18-docker-deployment)
19. [Production Checklist](#19-production-checklist)
20. [Troubleshooting](#20-troubleshooting)
21. [Adding New Features](#21-adding-new-features)

---

## 1. System Overview

Occassia is a **three-tier** application:

```
React SPA  ──REST/JWT──►  Spring Boot API  ──JDBC──►  PostgreSQL
     │                         │
     └── WebSocket STOMP ◄─────┘
     
NFC Gate Devices ──REST/JWT──►  Spring Boot API (check-in endpoints only)
```

### Design principles

- **Backend is the single source of truth.** All business logic lives in Spring services.
- **Cards are event-scoped assets** within an organization. They are visible only through the current event inventory and can be reused only when event times do not overlap.
- **Categories are per-event and dynamic.** Never hardcode VIP/Family/etc. in code.
- **One guest = one check-in.** Enforced by DB `UNIQUE` on `check_ins.guest_id`.
- **NFC cards are single-use per event.** A successful NFC scan changes the card to `CHECKED_IN`; another scan returns `CARD_ALREADY_CHECKED_IN`. QR duplicate scans return `alreadyCheckedIn: true`.
- **Event status is one-way:** `DRAFT → ACTIVE → CLOSED → ARCHIVED`.
- **Audit log is append-only.** No deletes.

---

## 2. Repository Layout

```
APP/
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/
│       ├── java/com/occassia/
│       │   ├── OccassiaApplication.java
│       │   ├── auth/              # JWT, login, refresh, blocklist
│       │   ├── organization/      # Multi-tenant org CRUD
│       │   ├── user/              # User management per org
│       │   ├── event/             # Events + status machine
│       │   ├── category/          # Per-event guest categories
│       │   ├── gate/              # Per-event entry gates
│       │   ├── guest/             # Guests + import + QR
│       │   ├── card/              # Org-level NFC cards
│       │   ├── checkin/           # Check-in + reports
│       │   ├── dashboard/         # Stats aggregation
│       │   ├── audit/             # Audit log write + query
│       │   ├── websocket/         # STOMP publisher
│       │   ├── config/            # Security, CORS, OpenAPI, WebSocket
│       │   └── shared/            # Enums, exceptions, security utils
│       └── resources/
│           ├── application.yml
│           └── db/migration/      # Flyway versioned SQL
├── frontend/
│   ├── package.json
│   ├── vite.config.ts             # Dev proxy → :8080
│   ├── Dockerfile + nginx.conf
│   └── src/
│       ├── api/                   # Typed Axios wrappers
│       ├── pages/                 # Route components
│       ├── components/            # Layout, guards, tabs
│       ├── store/                 # Zustand (auth)
│       ├── lib/                   # Axios instance, WebSocket, utils
│       └── types/                 # TypeScript interfaces
├── docker-compose.yml
├── README.md
└── DEVELOPER.md
```

---

## 3. Prerequisites & Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| **JDK** | 21 | Backend runtime & compile |
| **Maven** | 3.9+ | Backend build |
| **Node.js** | 20+ | Frontend dev & build |
| **npm** | 10+ | Frontend package manager |
| **PostgreSQL** | 16 | Primary datastore |
| **Docker** | 24+ (optional) | Containerized local stack |
| **Git** | 2.x | Version control |

### Recommended IDE setup

- **IntelliJ IDEA** - import `backend/` as Maven project, enable Lombok plugin
- **VS Code / Cursor** - open `frontend/`, install ESLint + Tailwind IntelliSense

---

## 4. Local Development Setup

### Step 1 - Clone & database

```bash
git clone <repo-url>
cd APP

# Option A: Docker Postgres
docker compose up postgres -d

# Option B: Local Postgres
psql -U postgres -c "CREATE USER occassia WITH PASSWORD 'occassia';"
psql -U postgres -c "CREATE DATABASE occassia OWNER occassia;"
```

Flyway runs automatically on backend startup. Migrations:

| File | Purpose |
|------|---------|
| `V1__init.sql` | All tables, enums, indexes |
| `V2__seed_data.sql` | Demo orgs, users, sample event |
| `V7__add_guest_phone_number.sql` | Optional guest phone number |
| `V8__rename_double_to_plus_one.sql` | Renames attendance type `DOUBLE` to `PLUS_ONE` |
| `V9__make_cards_event_specific.sql` | Adds event ownership and `CHECKED_IN` card status |

### Step 2 - Backend

```bash
cd backend
mvn spring-boot:run
```

Verify:

```bash
curl http://localhost:8080/api/v1/docs
curl http://localhost:8080/swagger-ui.html   # opens in browser
```

### Step 3 - Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` and `/ws` to `localhost:8080` (see `vite.config.ts`).

### Step 4 - Smoke test

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@elegantevents.com","password":"admin123"}' \
  | jq -r '.token')

# List events
curl -s http://localhost:8080/api/v1/events \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 5. Configuration Reference

### `backend/src/main/resources/application.yml`

| Key | Env Override | Default | Notes |
|-----|--------------|---------|-------|
| `spring.datasource.url` | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/occassia` | |
| `spring.datasource.username` | `SPRING_DATASOURCE_USERNAME` | `occassia` | |
| `spring.datasource.password` | `SPRING_DATASOURCE_PASSWORD` | `occassia` | |
| `occassia.jwt.secret` | `JWT_SECRET` | dev default | **Must change in prod** |
| `occassia.jwt.access-expiration-ms` | — | `28800000` (8h) | |
| `occassia.jwt.refresh-expiration-ms` | — | `604800000` (7d) | |
| `springdoc.swagger-ui.path` | — | `/swagger-ui.html` | Swagger UI |
| `springdoc.api-docs.path` | — | `/v3/api-docs` | OpenAPI JSON |

### `frontend/vite.config.ts`

Dev server runs on port **5173** with proxy:

```ts
proxy: {
  '/api': 'http://localhost:8080',
  '/ws': { target: 'http://localhost:8080', ws: true },
}
```

Swagger is **not** proxied into the frontend app. Access it directly on the backend port.

---

## 6. Database & Migrations

### Schema overview

```
organizations
  └── users
  └── events
        └── guest_categories
        └── guests
        └── gates
        └── check_ins (1:1 with guests)
  └── nfc_cards (organization + event scoped)
  └── audit_logs
```

### Rules for schema changes

1. **Never edit applied Flyway migrations.** Create `V3__description.sql`, etc.
2. Use PostgreSQL native `ENUM` types (already defined in V1).
3. `audit_logs.detail` is `JSONB` - use for flexible context.
4. `guests.qr_token` is unique and auto-generated on insert.
5. `check_ins.guest_id` has a `UNIQUE` constraint - one check-in per guest.

### Reset local database

```bash
docker compose down -v          # destroys volume
docker compose up postgres -d   # fresh DB, Flyway re-runs on backend start
```

---

## 7. Authentication & Security

### JWT flow

```
POST /api/v1/auth/login  →  { token, refreshToken, user }
GET  /api/v1/auth/me     →  current user (requires Bearer token)
POST /api/v1/auth/refresh → { token, refreshToken, user }
POST /api/v1/auth/logout  →  blocklists access token JTI
```

### Token contents (access token claims)

- `sub` - user UUID
- `email`, `role`, `organizationId`
- `type` - `"access"` or `"refresh"`
- `jti` - unique token ID (used for blocklist on logout)

### Security filter chain

`JwtAuthenticationFilter` runs before every request (except permit-all paths):

| Path | Auth Required |
|------|---------------|
| `/api/v1/auth/login` | No |
| `/api/v1/docs` | No |
| `/swagger-ui/**`, `/v3/api-docs/**` | No |
| `/ws/**` | No (add auth in prod if needed) |
| Everything else | Yes - `Authorization: Bearer <token>` |

### Org isolation

Every service method that reads/writes tenant data must call:

```java
SecurityUtils.requireOrgAccess(resourceOrganizationId);
```

`SUPER_ADMIN` bypasses org checks.

### Password hashing

BCrypt via `PasswordEncoder` bean. Seed password `admin123` hash is in `V2__seed_data.sql`.

---

## 8. REST API Conventions

### Base URL

```
/api/v1
```

### Response errors

```json
{
  "error": "CARD_NOT_FOUND",
  "message": "Card not registered in system"
}
```

### HTTP status usage

| Code | When |
|------|------|
| 200 | Success (including duplicate check-in) |
| 400 | Validation failure |
| 401 | Missing/invalid token |
| 403 | Wrong role or org, event closed, card lost |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, card exists) |

### Pagination

Not implemented in v1.0 - list endpoints return full result sets. Add before scaling.

---

## 9. API Documentation (Swagger)

Occassia uses **springdoc-openapi** (OpenAPI 3).

### Endpoints

| URL | Format | Use |
|-----|--------|-----|
| `http://localhost:8080/swagger-ui.html` | HTML UI | Interactive testing |
| `http://localhost:8080/v3/api-docs` | JSON | Codegen, Postman import |
| `http://localhost:8080/v3/api-docs.yaml` | YAML | CI schema validation |
| `http://localhost:8080/api/v1/docs` | JSON | Discovery / link hub |

### Using Swagger UI

1. Start backend
2. Open `http://localhost:8080/swagger-ui.html`
3. Expand **Authentication** → `POST /api/v1/auth/login`
4. Execute with demo credentials
5. Copy `token` value
6. Click **Authorize** (top right) → enter `Bearer <token>`
7. All secured endpoints are now callable

### Adding docs to new endpoints

```java
@Tag(name = "My Module", description = "What this module does")
@RestController
public class MyController {

    @Operation(summary = "Short description")
    @ApiResponse(responseCode = "200", description = "Success")
    @GetMapping("/api/v1/things")
    public List<Thing> list() { ... }
}
```

Global JWT scheme is configured in `OpenApiConfig.java`.

### Production note

Swagger UI is **permit-all** in current config for developer convenience. For production:

- Disable via `springdoc.swagger-ui.enabled=false`, or
- Restrict `/swagger-ui/**` behind VPN / admin auth

---

## 10. WebSocket / Real-time Layer

### Connection

```
Endpoint:  ws://<host>/ws
Protocol:  STOMP over SockJS
```

### Frontend client (`frontend/src/lib/websocket.ts`)

Uses `@stomp/stompjs` + `sockjs-client`. JWT passed in STOMP connect headers.

### Topics published by backend

| Topic | Published when | Payload |
|-------|----------------|---------|
| `/topic/checkin/{eventId}` | Any check-in | `{ guestId, guestName, category, categoryColor, gateId, checkedInAt }` |
| `/topic/stats/{eventId}` | Any check-in | Full `EventStatsResponse` object |
| `/topic/card/{uid}` | Card assign/unassign/status change | `{ uid, status, assignedGuestId }` |

### Publisher

`CheckInEventPublisher` in `websocket/` package - called from `CheckInService` and `CardService`.

### Subscribing (example)

```javascript
stompClient.subscribe(`/topic/checkin/${eventId}`, (message) => {
  const data = JSON.parse(message.body);
  console.log(data.guestName, 'checked in');
});
```

---

## 11. Business Rules (Must Not Break)

These are **contractual** - especially for the IoT team.

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | Cards belong to one organization and one event | `nfc_cards.organization_id` + `event_id` FKs |
| 2 | One guest = one check-in | DB unique on `check_ins.guest_id` |
| 3 | Successful NFC check-in marks card `CHECKED_IN`; repeat NFC tap is rejected | `CheckInService` + `CardService.markCheckedIn()` |
| 4 | QR token auto-generated on guest create | `Guest.@PrePersist` |
| 5 | Event status one-way only | `EventService.validateStatusTransition()` |
| 6 | Card assign updates guest + card atomically | `CardService.assignToGuest()` @Transactional |
| 7 | Check-in only when event `ACTIVE` | `CheckInService` |
| 8 | Only DRAFT events can be deleted | `EventService.delete()` |
| 9 | Important actions write audit log | `AuditService.log()` |
| 10 | No PII on NFC chip - UID only | Hardware contract |

---

## 12. Multi-Tenancy & RBAC

### Roles (fixed enum)

`SUPER_ADMIN` | `ADMIN` | `EVENT_MANAGER` | `CHECKIN_STAFF` | `VIEWER`

### Enforcement pattern

```java
// Role gate
SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);

// Org gate
SecurityUtils.requireOrgAccess(event.getOrganization().getId());
```

### Frontend guards

`ProtectedRoute` - requires JWT.
`RoleGuard` - wraps admin-only pages.

---

## 13. Module Deep Dive

### Auth (`auth/`)

- `JwtService` - token create/parse
- `AuthService` - login, refresh, logout
- `RefreshToken` + `TokenBlocklistEntry` entities
- `JwtAuthenticationFilter` - per-request auth

### Events (`event/`)

Status machine:

```
DRAFT ──► ACTIVE ──► CLOSED ──► ARCHIVED
```

### Guests (`guest/`)

- `GuestService` - CRUD, confirm, paid, QR generation (ZXing)
- `GuestImportService` - Excel `.xlsx`/`.xls` parsing with Apache POI, including the downloadable Excel template

### Cards (`card/`)

Assignment flow:

```
1. Validate guest: confirmed=true, paid=true, nfc_card_uid=null.
2. Validate card: status=AVAILABLE, same organization, and same event.
3. Set guest.nfc_card_uid, card.status=ASSIGNED, card.assigned_guest_id.
4. Publish WebSocket card update + audit log.
```

Card registration accepts one UID at a time:

- `POST /api/v1/cards` with `{ "uid": "04:A3:FF:12:BC", "eventId": "<event-uuid>" }`
- `GET /api/v1/events/{eventId}/cards` returns only cards for that event and organization.
- `PATCH /api/v1/cards/{uid}/status` is Admin-only. `LOST` detaches the card from its guest and deactivates it.
- `DELETE /api/v1/cards/{uid}` permanently removes the card database record.
- Registering a card for an overlapping event returns `CARD_EVENT_OVERLAP`.
- `batch_code` is not part of the entity, request, response, or frontend model.
- Card batch import is available at `POST /api/v1/cards/batch?eventId=<event-uuid>`; its first column is `uid` and additional columns are ignored.
- Cards and check-ins accept canonical NFC UIDs from Web NFC, HID/keyboard readers, or `tools/serial-bridge.js`.

See [CONFIGURE.md](./CONFIGURE.md) for reader compatibility, UID formatting, serial-port settings, authentication, and hardware verification.

### Check-in (`checkin/`)

Entry points:

- `POST /api/v1/checkin/nfc` - `{ nfcUid, gateId? }`
- `POST /api/v1/checkin/qr` - `{ qrToken, gateId? }`
- Gate check-in accepts NFC UID input or QR token input only. There is no manual/type-in gate check-in endpoint.

---

## 14. IoT / Gate Device Integration

Gate hardware must read the card hardware UID and send one canonical UID string. Prefer uppercase hexadecimal with colon separators, for example `04:A3:FF:12:BC`. The card must already be registered and assigned to a confirmed, paid guest before check-in.

HID readers can type into the frontend, while serial/SDK readers can use `tools/serial-bridge.js` for card registration. The current bridge posts `{ "uid": ... }` to card registration; it does not directly call check-in, which requires the `nfcUid` field and an optional `gateId`.

### Required headers

```http
Authorization: Bearer <CHECKIN_STAFF-or-higher-token>
Content-Type: application/json
```

### NFC check-in request

```http
POST /api/v1/checkin/nfc
```

```json
{
  "nfcUid": "04:A3:FF:12:BC",
  "gateId": "00000000-0000-0000-0000-000000000301"
}
```

### Success (first check-in) - HTTP 200

```json
{
  "checkInId": "uuid",
  "guest": {
    "id": "uuid",
    "fullName": "James Kiprotich",
  "attendanceType": "PLUS_ONE",
    "category": { "name": "VIP", "colorHex": "#FFD700" },
    "tableNumber": 5
  },
  "alreadyCheckedIn": false,
  "checkedInAt": "2026-08-14T14:23:11Z"
}
```

### QR duplicate check-in - HTTP 200

```json
{
  "alreadyCheckedIn": true,
  ...
}
```

### Error responses

| HTTP | error code | When |
|------|------------|------|
| 404 | `CARD_NOT_FOUND` | UID not in system or not assigned |
| 403 | `EVENT_CLOSED` | Event not ACTIVE |
| 403 | `CARD_LOST` | Card status is LOST |
| 403 | `CARD_WRONG_EVENT` | Card and guest belong to different events |
| 409 | `CARD_ALREADY_CHECKED_IN` | NFC card has already been used for this event |
| 403 | `GUEST_NOT_CONFIRMED` | Guest `confirmed=false` |

### Mark ticket printed

```http
PATCH /api/v1/checkin/{checkInId}/print
```

---

## 15. Excel Import Formats

### Guest import (`POST /api/v1/events/{id}/guests/batch`)

The UI accepts Excel workbooks with `.xlsx` or `.xls` extensions and provides a downloadable template. CSV guest files are no longer the documented import format.

| Column | Required | Values |
|--------|----------|--------|
| `full_name` | Yes | string |
| `attendance_type` | Yes | `SINGLE` or `PLUS_ONE` |
| `category_name` | Yes | Must match existing category for event |
| `table_number` | No | integer |
| `meal_preference` | No | string |
| `notes` | No | string |
| `phone_number` | No | string |

Response:

```json
{
  "total": 50,
  "imported": 48,
  "failed": 2,
  "errors": [{ "row": 12, "reason": "Category not found: Speaker" }]
}
```

### Card batch import (`POST /api/v1/cards/batch?eventId=<event-uuid>`)

| Column | Required |
|--------|----------|
| `uid` (col 1) | Yes |

Additional columns are ignored. The imported cards are assigned to the supplied event.

### Tickets and printing

Check-in tickets use an 80mm × 50mm compact layout. Normal guests display a category-specific letter derived from the category priority/name; Plus one guests display `+O`. The Check-in screen has an **Auto-print ticket** option persisted per browser. When enabled, a successful check-in opens the browser print workflow automatically. Silent printing still requires a kiosk or managed-browser printer policy because ordinary browsers may show a print dialog.

---

## 16. Frontend Architecture

### Routing (`App.tsx`)

All routes under `ProtectedRoute` except `/login`.

### State

- **Auth** - Zustand `authStore` (token in memory, refreshToken persisted)
- **API** - Axios with JWT interceptor + auto-refresh on 401

### Key pages

| Route | Component | Roles |
|-------|-----------|-------|
| `/events/{id}/checkin` | `CheckInPage` | All (staff-focused) |
| `/events/{id}/dashboard` | `LiveDashboardPage` | All (WebSocket stats) |
| `/events/{id}/cards` | `CardsPage` | ADMIN, EVENT_MANAGER |

### WebSocket usage

`LiveDashboardPage` and `CheckInPage` subscribe to STOMP topics on mount, deactivate on unmount.

---

## 17. Build, Test & Run

### Backend

```bash
cd backend
mvn clean package          # produces target/occassia-backend-1.0.0.jar
mvn spring-boot:run        # dev mode
java -jar target/occassia-backend-1.0.0.jar   # prod-like
```

### Frontend

```bash
cd frontend
npm run build              # output: dist/
npm run preview            # serve dist/ locally
```

### Run tests (when added)

```bash
cd backend && mvn test
cd frontend && npm run lint
```

---

## 18. Docker Deployment

```bash
docker compose up --build
```

| Service | Port | Image |
|---------|------|-------|
| postgres | 5432 | postgres:16-alpine |
| backend | 8080 | Built from `backend/Dockerfile` |
| frontend | 5173 → 80 | Built from `frontend/Dockerfile` (nginx) |

Nginx in frontend container proxies `/api` and `/ws` to backend.

---

## 19. Production Checklist

- [ ] Set strong `JWT_SECRET` (min 256 bits)
- [ ] Use managed PostgreSQL with backups
- [ ] Enable HTTPS (TLS termination at load balancer)
- [ ] Restrict or disable Swagger UI (`springdoc.swagger-ui.enabled=false`)
- [ ] Set CORS allowed origins explicitly (not `*`)
- [ ] Rotate demo/seed passwords - do not deploy `V2__seed_data.sql` to prod
- [ ] Configure log aggregation
- [ ] Set up health checks on `/api/v1/docs` or add Spring Actuator
- [ ] Review WebSocket auth (currently open endpoint)

---

## 20. Troubleshooting

### Backend won't start - Flyway error

```
Migration checksum mismatch
```

**Fix:** Don't edit applied migrations. Create a new `V{n}__fix.sql` or reset local DB.

### `Connection refused` to PostgreSQL

**Fix:** Ensure Postgres is running and credentials match `application.yml`.

### Frontend 401 on all requests

**Fix:**
1. Clear localStorage (`occassia-auth` key)
2. Re-login
3. Verify backend is on `:8080` and Vite proxy is active

### Swagger shows empty endpoints

**Fix:** Ensure `springdoc-openapi-starter-webmvc-ui` is in `pom.xml` and controllers have `@RestController`.

### WebSocket not connecting

**Fix:**
1. Check backend is running
2. Verify `/ws` is not blocked by firewall
3. In production, ensure nginx WebSocket upgrade headers are set (see `frontend/nginx.conf`)

### Check-in returns `EVENT_CLOSED`

**Fix:** Admin must set event status to `ACTIVE` via UI or `PATCH /api/v1/events/{id}/status`.

### Card assign fails `NOT_ELIGIBLE`

**Fix:** Guest must have `confirmed=true` AND `paid=true` before card assignment.

---

## 21. Adding New Features

### New REST endpoint checklist

1. Add/update Flyway migration if schema changes
2. Create or update JPA entity
3. Add repository method
4. Implement service with `SecurityUtils` checks + `AuditService.log()`
5. Add controller with `@Tag` for Swagger
6. Add frontend API wrapper in `src/api/index.ts`
7. Build UI page/component
8. Update this doc and README if behavior is user-facing

### New WebSocket topic checklist

1. Publish from appropriate service via `CheckInEventPublisher` (or new publisher)
2. Document topic in `ApiDocsController` and this file
3. Subscribe in frontend `useWebSocket` hook or page-level effect

---

## Quick Reference Card

```
Login:       POST /api/v1/auth/login
Docs:        GET  /api/v1/docs
Swagger:     GET  /swagger-ui.html
OpenAPI:     GET  /v3/api-docs
Check-in:    POST /api/v1/checkin/nfc
WebSocket:   ws://localhost:8080/ws
Demo admin:  jane@elegantevents.com / admin123
```

---

*Occassia Developer Guide v1.0 - last updated with Swagger/OpenAPI integration*
