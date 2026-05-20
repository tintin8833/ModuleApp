# Course Assignment Module

Modular full-stack module bolted onto the UNC LPMS React app. Owns its own MySQL database, exposes a JSON API at `/api/*`, period-scoped end to end, with Adminer for visual table inspection at <http://localhost:8080>.

## Tech Stack

| Layer       | Stack                                                  |
| ----------- | ------------------------------------------------------ |
| Frontend    | React 19 (Vite), react-router-dom, react-feather, Sass |
| Backend     | Express.js, ES Modules                                 |
| ORM         | Sequelize 6 (CLI standard layout)                      |
| Database    | MySQL 8 (Dockerized, isolated per module)              |
| DB UI       | Adminer 4 (Dockerized)                                 |
| File upload | multer + xlsx                                          |

## Period-Scoped Architecture

Every uploadable resource is keyed on `period_id`. The frontend selects a period (e.g. "2025-2026 Semester 1") from a dropdown and every list / upload / create call sends that id along. **Uploads are destructive within a period:** uploading a new Excel file for a period clears existing rows for that period first, then bulk-inserts — so the database always reflects the most recent upload.

Tables and their period scoping:

```
academic_periods           ← drives the period dropdown
├── departments             (period_id FK)
├── faculty                 (period_id FK, + sex/birthdate/email/contact_number)
├── programs                (period_id FK)
├── course_offerings        (period_id FK, + term)
└── industry_consultants    (period_id FK, assigned_course_id → course_offerings)
```

## Project Layout

```
unc-lpms-react/
├── docker-compose.yml          # MySQL + Adminer
├── src/
│   ├── App.jsx                 # wraps app in <PeriodProvider>
│   ├── services/
│   │   ├── api.js              # period-aware fetch wrapper
│   │   └── period.jsx          # PeriodContext + usePeriod() hook
│   ├── components/
│   │   ├── PeriodSelector.jsx     # dropdown + "+ Period" creator
│   │   ├── AddRecordModal.jsx     # generic Add modal (config-driven)
│   │   └── FacultyDetailModal.jsx # full faculty profile (GET /faculty/:id)
│   └── pages/                  # HRStaff, DeanFaculty, DeanPrograms,
│                                #   ProgramHeadCourseOfferings,
│                                #   ProgramHeadIndustryConsultant
└── server/
    ├── index.js
    ├── package.json
    ├── .env.example
    ├── config/                 # config.cjs (CLI) + sequelize.js (ESM)
    ├── models/                 # incl. academicPeriod.js
    ├── migrations/             # *.cjs (additive)
    ├── seeders/
    ├── controllers/            # period-scoped + upload override
    ├── routes/
    ├── middleware/
    └── utils/                  # excelParser.js, periodScope.js
```

## Excel Header Mapping

| Sheet                | Required headers              | Optional                                           |
| -------------------- | ----------------------------- | -------------------------------------------------- |
| Departments          | NAME, CODE                    | DEAN                                               |
| Programs             | CODE, NAME                    | PROGRAM HEAD (also accepts FACULTY NAME)           |
| Faculty              | NAME, ROLE                    | DEPARTMENT, STATUS, ABOUT, SEX, BIRTHDATE, EMAIL, CONTACT NUMBER |
| Course Offerings     | CODE, DESCRIPTION (or COURSE TITLE) | UNITS, INSTRUCTOR, TERM                       |
| Industry Consultants | NAME                          | ASSIGNED COURSE                                    |

Headers are canonicalised (lowercased, alphanumerics only) before matching, so `PROGRAM HEAD`, `Program Head`, and `program_head` all collapse to the same key.

## Running Locally

### 1. Start the database and Adminer

```bash
docker compose up -d
```

- MySQL: `localhost:3307`
- Adminer: <http://localhost:8080> (System: MySQL, Server: `db`, User: `ca_user`, Password: `ca_password`, Database: `course_assignment`)

### 2. Backend

```bash
cd server
cp .env.example .env       # already done once; safe to re-run
npm install                # already done once
npm run db:migrate         # picks up the new period-aware migrations
npm run dev                # http://localhost:4000
```

If you previously ran `npm run db:seed`, the seed data sits in your DB. You'll see it under the default period after the migration backfill — totally fine; it's the "before any uploads" baseline.

To start completely clean:

```bash
npm run db:seed:undo       # wipe seeded faculty/depts/programs
# OR
npm run db:reset           # undo-all → migrate → seed
```

### 3. Frontend

```bash
# from the repo root, in a second terminal
npm install
npm run dev                # http://localhost:5173
```

## Migration Sequence (existing databases)

This update added four new migrations on top of the original five:

```
20260101000001-create-departments.cjs
20260101000002-create-faculty.cjs
20260101000003-create-programs.cjs
20260101000004-create-course-offerings.cjs
20260101000005-create-industry-consultants.cjs
20260201000001-create-academic-periods.cjs      NEW
20260201000002-add-period-id-to-all.cjs         NEW  (also backfills existing rows)
20260201000003-faculty-extra-fields.cjs         NEW  (sex/birthdate/email/contact)
20260201000004-course-offering-term.cjs         NEW
```

`npm run db:migrate` is idempotent — running it again only applies migrations that haven't yet been recorded in `SequelizeMeta`.

## API Surface (period-aware)

All list endpoints accept `?period_id=X`. All upload/create endpoints accept `period_id` in the body (multipart for upload, JSON for create).

| Resource              | Endpoints                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Academic Periods      | `GET /api/academic-periods` · `POST /` · `DELETE /:id`                                                 |
| Departments           | `GET /api/departments?period_id` · `POST /` · `DELETE /:id` · `POST /upload`                           |
| **Faculty**           | `GET /api/faculty?period_id` · **`GET /api/faculty/:id`** (full profile) · `POST /` · `DELETE /:id` · `POST /upload` |
| Programs              | `GET /api/programs?period_id` · `POST /` · `DELETE /:id` · `POST /upload`                              |
| Course Offerings      | `GET /api/course-offerings?period_id` · `POST /` · `PATCH /:id/assign` · `DELETE /:id` · `POST /upload` |
| Industry Consultants  | `GET /api/industry-consultants?period_id` · `POST /` · `PATCH /:id/assign` · `DELETE /:id` · `POST /upload` |

`GET /faculty/:id` is the route that powers the View Details modal — it includes the long `about` field and the resolved Department record (so the modal can show the department's dean alongside the faculty member's role + department).

## Validation Behaviour

Per `DETAILS.pdf`:

- **Faculty upload** resolves DEPARTMENT against the period's `departments` table; unmatched names are stored as free text and flagged with a `warning` entry.
- **Course Offerings upload** resolves INSTRUCTOR against the period's `faculty` table; unmatched rows are inserted with `instructor_id = null` and warned.
- **Industry Consultants upload** resolves ASSIGNED COURSE against the period's `course_offerings.code`; unmatched rows are inserted with `assigned_course_id = null` and warned.
- **Every upload** deletes the period's existing rows for that resource before bulk-inserting (`replaced` count returned in the response).

## UI Behaviour

- Each page renders a **Current Period dropdown** in its header. Switching period instantly re-fetches the table from the API.
- The **Add button** (plus icon) appears next to Upload **only after** the table has at least one row, on Departments / Faculty / Programs / Industry Consultants (Course Offerings has no Add button per the spec).
- Sort A↔Z and search/filter are wired to the actual rendered rows and update live as you type.
- The Industry Consultant **Assign Course** dropdown is populated from the current period's Course Offerings — uploading a Course Offerings file makes new options appear here without a page reload.
