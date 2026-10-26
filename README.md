# Production-Grade Personal Management Software (PMS)

A fast, responsive, accessible, secure, and production-grade Personal Management Software built with **Next.js (App Router)**, **TypeScript (Strict Mode)**, **Node.js**, **SQLite**, **Prisma ORM**, and **Tailwind CSS**.

---

## 1. Architecture Summary

```
                               ┌────────────────────────────────────────────────┐
                               │           Next.js 16 (App Router)              │
                               │  - Strict Mode TypeScript                      │
                               │  - Modern Responsive Dashboard                 │
                               │  - Dark & Light Theme Support                  │
                               │  - Accessible Keyboard Navigation & dnd-kit    │
                               └──────────────────────┬─────────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       │                                                             │
            ┌──────────▼───────────┐                                      ┌──────────▼───────────┐
            │   Route Handlers     │                                      │   Server Middleware  │
            │  /api/auth/*         │                                      │  - HTTP-only Cookies │
            │  /api/sections/*     │                                      │  - Rate Limiting     │
            │  /api/items/*        │                                      │  - Ownership Checks  │
            │  /api/backup         │                                      │  - Session Control   │
            │  /api/health         │                                      └──────────────────────┘
            └──────────┬───────────┘
                       │
            ┌──────────▼─────────────────────────────────────────────────┐
            │                     Prisma ORM Client                      │
            │  - SQLite PRAGMAs (WAL Mode, foreign_keys=ON, busy_timeout)│
            │  - Database Transactions (Reordering, Cascade Purges)      │
            └──────────┬─────────────────────────────────────────────────┘
                       │
       ┌───────────────▼────────────────┐             ┌──────────────────────────────────┐
       │     Persistent SQLite DB       │◄────────────┤  Atomic Backup & Recovery Engine │
       │  (Durable Volume / dev.db)     │             │  - SQLite VACUUM INTO snapshots  │
       │  - Users, Sessions, Preferences│             │  - Pre-restore safety copies     │
       │  - Sections & SectionItems     │             │  - PRAGMA integrity_check        │
       └────────────────────────────────┘             └──────────────────────────────────┘
```

The application strictly separates responsibilities:
- **Presentation Layer**: Client Components for interactive dashboard cards, modals, drag-and-drop sortable lists, filters, and theme toggling.
- **API & Business Logic**: Server-side App Router Route Handlers strictly enforcing user authentication, input validation via Zod schemas, and session ownership checks.
- **Persistence & Integrity**: Managed SQLite database with WAL (Write-Ahead Logging) journal mode, foreign key constraints with cascade triggers, and transactional batch updates.
- **Backup & Recovery**: Atomic online backups utilizing SQLite's native `VACUUM INTO` command with WAL checkpointing, non-blocking snapshot creation, and verified restore scripts.

---

## 2. Implemented Features

### Product & Dashboard
- **Single-Page Productivity Dashboard**: Displays customizable sections in an adaptive grid (1 column on mobile, 2 columns on tablet, 3-5 columns on desktop) maximizing horizontal space without clutter.
- **5 Default Workspace Sections**: Automatically and idempotently initialized for every user:
  1. `Current` (Order 0, Indigo accent)
  2. `Next` (Order 1, Sky Blue accent)
  3. `Skill` (Order 2, Emerald accent)
  4. `Project Parking` (Order 3, Amber accent)
  5. `Daily` (Order 4, Rose accent)
- **Duplicate Prevention**: Initialization is 100% idempotent; repeated runs never duplicate default sections.
- **Initial 10-Section Limit**:
  - Displays the first 10 visible sections by default.
  - If more than 10 sections exist, a "See More (+X sections)" toggle is rendered.
  - Clicking "See More" expands all remaining sections without page reloads.
  - "Show Less" collapses the view back to 10 sections.
  - State is persisted across browser refreshes via user preferences.
- **Drag-and-Drop & Accessible Reordering**:
  - Dedicated drag handles powered by `@dnd-kit/core` and `@dnd-kit/sortable`.
  - Accessible Move Left/Up and Move Right/Down controls on every section card.
  - Section reordering is persisted transactionally in SQLite with optimistic UI updates and automated rollback on network failure.
