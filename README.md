
<div align="center">
  <img src="assets/stack-portal-header.svg" alt="Welcome to Stack Portal" width="900" />

  # Stack Portal
  **A Full-Stack Job Portal & Professional Career Platform**

  <p><strong>Discover Jobs • Apply • Build Your Profile • Connect • Grow</strong></p>

  <p>A modern full-stack platform connecting job seekers with career opportunities through a clean, responsive, and professional experience.</p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-api-reference">API Reference</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-development">Development</a>
  </p>
</div>

---

## About The Project

**Stack Portal** is a full-stack job platform designed for job discovery, application management, professional profiles, and career networking.

| Role | Target User | Key Capabilities |
| :--- | :--- | :--- |
| **Job Seeker** | Job Seekers & Candidates | Search jobs, build profiles, upload resumes, and track applications. |
| **Admin** | Employers & Recruiters | Manage postings, assign private jobs, review candidates, and control the pipeline. |

---

## Features of the Stack Portal:

### Job Seeker
* **Authentication:** Registration, email verification, password auth, login OTP, password resets.
* **Job Search:** Discovery for published jobs, private job assignments, detailed job views.
* **Applications:** Direct job application, duplicate-prevention, status tracking, saved jobs, alerts.
* **Networking & Profile:** Complete professional profile, resume uploads/downloads, people discovery, connection requests.

### Administrator
* **Dashboard:** Real-time platform statistics and metrics.
* **Job Management:** Create, edit, publish, delete, and restrict private jobs to targeted seekers.
* **Candidate Management:** Review seeker profiles, inspect resumes, and transition application statuses.

#### Application Pipeline Flow



[APPLIED] ──> [UNDER_REVIEW] ──> [SHORTLISTED] ──> [INTERVIEW] ──> [SELECTED]
└──> [REJECTED]



---

## User Experience

### Navigation Architecture
```text
┌─────────────────────────────────────────────────────────────┐
│ Stack Portal   Search...   Home   Jobs   Network   Alerts   │
│                                                    Profile  │
└─────────────────────────────────────────────────────────────┘
```
> **Secondary Menu (via Profile Dropdown):**  Saved Jobs |  Settings |  Logout

### Job Visibility Logic



Published + Active + Not Expired + Not Already Applied ──> VISIBLE IN FEED


Applying transfers the job out of the active discovery feed into **Application History**. Duplicate applications are guarded at the database layer.

### Job Card Details
* **Metadata:** Logo, Title, Company, Location, Work Mode (Remote/Hybrid/On-site), Employment Type, Compensation, Experience, Openings, Deadline, Required Skills.
* **Interactions:** Animated hover states, save shortcuts, direct apply modal, entrance micro-animations.

---

##  Professional Networking

* **People Discovery:** Search professionals by name, job title, company, skills, or location.
* **Connection Lifecycle:**


[Connect] ──> [Pending Request] ──> [Connected]

* **Network Hub:** Manage incoming requests, view sent invitations, discover recommendations, and drop connections.



##  Architecture

Stack Portal
├──  Frontend  (React 19, TypeScript, Vite, React Router, Tailwind CSS 4, Motion)
├──  Backend   (Node.js, Express, TypeScript, JWT, bcrypt, Multer)
├──  Database  (MongoDB + Mongoose ODM)
└──  Storage   (MongoDB GridFS)


###  Directory Structure

``` text
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # JWT auth & role guards
│   ├── models/          # User, Profile, Job, Application schemas
│   ├── routes/          # Auth, Seeker, Admin endpoints
│   └── server.ts        # Entry point
├── frontend/
│   ├── src/
│   │   ├── pages/       # Seeker & Admin views
│   │   ├── api.ts       # Central API client
│   │   ├── AuthContext.tsx
│   │   └── App.tsx
│   └── index.html
├── .env.example
└── package.json
```

##  Technology Stack
```text
| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | React 19, Tailwind CSS 4, Motion, Lucide React |
| **Frontend Core** | TypeScript, Vite, React Router |
| **Backend Core** | Node.js, Express, TypeScript |
| **Security & Auth** | JWT, bcrypt, Role Guards |
| **Database & Files**| MongoDB, Mongoose, MongoDB GridFS, Multer |
```
---

##  API Referencea
All protected endpoints require authorization header: `Authorization: Bearer <jwt-token>`

