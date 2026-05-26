# TaskFlow — Backend API

REST API powering the **TaskFlow** team collaboration platform — Kanban boards, daily standups, project portfolio, and team analytics.

> Frontend repository: [`task-management-frontend`](../frontend) (React + TypeScript + Vite)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Role-Based Access Control](#role-based-access-control)
- [File Uploads](#file-uploads)
- [Scripts](#scripts)
- [Project Structure](#project-structure)

---

## Overview

TaskFlow's backend is an Express + TypeScript service backed by MongoDB. It exposes a RESTful JSON API and handles:

- JWT-based authentication and six-role authorization
- Project, task, standup, sprint, team, and initiative CRUD
- Drag-and-drop status updates and task reordering
- Daily standup submissions with manager comment threads
- Dashboard analytics (project portfolio, team workload, blockers, top performers)
- AWS S3 file uploads for project logos and documents
- Excel import (`/import/sheets`) and export (`/reports/*.xlsx`)
- Webhook receivers for external integrations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Language | TypeScript 5 |
| Framework | Express 4 |
| Database | MongoDB (Atlas) via Mongoose 8 |
| Auth | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` |
| File storage | AWS S3 via `multer-s3` |
| Validation | Zod |
| Security | Helmet, CORS, `express-rate-limit` |
| Excel | ExcelJS |
| Logging | Morgan |
| Dev runner | `tsx` (watch mode) |
| Tests | Vitest |

---

## Architecture

```
┌─────────────┐    HTTPS / JWT    ┌──────────────┐
│  Frontend   │ ─────────────────▶│  Express API │
│  (Vite SPA) │                   │   (this app) │
└─────────────┘                   └──────┬───────┘
                                         │
                          ┌──────────────┼──────────────┐
                          ▼              ▼              ▼
                  ┌──────────────┐ ┌──────────┐ ┌──────────────┐
                  │ MongoDB Atlas│ │  AWS S3  │ │   Webhooks   │
                  │  (Mongoose)  │ │ (uploads)│ │  (external)  │
                  └──────────────┘ └──────────┘ └──────────────┘
```

- **Layered routes** — `src/routes/` mounts each resource group; controllers live in `src/controllers/`; data access via Mongoose models in `src/models/`.
- **Middleware** — `authenticate()` validates the JWT and hydrates `req.user`; `authorize(...roles)` enforces RBAC; rate limiting protects against abuse.
- **Indexes** — unique compound index on `userId + projectId + date` in `Standup` ensures one standup per user per project per day.
- **Auto timestamps** — `Task.completedAt` is set automatically when status transitions to `Done`.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8 (npm or yarn also work)
- MongoDB connection (local or Atlas)
- AWS S3 bucket + IAM credentials (only required if you upload files)

### Install

```bash
cd backend
pnpm install
```

### Run in development

```bash
pnpm dev          # tsx watch → http://localhost:8080
```

### Seed demo data

```bash
pnpm seed         # creates demo users, projects, tasks
```

### Build & start (production)

```bash
pnpm build        # tsc → dist/
pnpm start        # node dist/index.js
```

### Health check

```bash
curl http://localhost:8080/health
```

---

## Environment Variables

Create a `.env` file in `backend/`:

```env
# Server
NODE_ENV=development
PORT=8080
CORS_ORIGIN=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskflow

# Auth
JWT_SECRET=replace-me-with-a-long-random-string
JWT_EXPIRES_IN=7d

# AWS S3 (only needed for file uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=your-bucket-name
```

> Never commit `.env` files or hardcoded credentials. Rotate any secret that appears in git history.

---

## API Reference

Base URL: `http://localhost:8080/api`

All endpoints (except `/auth/login` and `/health`) require a bearer token:

```http
Authorization: Bearer <jwt>
```

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Email + password → JWT |
| `POST` | `/auth/register` | Create account (Admin only in practice) |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | List users (Admin/PM) |
| `GET` | `/users/:id` | Get one user |
| `POST` | `/users` | Create user (Admin) |
| `PATCH` | `/users/:id` | Update user |
| `DELETE` | `/users/:id` | Deactivate user |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/projects` | List projects (scoped by membership) |
| `GET` | `/projects/:id` | Get project details |
| `POST` | `/projects` | Create project (multipart for logo + docs) |
| `PATCH` | `/projects/:id` | Update project |
| `DELETE` | `/projects/:id` | Delete project |
| `DELETE` | `/projects/:id/documents/:docUrl` | Remove a single uploaded document |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks` | List tasks (filter by `projectId`, `assigneeId`, `status`) |
| `GET` | `/tasks/:id` | Get task |
| `POST` | `/tasks` | Create task |
| `PATCH` | `/tasks/:id` | Update task |
| `PATCH` | `/tasks/:id/status` | Update only the status column |
| `PATCH` | `/tasks/reorder` | Persist new sort order after drag |
| `DELETE` | `/tasks/:id` | Delete task |

### Standups

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/standups` | List standups (filter by date, project, user) |
| `GET` | `/standups/today` | Current user's standups for today |
| `POST` | `/standups` | Submit a standup |
| `PATCH` | `/standups/:id` | Update own standup |
| `GET` | `/standups/:id/comments` | List manager comments |
| `POST` | `/standups/:id/comments` | Post a comment (Admin/PM) |

### Dashboard (Admin / PM / Lead Team)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/metrics` | KPI totals |
| `GET` | `/dashboard/projects` | Portfolio with phase & timeline badges |
| `GET` | `/dashboard/workload` | Team workload per member |
| `GET` | `/dashboard/blockers` | Tasks currently blocked |
| `GET` | `/dashboard/top-performers` | Highest completion rate users |

### Teams, Sprints, Initiatives

CRUD endpoints under `/teams`, `/sprints`, `/initiatives` following the same conventions.

### Import & Reports

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/import/sheets` | Upload Excel for bulk task import |
| `POST` | `/import/preview` | Preview parsed rows before running |
| `POST` | `/import/run` | Commit the import |
| `GET` | `/reports/weekly.xlsx` | Weekly report download |
| `GET` | `/reports/monthly.xlsx` | Monthly report download |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness check (no auth) |

---

## Data Model

Mongoose models in `src/models/`:

- **User** — name, email, password (hashed), role, department, active flag
- **Project** — name, description, status, target/internal-test/UAT/production dates, members, logo, documents
- **Task** — title, description, status, priority, assignee, story points, start/end dates, tags, GitHub PR link, `completedAt`
- **Standup** — userId, projectId, date, yesterday, today, blockers
- **StandupComment** — standupId, authorId, body, createdAt
- **Sprint** — name, startDate, endDate, projectId, tasks
- **Team** — name, members, lead
- **Initiative** — epic-level grouping above projects

---

## Role-Based Access Control

Six roles enforced via the `authorize(...roles)` middleware:

| Role | Capabilities |
|---|---|
| `Admin` | Full access to every resource and endpoint |
| `Project Manager` | Full project, task, standup management; dashboard access |
| `Lead Team` | Dashboard read; project member management |
| `Developer` / `Tester` / `UXUI` | Own tasks, own standups; project list scoped to membership |

The `User` schema also defines unused roles (`Sale`, `Marketing`, `Office`, `Finance`, `HR`) reserved for future expansion.

---

## File Uploads

Files are streamed straight to S3 via `multer-s3`:

- **Logos** → `s3://<bucket>/logos/<timestamp>-<original>`
- **Documents** → `s3://<bucket>/documents/<timestamp>-<original>`
- Max size: **20 MB**
- Accepted MIME types validated in route handlers

The returned S3 URL is stored on the `Project` document; deletion of a document calls `s3.deleteObject` before pulling the URL out of the array.

---

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start in watch mode with `tsx` |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled build |
| `pnpm seed` | Populate the database with demo data |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |

---

## Project Structure

```
backend/
├── src/
│   ├── controllers/    # Route handlers (business logic)
│   ├── middleware/     # auth, authorize, error handler, rate limit
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers mounted under /api
│   ├── scripts/        # seed.ts and other one-off scripts
│   ├── lib/            # s3 client, jwt helpers, etc.
│   ├── types/          # Shared TypeScript types
│   └── index.ts        # App entry point
├── dist/               # Build output (gitignored)
├── package.json
└── tsconfig.json
```

---

## License

Proprietary — internal use. Replace with the appropriate license before publishing.