- **Section Operations**: Create unlimited sections, rename, assign custom accent colors, collapse/expand, archive, restore, and delete with confirmation dialogs.
- **Complete Item CRUD & Lifecycle**:
  - Title, description, status (`TODO`, `IN_PROGRESS`, `DONE`), priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), optional due date.
  - One-click completion toggle that automatically sets or clears `completedAt` timestamp.
  - Move items between sections via the item editor.
  - Archive, restore, and delete items.
  - Overdue date indicators with badge highlighting.
  - Live search filtering by title/notes and status/priority filters.
- **Visual Design & Themes**:
  - Dark and Light mode support with smooth transitions.
  - Compact and Comfortable layout density toggle.
  - Modern typography, accessible focus states, and micro-interactions.
  - Non-intrusive Toast notifications for user feedback.

---

## 3. Database Schema & Migrations

The database is managed with Prisma ORM and SQLite.

### Models Overview
- **User**: Authentication credentials (`email`, `passwordHash`, `name`, `createdAt`, `updatedAt`).
- **Session**: Stateful sessions (`token`, `userId`, `expiresAt`, `createdAt`).
- **UserPreference**: UI preferences per user (`theme`, `density`, `showArchived`, `seeMoreExpanded`).
- **Section**: Workspace sections (`userId`, `name`, `orderIndex`, `color`, `collapsed`, `isArchived`, `isHidden`).
- **SectionItem**: Workspace items (`sectionId`, `userId`, `title`, `description`, `status`, `priority`, `itemType`, `metadata`, `dueDate`, `completedAt`, `isArchived`, `orderIndex`).

### Foreign Keys & SQLite PRAGMAs
On connection initialization (`src/lib/db.ts`), the following SQLite PRAGMAs are executed:
```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```
- Foreign keys enforce referential integrity with `ON DELETE CASCADE ON UPDATE CASCADE`.
- Indexes are defined on `(userId, isArchived, isHidden, orderIndex)`, `(sectionId, isArchived, orderIndex)`, `(userId, status)`, and `(userId, priority)`.

### Migrations
Migrations are stored in `prisma/migrations/`.
- Apply migrations in development:
  ```bash
  npm run db:migrate
  ```
- Apply migrations in production:
  ```bash
  npm run db:deploy
  ```

---

## 4. Security & Data Protection

- **Password Hashing**: Passwords hashed with `bcryptjs` using a salt work factor of 12.
- **Session Management**: Cryptographically secure 256-bit session tokens stored in SQLite with strict expiry.
- **Secure Cookies**: HTTP-only, `SameSite=Lax`, with `Secure` flag enabled automatically in production environments.
- **Ownership Verification**: All protected API endpoints verify user identity via the session cookie and reject access to sections or items owned by other users (preventing IDOR).
- **Server-Side Input Validation**: All payloads validated using strict Zod schemas (`RegisterSchema`, `LoginSchema`, `CreateSectionSchema`, `CreateItemSchema`, `ReorderSectionsSchema`).
- **Rate Limiting**: In-memory rate limiting applied to `/api/auth/register` (max 5 requests/min) and `/api/auth/login` (max 10 requests/min).
- **Sensitive Data Redaction**: The structured logger (`src/lib/logger.ts`) automatically strips passwords, password hashes, session tokens, and secrets from all log output.

---

## 5. Backup & Disaster Recovery

### Atomic Backup Mechanism
Backups use SQLite's native `VACUUM INTO` command preceded by a WAL journal checkpoint:
```javascript
// Step 1: Flush WAL transactions to main database
await prisma.$queryRawUnsafe("PRAGMA wal_checkpoint(PASSIVE);");

// Step 2: Create consistent online vacuumed copy
await prisma.$executeRawUnsafe(`VACUUM INTO '${backupFilePath}';`);
```
This guarantees an atomic, non-blocking backup that never corrupts live database files or discards committed transactions.

### Running Backups
- **From UI**: Click the "Backups" button in the dashboard toolbar and select "Create Backup".
- **From CLI**:
  ```bash
  npm run db:backup
  ```
  Backups are saved to the `backups/` directory with a timestamped filename (e.g., `backup-2026-10-19T17-55-52-756Z.sqlite`).

### Restoring from Backup
Restoration is safe, transactional, and verified:
1. Creates a pre-restore safety snapshot of the live database (`dev.db.pre-restore-<timestamp>`).
2. Safely clears lingering WAL/SHM companion files.
3. Replaces the live database with the backup.
4. Executes `PRAGMA integrity_check;` and queries record counts.
5. If verification succeeds, removes the temporary snapshot; if verification fails, automatically rolls back to the pre-restore safety copy.

