# StackPortal

StackPortal is a full-stack job portal for connecting job seekers with published opportunities. It includes a seeker-facing job board and profile area, plus an admin command center for managing jobs, candidates, and applications.

## Features

### Job seekers

- Register with a name, unique username, email address, and password.
- Verify email, then sign in with password plus a short-lived email OTP.
- Browse published public jobs.
- See private jobs assigned specifically to the signed-in seeker.
- Search jobs by title, company, or required skills.
- View complete job details, including:
  - Company and location
  - Employment type
  - Salary range
  - Number of openings
  - Required skills
  - Full description
- Submit one application per job.
- View application history and current pipeline status.
- Maintain a profile containing:
  - Full name
  - Phone number
  - Location
  - Preferred title
  - Expected salary
  - Skills
  - Resume document
- Upload PDF, DOC, or DOCX resumes and download the saved document later.

### Administrators

- View dashboard metrics:
  - Total seekers
  - Active jobs and total jobs
  - Pending applications
  - Shortlisted candidates
  - Total applications
- Create, edit, and delete job listings.
- Configure job title, company, category, description, location, employment type, salary, skills, and openings.
- Publish jobs as public or private.
- Assign private listings to a specific seeker.
- Browse registered seeker profiles and resume documents.
- View all applications with candidate, job, email, date, and resume information.
- Move applications through the pipeline:
  `APPLIED`, `UNDER_REVIEW`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, or `REJECTED`.

### Platform behavior

- Protected frontend routes for authenticated users.
- Separate role access for `SEEKER` and `ADMIN`.
- Password hashing with bcrypt.
- JWT tokens expire after seven days.
- MongoDB persistence through Mongoose.
- Authenticated MongoDB GridFS storage for profile media and resumes, including resume version snapshots.
- Responsive dark interface built with Tailwind CSS.
- Vite development server and production static-file serving from Express.
- Health-check endpoint at `/api/health`.

## Technology stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS 4
- Lucide React
- Motion

### Backend

- Node.js
- Express
- TypeScript
- MongoDB and Mongoose
- JWT (`jsonwebtoken`)
- bcrypt
- Multer for uploads
- CORS and dotenv

## Project structure

```text
.
├── backend/
│   ├── config/          MongoDB connection
│   ├── middleware/      Authentication and role guards
│   ├── models/          User, Profile, Job, and Application schemas
│   ├── routes/          Auth, seeker, and admin APIs
│   └── server.ts        Express entry point
├── frontend/
│   ├── src/
│   │   ├── pages/       Seeker and admin screens
│   │   ├── api.ts       Authenticated API helpers
│   │   ├── AuthContext.tsx
│   │   └── App.tsx
│   └── index.html
├── .env.example
└── package.json
```

## Prerequisites

- Node.js 18 or newer
- npm
- A MongoDB database, local or MongoDB Atlas

## Installation

From the repository root:

```bash
npm run install:all
```

Create the backend environment file:

```bash
copy .env.example backend\.env
```

Update `backend/.env` with a real MongoDB connection string and a strong JWT secret:

```env
PORT=5001
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster>/<database>
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
```

`MONGODB_URI` is required by the backend. `PORT` defaults to `5001` in development. In production, the backend listens on port `3000`.

## Running locally

Start the frontend and backend together:

```bash
npm run dev
```

The Vite frontend is normally available at `http://localhost:5173`, and the API runs at `http://localhost:5001`.

To run either app separately:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

## Production build

Build both applications:

```bash
npm run build
```

Start the compiled backend:

```bash
npm start
```

In production (`NODE_ENV=production`), Express serves the compiled frontend from `frontend/dist` and provides SPA fallback routing. Ensure the backend process is started from the `backend` directory or that the expected relative `../frontend/dist` path is available.

## API reference

All protected endpoints require:

```http
Authorization: Bearer <jwt-token>
```

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account and send verification code |
| POST | `/api/auth/verify-email` | Verify a six-digit email code |
| POST | `/api/auth/login` | Validate credentials and send login OTP |
| POST | `/api/auth/login/verify-otp` | Verify login OTP and issue JWT |
| POST | `/api/auth/forgot-password` | Send password reset code |
| POST | `/api/auth/reset-password` | Set a new password with reset code |
| GET | `/api/auth/me` | Return the authenticated user |

### Seeker

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/seeker/profile` | Get the current seeker's profile |
| PATCH | `/api/seeker/profile` | Update the current seeker's profile |
| GET | `/api/seeker/jobs` | List accessible published jobs |
| GET | `/api/seeker/jobs/:id` | Get an accessible job |
| POST | `/api/seeker/applications` | Apply to a job with `{ "jobId": "..." }` |
| GET | `/api/seeker/applications` | List the current seeker's applications |

`GET /api/seeker/jobs` accepts an optional `q` query parameter. Search matches job title, company, and required skills.

### Administration

All `/api/admin` endpoints require an authenticated administrator.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/admin/stats` | Get dashboard counts |
| GET | `/api/admin/seekers` | List seekers and their profiles |
| PATCH | `/api/admin/seekers/:id/profile` | Update a seeker's profile |
| GET | `/api/admin/jobs` | List all jobs |
| POST | `/api/admin/jobs` | Create a job |
| PATCH | `/api/admin/jobs/:id` | Update a job |
| DELETE | `/api/admin/jobs/:id` | Delete a job |
| GET | `/api/admin/applications` | List all applications with populated details |
| PATCH | `/api/admin/applications/:id/status` | Update an application status |

### Uploads and health

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/upload` | Upload one authenticated resume file using multipart field `file` |
| GET | `/api/uploads/:id` | Authenticated GridFS file retrieval |
| GET | `/api/health` | Return `{ "status": "ok" }` |

Uploaded files are stored in MongoDB GridFS and are never served as unrestricted static files.

## Data model

- **User**: email, bcrypt password hash, and role (`ADMIN` or `SEEKER`).
- **Profile**: one-to-one seeker profile with contact details, skills, resume URL, preferred title, and expected salary.
- **Job**: title, company, category, description, requirements, employment details, status, visibility, and optional assigned seeker.
- **Application**: a seeker's application for a job and its current pipeline status.

## User workflows

### Seeker workflow

1. Register or log in.
2. Search available listings.
3. Open a listing and submit an application.
4. Complete the profile and upload a resume.
5. Monitor application status from **My Profile**.

### Administrator workflow

1. Log in with an administrator account.
2. Review platform metrics on the dashboard.
3. Create public listings or private listings assigned to a seeker.
4. Review seeker profiles and submitted resumes.
5. Update application statuses as candidates progress.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run install:all` | Install root, frontend, and backend dependencies |
| `npm run dev` | Run frontend and backend concurrently |
| `npm run build` | Build frontend and backend |
| `npm start` | Start the production backend |
| `npm run lint` | Run the repository's lint placeholder |

## Security and deployment notes

- Never commit `backend/.env` or real credentials.
- Replace the example JWT secret before deploying.
- Use a restricted MongoDB user and configure Atlas network access appropriately.
- Resume files are served from the application and should be protected with suitable storage, access, and retention policies for production use.
- Configure a persistent upload volume or external object storage if deploying to an ephemeral environment.
- The application currently stores the JWT in browser local storage; consider an httpOnly cookie strategy for higher-security deployments.

## License

No license has been specified for this project.
