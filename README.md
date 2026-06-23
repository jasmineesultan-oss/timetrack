# TimeTrack — Professional Time Tracking Application

A full-stack time tracking SaaS application similar to Toggl Track, built with React, Node.js, PostgreSQL, and Prisma.

---

## ✨ Features

- **Authentication** — JWT-based login, registration with workspace code, forgot/reset password
- **Workspace System** — Multi-tenant with unique join codes; users can only see their own workspace data
- **Role-Based Access** — Admin (full control) and User (self-service) roles
- **Live Timer** — One-click start/stop, persists across page refresh, billable toggle
- **Manual Entries** — Create, edit, delete time entries with start/end times
- **Projects** — Color-coded projects with tasks, member assignment, and archiving
- **Dashboard** — Daily/weekly/monthly stats, active timer widget, weekly bar chart
- **Reports** — Filter by user/project/date, pie charts, entry table, CSV + Excel export
- **Payroll Reports** — Per-employee hours breakdown by project for any date range
- **Admin Analytics** — Workspace stats, top users, productivity charts
- **Team Management** — View members, copy/regenerate join code, activate/deactivate users
- **Dark Mode** — Full dark mode with system preference detection
- **Responsive** — Mobile-friendly layout with collapsible sidebar

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone and install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set up the database

Create a PostgreSQL database:

```sql
CREATE DATABASE timetrack;
CREATE USER timetrack WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE timetrack TO timetrack;
```

### 3. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://timetrack:yourpassword@localhost:5432/timetrack"
JWT_SECRET="your-random-256-bit-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### 4. Run database migrations and seed

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx ts-node src/seed.ts
```

This creates:
- **Admin user**: `admin@timetrack.com` / `Admin@123`
- **Workspace join code**: `DEMO1234`
- 3 sample projects with tasks

### 5. Start development servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 6. Open the app

Visit [http://localhost:5173](http://localhost:5173)

Login with:
- Email: `admin@timetrack.com`
- Password: `Admin@123`

To add a regular user, go to `/register` and use join code `DEMO1234`.

---

## 🐳 Docker Deployment (Recommended for Production)

```bash
# From the root directory
docker-compose up --build -d
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## 🏗️ Project Structure

```
timetrack/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.ts            # Registration, login, forgot password
│   │   │   ├── workspaces.ts      # Workspace CRUD + join code
│   │   │   ├── projects.ts        # Project management
│   │   │   ├── tasks.ts           # Task management
│   │   │   ├── timeEntries.ts     # Timer start/stop + manual entries
│   │   │   ├── reports.ts         # Summary, payroll, CSV/Excel export
│   │   │   └── admin.ts           # Analytics + user management
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT + role middleware
│   │   ├── routes/                # Express routers
│   │   ├── utils/
│   │   │   ├── jwt.ts             # Token sign/verify
│   │   │   └── prisma.ts          # Prisma singleton
│   │   ├── seed.ts                # Database seeder
│   │   └── index.ts               # Express app entry
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # Button, Card, Input, Modal, Toast, Badge, Select
│   │   │   ├── layout/            # Sidebar, AppLayout
│   │   │   └── timer/             # TimerBar, TimeEntryItem
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── DashboardPage.tsx  # Stats + recent entries + chart
│   │   │   ├── TrackerPage.tsx    # Full entry list + week nav + filter
│   │   │   ├── ProjectsPage.tsx   # Project grid with CRUD
│   │   │   ├── ReportsPage.tsx    # Filters + charts + table + export
│   │   │   ├── TeamPage.tsx       # Member list + join code management
│   │   │   ├── AdminPage.tsx      # Analytics + payroll report
│   │   │   └── SettingsPage.tsx   # Profile, password, appearance
│   │   ├── stores/
│   │   │   ├── authStore.ts       # Zustand auth state
│   │   │   ├── timerStore.ts      # Zustand timer + interval
│   │   │   └── themeStore.ts      # Dark mode
│   │   ├── lib/
│   │   │   ├── api.ts             # Axios client + interceptors
│   │   │   └── utils.ts           # formatDuration, formatDate, etc.
│   │   ├── App.tsx                # Router + route guards
│   │   ├── main.tsx
│   │   └── index.css              # Tailwind + CSS variables
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register with join code |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request reset email |
| POST | `/api/auth/reset-password` | Reset with token |

### Time Entries
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/time-entries` | List entries (filterable) |
| GET | `/api/time-entries/running` | Get running timer |
| POST | `/api/time-entries/start` | Start timer |
| POST | `/api/time-entries/:id/stop` | Stop timer |
| POST | `/api/time-entries/manual` | Create manual entry |
| PUT | `/api/time-entries/:id` | Update entry |
| DELETE | `/api/time-entries/:id` | Delete entry |

### Reports
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/reports/dashboard` | Dashboard stats |
| GET | `/api/reports/summary` | Summary with breakdown |
| GET | `/api/reports/payroll` | Payroll report (admin) |
| GET | `/api/reports/export/csv` | Download CSV |
| GET | `/api/reports/export/excel` | Download Excel |

### Projects, Tasks, Workspaces, Admin
All documented in controllers with full CRUD.

---

## 🔐 Security

- **bcrypt** password hashing (cost factor 12)
- **JWT** tokens with expiry
- **Workspace isolation** — all queries are scoped to the user's workspace
- **Role guards** — admin endpoints require `ADMIN` role
- **Rate limiting** — 20 requests per 15 minutes on auth routes
- **Helmet** — HTTP security headers
- **Input validation** — `express-validator` on all mutation routes
- **SQL injection protection** — Prisma parameterized queries

---

## 🌐 Production Deployment

### Environment variables to change:
```env
JWT_SECRET=<generate with: openssl rand -hex 32>
DATABASE_URL=<your production postgres URL>
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### Platforms:
- **Backend**: Railway, Render, Fly.io, AWS ECS
- **Database**: Supabase, Neon, AWS RDS, Railway Postgres
- **Frontend**: Vercel, Netlify, Cloudflare Pages

### For Vercel frontend + Railway backend:
1. Deploy backend to Railway with env vars set
2. Update `vite.config.ts` proxy target to Railway URL
3. Deploy frontend to Vercel

---

## 📊 Database Schema Summary

| Table | Purpose |
|-------|---------|
| `User` | User accounts with roles |
| `Workspace` | Tenant workspaces with unique join codes |
| `UserWorkspace` | Many-to-many user ↔ workspace membership |
| `Project` | Projects scoped to workspaces |
| `Task` | Tasks under projects |
| `TimeEntry` | Core tracking records (running or stopped) |
| `ProjectMember` | Project membership |
| `Invitation` | Email invitation tokens |
| `PasswordReset` | Password reset tokens |

---

## 📧 Email Setup (Optional)

The current implementation logs reset tokens to the console. To enable real email:

1. Install nodemailer: `npm install nodemailer @types/nodemailer`
2. Update `src/controllers/auth.ts` `forgotPassword` function
3. Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` to `.env`

---

Built with ❤️ using React + TypeScript + Node.js + PostgreSQL + Prisma