To restore the most recent backup:
```bash
npm run db:restore
```
To restore a specific backup file:
```bash
npm run db:restore backups/backup-2026-10-19T17-55-52-756Z.sqlite
```

---

## 6. Testing Suite & Verification

The application includes unit tests and integration tests implemented with Vitest.

### Test Execution
```bash
npm test
```

### Verified Test Cases (27 passing tests)
1. **Validation Unit Tests (`validation.test.ts`)**:
   - RegisterSchema (valid input, email normalization, rejection of invalid email and short password).
   - LoginSchema (valid input, rejection of empty password).
   - CreateSectionSchema (section name, default color, empty name rejection, color validation).
   - ReorderSectionsSchema (valid array, rejection of empty array).
   - CreateItemSchema (valid item, title requirement, priority validation).
   - UserPreferenceSchema (theme, density, seeMoreExpanded flags).
2. **Ordering & Visibility Unit Tests (`ordering_visibility.test.ts`)**:
   - Exclusion of archived and hidden sections from active dashboard.
   - Initial 10-section limit enforcement when visible count > 10.
   - Reveal of all sections upon expanding "See More".
   - Hiding of "See More" control when <= 10 sections exist.
   - Array reordering logic preserving item identity and new indices.
3. **Database & Workspace Integration Tests (`workspace_and_database.test.ts`)**:
   - Workspace default section initialization (creating Current, Next, Skill, Project Parking, Daily).
   - Idempotency guarantee (re-running initialization never duplicates sections).
   - Expansion beyond 10 sections (creating custom sections 6-12).
   - SQLite transactional persistence of section reordering.
   - Complete SectionItem lifecycle (Create -> Edit -> Complete -> Reopen -> Archive -> Restore -> Delete).
   - Cross-user authorization boundaries (preventing unauthorized users from viewing or modifying sections).
   - SQLite atomic backup creation with non-zero file size and valid schema.

---

## 7. Production Deployment & Hosting Requirements

### Persistent Storage Constraint (Critical)
SQLite requires a durable, persistent filesystem. Standard serverless functions (e.g. AWS Lambda, Vercel Serverless) feature ephemeral, read-only filesystems that do not persist writes across invocations.

**Supported Production Hosting Environments**:
1. **Node.js Container / Docker with Persistent Volume**:
   - Platforms: Fly.io (with Fly Volumes), AWS ECS/EC2 with EBS, DigitalOcean App Platform (with Attached Storage), Railway (with persistent volumes), or a traditional Linux VPS.
   - Configure `DATABASE_URL="file:/data/pms.db"` pointing to the mounted persistent storage volume.
2. **Single-Instance Deployment**:
   - SQLite supports high-concurrency single-writer multiple-reader architectures with WAL mode enabled.
   - Ensure that only one application process writes to the SQLite file directly, or utilize Litestream/LiteFS if multi-region read replicas are required.

### Quick Start (Local Production Run)
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Apply database migrations
npm run db:deploy

# 4. Build optimized Next.js bundle
npm run build

# 5. Start production server
npm start
```

### Production Health Check
The application exposes a monitoring endpoint at `/api/health` providing:
- Database connectivity status
- Database latency measurement in milliseconds
- Memory usage statistics (`rssMb`, `heapUsedMb`)
- Server uptime in seconds

Example response (`HTTP 200 OK`):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-10-19T17:47:43.000Z",
    "uptimeSeconds": 1420,
    "database": {
      "status": "connected",
      "provider": "sqlite",
      "latencyMs": 2
    },
    "memory": {
      "rssMb": 84,
      "heapUsedMb": 42
    }
  }
}
```

---

## 8. Known Limitations & Architecture Notes
- **Multi-Node Writes**: Standard SQLite operates with a single writer at any given moment. While WAL mode enables fast, non-blocking concurrent reads and 5,000ms busy timeouts for writes, horizontal scaling across multiple independent compute nodes without distributed consensus (such as LiteFS) is not supported. For high-scale distributed clusters, LiteFS or PostgreSQL should be configured.
- **In-Memory Rate Limiting**: The current rate limiter tracks failed authentication attempts in memory. In multi-process cluster setups, rate limit counters reset on process restart; for distributed clusters, Redis or database-backed rate limiting can be substituted.
