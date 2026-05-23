# UNC LPMS — Learning Plan Management System

A web application for managing academic **Learning Plans** (course syllabi) and
**Tables of Specifications (TOS)**, together with the course-assignment workflow
that feeds into them. Built for UNC's academic offices to plan course offerings,
author learning plans, route them for approval, and monitor submissions each
academic term.

---

## What the system does

The app is organized around **academic periods** (terms) and **role-based access**.
The main capabilities are:

- **Course Assignment** — Program Heads manage course offerings and assign faculty
  (instructors) to courses for the active period, and coordinate industry
  consultants. Deans oversee programs and faculty. Reference data (departments,
  faculty, programs) can be seeded or imported from Excel workbooks.
- **Learning Plan & TOS authoring** — Instructors build a Learning Plan for each
  course: course details, Intended Learning Outcomes (ILOs), topics, references,
  assessments, and the grading criteria. They also prepare the TOS.
- **Approval workflow** — Learning Plans are reviewed and approved (or returned
  with comments) by approvers: **Program Head → Dean → Director of Libraries →
  Industry Consultant**.
- **Monitoring** — the **OVPAA** (Office of the Vice President for Academic
  Affairs) monitors submission status of Learning Plans and TOS across all
  departments for the selected term, via dashboards and charts.
- **Administration** — an **Admin** manages user accounts and their roles.

### Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, React Router, Sass (CSS Modules) |
| Backend | Node.js, Express, Sequelize ORM, JWT auth |
| Database | MySQL |

---

## Demo accounts

All demo accounts use the password **`password123`**
(the Admin account uses `admin123`).

### Primary roles

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| **OVPAA** | `ovpaa@unc.edu` | `password123` | `/role/ovpaa` — submission monitor & dashboards |
| **Dean** | `dean@unc.edu` | `password123` | `/role/dean` — programs & faculty oversight |
| **Program Head** | `programhead@unc.edu` | `password123` | `/role/program-head/...` — course offerings, assignments, consultants |

### Other accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@unc.edu` | `admin123` |
| Instructor | `instructor@unc.edu` | `password123` |
| Director of Libraries | `library@unc.edu` | `password123` |
| Industry Consultant | `consultant@unc.edu` | `password123` |
| HR Staff | `hr@unc.edu` | `password123` |

> These are local demo credentials. Change them (Admin → Users) before any real
> deployment.

---

## Running the app locally

You need **two** processes: the frontend (Vite) and the backend (Express + MySQL).

### 1. Backend (`server/`)

Requires a MySQL database reachable per `server/.env` (default `localhost:3307`,
db `course_assignment`).

```bash
cd server
npm install        # first time only
npm start          # starts Express on http://localhost:4000
```

On boot it connects to MySQL, syncs the schema, and ensures a default admin
account exists.

### 2. Frontend (project root)

```bash
npm install        # first time only
npm run dev        # starts Vite on http://localhost:5173
```

Open **http://localhost:5173/** and log in with one of the accounts above.

> The Learning Plan authoring pages render from local sample data, so they work
> with just the frontend. Pages that read live data (OVPAA monitor, Academic
> Terms, Course Assignment) require the backend to be running.

### Useful backend scripts

| Command (run in `server/`) | Purpose |
|----------------------------|---------|
| `npm run dev` | Run with `node --watch` (auto-restart on file changes) |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed sample departments, faculty, and programs |
| `npm run seed:submissions` | Seed demo Learning Plan / TOS submissions |