###  Authentication API

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Register account & send verification code |
| `POST` | `/api/auth/verify-email` | Public | Verify 6-digit email code |
| `POST` | `/api/auth/login` | Public | Validate credentials & trigger OTP |
| `POST` | `/api/auth/login/verify-otp` | Public | Validate OTP & receive JWT |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset code |
| `POST` | `/api/auth/reset-password` | Public | Set new account password |
| `GET`  | `/api/auth/me` | Protected | Fetch current user context |

###  Seeker API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/seeker/profile` | Retrieve user profile |
| `PATCH` | `/api/seeker/profile` | Update user profile |
| `GET` | `/api/seeker/jobs` | Search & list eligible jobs (`?q=react`) |
| `GET` | `/api/seeker/jobs/:id` | View job details |
| `POST` | `/api/seeker/applications` | Apply for a job |
| `GET` | `/api/seeker/applications` | View submission history |

###  Admin API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Fetch analytics dashboard |
| `GET` | `/api/admin/seekers` | List all registered candidates |
| `PATCH` | `/api/admin/seekers/:id/profile` | Override/update seeker profile |
| `GET` | `/api/admin/jobs` | View full job inventory |
| `POST` | `/api/admin/jobs` | Create new job listing |
| `PATCH` | `/api/admin/jobs/:id` | Update existing job |
| `DELETE` | `/api/admin/jobs/:id` | Remove job listing |
| `GET` | `/api/admin/applications` | Review global application queue |
| `PATCH` | `/api/admin/applications/:id/status` | Update candidate pipeline status |

---

##  Data Models Overview
```text
User
├── email
├── passwordHash
└── role [ADMIN | SEEKER]

Profile
├── fullName, phone, location, preferredTitle, expectedSalary
├── skills []
└── resume (GridFS Reference)

Job
├── title, company, category, description, requirements
├── location, employmentType, salary, skills [], openings
└── status [DRAFT | PUBLISHED | OPEN | CLOSED | EXPIRED]

Application
├── seeker (Ref: User)
├── job (Ref: Job)
├── status [APPLIED | UNDER_REVIEW | SHORTLISTED | INTERVIEW | SELECTED | REJECTED]
└── createdAt
```

---

##  Installation & Setup GUIDE

### Prerequisites
* **Node.js**: v18 or higher
* **npm**: v9 or higher
* **Database**: Local MongoDB instance or MongoDB Atlas URI

### 1. Repository Setup
bash
git clone <your-repository-url>
cd StackPortal
npm run install:all

### 2. Configure Environment

Copy `.env.example` to `backend/.env` and update your values:

bash
cp .env.example backend/.env



Set variables inside `backend/.env`:
```text
env
PORT=5001
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster>/<database>
JWT_SECRET=your-super-long-secure-random-secret
NODE_ENV=development
```

---

## Development & Build

### Running Development Mode

Run both client and server concurrently:

bash
npm run dev


* **Frontend Application:** `http://localhost:5173`
* **Backend API Server:** `http://localhost:5001`

To run components independently:

bash
npm run dev --prefix frontend
npm run dev --prefix backend



### Production Build

bash
# Build both frontend and backend bundles
npm run build

# Start the Node.js production server
npm start
---

##  Repository Scripts

| Command | Action |
| --- | --- |
| `npm run install:all` | Installs dependencies across root, backend, and frontend packages |
| `npm run dev` | Runs Express backend and Vite frontend concurrently |
| `npm run build` | Compiles frontend assets and TypeScript backend |
| `npm start` | Boots compiled Express backend serving static frontend |
| `npm run lint` | Triggers code formatting and lint checks |

---

##  Security Practices

* **Password Hashing:** Enforced using `bcrypt` salting routines.
* **Stateless Authorization:** Token validation middleware guards API endpoints against unauthorized roles.
* **Document Security:** Direct storage file access is blocked; GridFS file serving validates ownership context prior to output streaming.
* **Production Recommendation:** Migrate JWT handling from client local storage to `httpOnly`, `Secure`, and `SameSite` cookies.

---

##  Contributing

Contributions are welcome! Follow these steps to submit improvements:

1. **Fork** the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. **Commit** your changes (`git commit -m 'Add basic feature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---

###  STACK PORTAL

**Discover. Connect. Apply. Grow.**

Created with  by **ClimberCoder [Vansh]**

⭐ *If you find this repository helpful, please consider giving it a star!*
