<div align="center"> <img src="assets/stack-portal-header.svg" alt="Welcome to Stack Portal" width="900" /> </div> <div align="center">
🚀 A Modern Full-Stack Job & Career Platform

A full-stack job portal designed to connect job seekers with published opportunities through a simple, clean, responsive, and user-friendly experience.

Built with React + TypeScript + Node.js + Express + MongoDB

</div>
🎯 What This Project Demonstrates
💻 As a Developer, This Project Demonstrates
🎨 UI/UX Design — Creating a clean, responsive, and easy-to-use interface.
💡 Creativity — Designing an engaging experience while keeping the application simple.
🧩 Problem Solving — Understanding user requirements and converting them into functional features.
📱 Responsive Design — Making the portal accessible across different screen sizes.
👤 User Experience — Organizing information so users can easily search, explore, and apply for jobs.
🔐 Authentication & Authorization — Implementing secure role-based access for seekers and administrators.
🗄️ Full-Stack Development — Connecting a modern React frontend with an Express/MongoDB backend.
🚀 Features
👨‍💻 Job Seekers
📝 Register with:
Name
Unique username
Email address
Password
📧 Verify email before accessing the platform.
🔐 Sign in using password + short-lived email OTP.
🔎 Browse published public jobs.
🔒 View private jobs assigned specifically to the signed-in seeker.
🔍 Search jobs by:
Title
Company
Required skills
📄 View complete job details, including:
Company
Location
Employment type
Salary range
Number of openings
Required skills
Full description
📤 Submit one application per job.
📊 View application history and current application status.
👤 Maintain a professional profile containing:
Full name
Phone number
Location
Preferred title
Expected salary
Skills
Resume
📎 Upload PDF, DOC, or DOCX resumes.
⬇️ Download saved resumes later.
🛠️ Administrators
📊 View dashboard metrics:
Total seekers
Active jobs
Total jobs
Pending applications
Shortlisted candidates
Total applications
➕ Create job listings.
✏️ Edit job listings.
🗑️ Delete job listings.
📢 Publish public or private jobs.
🎯 Assign private listings to specific seekers.
👥 Browse registered seeker profiles.
📄 View seeker resume documents.
📋 View all applications with:
Candidate
Job
Email
Application date
Resume
🔄 Manage application pipeline:
APPLIED
   ↓
UNDER_REVIEW
   ↓
SHORTLISTED
   ↓
INTERVIEW
   ↓
SELECTED / REJECTED

🌟 Planned / New Platform Experience

The platform is being evolved from a basic job portal into a more complete career + professional networking platform.

The new experience focuses on:

💼 Job discovery
🔎 Advanced job search
🔖 Saved jobs
👥 Professional networking
🤝 Connections
👤 Professional profiles
🔔 Job and application alerts
⚙️ Account settings
✨ Premium UI animations
📱 Responsive mobile experience

The interface will take UX inspiration from platforms such as LinkedIn, Internshala, and Unstop, while maintaining an original Stack Portal identity.

🎨 UI / UX Direction

The goal is to create a:

Minimal + Professional + Modern + Premium + Responsive + Fast

experience.

✨ Design Principles
Clean and minimal navigation
Professional typography
Modern job cards
Clear information hierarchy
Subtle shadows and borders
Rounded components
Consistent spacing
Professional icons
Responsive layouts
Smooth micro-interactions
Accessible UI

Avoid unnecessary visual clutter, excessive gradients, and distracting animations.

🧭 Navigation

The user-facing navigation is designed around a minimal professional taskbar.

Main Navigation
🏠 Home
💼 Jobs
🤝 Network
🔔 Alerts
👤 Profile
Secondary Navigation

Accessible through the profile/account menu:

🔖 Saved Jobs
⚙️ Settings
🚪 Logout

The navigation should remain minimal and easy to understand on both desktop and mobile.

🔍 Global Search

Provide a global search experience for:

💼 Jobs
🎓 Internships
👥 People
🏢 Companies
🧠 Skills
📍 Locations
💻 Job titles

Example placeholder:

Search jobs, internships, people, companies...

Search results should be organized into relevant categories.

💼 Job Discovery

The job feed should display only opportunities that are:

✅ Published
✅ Active
✅ Open for applications
✅ Not expired
❌ Not already applied to by the current user

The primary experience should be:

🔎 Search
   ↓
🎯 Filter
   ↓
💼 Discover
   ↓
📄 View Details
   ↓
🔖 Save
   ↓
📤 Apply

🃏 Premium Job Cards

Job cards are one of the most important components of Stack Portal.

Each job card should clearly display:

🏢 Company Information
Company logo
Company name
Verified badge when applicable
Posted date
💼 Job Information
Job title
Location
Remote / Hybrid / On-site
Job type
Experience level
Salary / stipend
Internship duration
Number of openings
Application deadline
🏷️ Skills

Display required skills as modern badges/chips.

Example:

React    JavaScript    Node.js    MongoDB

📄 Description

Display a short description with a View Details option.

🔘 Actions
Apply Now
View Details
Save

The Apply Now button should be the primary CTA.

✨ Job Card Animations

Job cards should feel interactive without becoming distracting.

On Load
Fade in
Slight upward movement
Subtle staggered appearance
On Hover
Slight elevation
Subtle shadow increase
Border highlight
Save
🔖 Save
   ↓
✓ Saved

Apply
📤 Apply Now
      ↓
⏳ Applying...
      ↓
✅ Application Submitted


After a successful application, the job should be removed from the user's available job feed.

📄 Job Details

The Job Details page should provide a complete, structured job description.

Job Overview
Job title
Company
Location
Work mode
Job type
Experience
Salary / stipend
Duration
Openings
Application deadline
About the Job

Display the complete recruiter-provided description.

Responsibilities

Display responsibilities using readable bullet points.

Requirements

Include:

Required skills
Education
Experience
Eligibility
Other requirements
Benefits / Perks

Display available benefits.

About the Company

Include:

Company logo
Company name
Company description
Location
Website
📤 Application System

Users can submit one application per job.

Application workflow:

Apply Now
    ↓
Application Form
    ↓
Submit
    ↓
Applying...
    ↓
✅ Application Submitted
    ↓
Application Saved
    ↓
Job Removed From Available Feed


The backend must prevent duplicate applications.

Use an appropriate database constraint such as:

unique(user_id, job_id)

🚫 Already Applied Jobs

A job that has already been applied to by the current user must not appear in the user's available job feed.

The backend should enforce:

Published
+
Active
+
Not Expired
+
Not Applied By Current User
=
Visible Jobs


This must continue working after:

Page refresh
Navigation
Logout/login
Browser restart

Application history should still contain previously submitted applications.

🔎 Find Jobs

Provide a dedicated Jobs page with:

Search
Location
Filters
Sorting
Job cards
Pagination or infinite scrolling
🎯 Filters
Job type
Internship
Full-time
Part-time
Contract
Remote
Hybrid
On-site
Location
Experience
Salary / stipend
Duration
Skills
Category
Date posted
↕️ Sorting
Most Relevant
Newest
Salary: High to Low
Deadline: Soonest
🔖 Saved Jobs

Users can save jobs and access them from the Saved Jobs section.

Each saved job should provide:

View Details
Apply
Remove from Saved

Empty state:

No saved jobs yet.

Provide a Find Jobs action.

👥 People

Provide professional people discovery.

Users should be able to search by:

Name
Job title
Company
Skills
Location

Person cards should contain:

Profile photo
Name
Professional headline
Company
Location
Skills
Mutual connections
View Profile
Connect

Connection state:

Connect
   ↓
Pending
   ↓
Connected


All states should be stored in the backend.

🤝 Network

The Network page should be fully functional.

Connection Requests

Display:

Profile photo
Name
Headline
Mutual connections
Accept
Reject
My Connections

Provide:

Search
View Profile
Remove Connection
People You May Know

Display recommended professionals with:

Connect

Sent Requests

Display pending requests with:

Cancel Request

Recently Connected

Display recently accepted connections.

All actions must update immediately and persist after refresh.

🔔 Alerts

The Alerts page should display:

Job alerts
Application updates
Connection requests
Accepted connections
Recommended jobs
Profile activity

Support:

Read/unread states
Mark as read
Mark all as read
👤 My Profile

Create a professional profile containing:

Profile photo
Full name
Professional headline
About
Skills
Experience
Education
Projects
Certifications
Activity
Connections

Provide:

Edit Profile

Users should be able to update their professional information.

⚙️ Settings

The Settings section should include:

👤 Profile

View profile information.

✏️ Update Profile

Edit:

Name
Profile photo
Headline
About
Skills
Experience
Education
Location
Contact information
📊 Your Activity

Display:

Jobs viewed
Jobs applied to
Saved jobs
Profile activity
Network activity
✅ Profile Checklist

Show profile completion.

Example:

80% Profile Complete

Checklist:

Profile photo
Professional headline
About
Skills
Experience
Education
🎯 Recommendations

Display:

Recommended Jobs
People to Know
🔐 Account

Include:

Privacy
Notifications
Security
Account preferences
🎬 Authentication & UI Animations

Stack Portal should use a consistent animation system.

🔐 Sign In
Sign In
  ↓
Signing in...
  ↓
Loading
  ↓
✅ Authentication Successful
  ↓
Dashboard


Use:

Logo fade-in
Form slide/fade
Subtle input animation
Button loading state
Smooth dashboard transition
📝 Register
Create Account
      ↓
Creating account...
      ↓
✅ Account Created
      ↓
Application


Use subtle form and validation animations.

🚪 Logout / Sign Out
Logout
  ↓
Signing you out...
  ↓
Session Cleared
  ↓
Sign In


Authenticated content should disappear before the user returns to the authentication screen.

🔄 Page Transitions

Use subtle transitions when navigating between:

Home
Jobs
Job Details
Saved
People
Network
Alerts
Profile
Settings

Use:

Fade
Slide
Scale
Stagger

Animations should be fast and smooth.

Respect:

prefers-reduced-motion

⏳ Loading & Error States

Never display an unexplained blank screen.

Use:

Skeleton loaders
Job-card skeletons
Profile skeletons
Network skeletons
Loading buttons
Toast notifications

Handle errors clearly for:

Login
Registration
Applications
Network requests
Profile updates
Search
🤝 What Developers Can Contribute

Developers are welcome to contribute:

💬 Feedback
🐛 Bug fixes
✨ New features
🎨 UI improvements
♿ Accessibility improvements
⚡ Performance improvements
🧹 Code refactoring
📱 Mobile improvements
🎬 Animation improvements
💡 Future Improvements

Potential future features include:

🔍 Advanced job search
📍 Location-based job discovery
🏷️ Advanced filtering
🔖 Saved jobs
👤 Advanced professional profiles
📤 Direct job applications
🏢 Company profiles
🔔 Real-time notifications
📊 Application tracking
🌙 Dark/light theme options
🤝 Professional networking
💬 Messaging
📱 Improved mobile experience
🏗️ Technology Stack
Frontend
⚛️ React 19
📘 TypeScript
⚡ Vite
🧭 React Router
🎨 Tailwind CSS 4
🖼️ Lucide React
✨ Motion
Backend
🟢 Node.js
🚂 Express
📘 TypeScript
🍃 MongoDB
🧩 Mongoose
🔐 JWT
🔑 bcrypt
📎 Multer
🌐 CORS
🔧 dotenv
📁 Project Structure
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

📋 API Reference

All protected endpoints require:

Authorization: Bearer <jwt-token>

🔐 Authentication
Method	Endpoint	Description
POST	/api/auth/register	Create an account and send verification code
POST	/api/auth/verify-email	Verify a six-digit email code
POST	/api/auth/login	Validate credentials and send login OTP
POST	/api/auth/login/verify-otp	Verify login OTP and issue JWT
POST	/api/auth/forgot-password	Send password reset code
POST	/api/auth/reset-password	Set a new password with reset code
GET	/api/auth/me	Return the authenticated user
👨‍💻 Seeker
Method	Endpoint	Description
GET	/api/seeker/profile	Get the current seeker's profile
PATCH	/api/seeker/profile	Update the current seeker's profile
GET	/api/seeker/jobs	List accessible published jobs
GET	/api/seeker/jobs/:id	Get an accessible job
POST	/api/seeker/applications	Apply to a job with { "jobId": "..." }
GET	/api/seeker/applications	List the current seeker's applications

GET /api/seeker/jobs accepts an optional q query parameter.

Search matches:

Job title
Company
Required skills
🛠️ Administration

All /api/admin endpoints require an authenticated administrator.

Method	Endpoint	Description
GET	/api/admin/stats	Get dashboard counts
GET	/api/admin/seekers	List seekers and profiles
PATCH	/api/admin/seekers/:id/profile	Update a seeker's profile
GET	/api/admin/jobs	List all jobs
POST	/api/admin/jobs	Create a job
PATCH	/api/admin/jobs/:id	Update a job
DELETE	/api/admin/jobs/:id	Delete a job
GET	/api/admin/applications	List all applications
PATCH	/api/admin/applications/:id/status	Update an application status
📎 Uploads & Health
Method	Endpoint	Description
POST	/api/upload	Upload one authenticated resume file
GET	/api/uploads/:id	Authenticated GridFS file retrieval
GET	/api/health	Return { "status": "ok" }

Uploaded files are stored in MongoDB GridFS and are not served as unrestricted static files.

🗄️ Data Model
User

Contains:

Email
bcrypt password hash
Role

Roles:

ADMIN
SEEKER

Profile

One-to-one seeker profile containing:

Contact details
Skills
Resume
Preferred title
Expected salary
Job

Contains:

Title
Company
Category
Description
Requirements
Employment details
Salary
Skills
Openings
Status
Visibility
Optional assigned seeker
Application

Contains:

Seeker
Job
Application status
Application date

Supported pipeline statuses:

APPLIED
UNDER_REVIEW
SHORTLISTED
INTERVIEW
SELECTED
REJECTED

🔄 User Workflow
👨‍💻 Seeker
Register / Login
      ↓
Verify Account
      ↓
Browse Jobs
      ↓
Search / Filter
      ↓
View Job
      ↓
Save or Apply
      ↓
Application Submitted
      ↓
Track Application

🛠️ Administrator
Login
  ↓
Dashboard
  ↓
Create / Manage Jobs
  ↓
Publish Job
  ↓
Review Applications
  ↓
Update Candidate Status
  ↓
Manage Hiring Pipeline

📦 Installation
Prerequisites
Node.js 18+
npm
MongoDB or MongoDB Atlas
Install Dependencies

From the repository root:

npm run install:all


Create the backend environment file:

copy .env.example backend\.env


Update:

PORT=5001
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster>/<database>
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development

▶️ Running Locally

Start frontend and backend together:

npm run dev


Default development URLs:

Frontend → http://localhost:5173
Backend  → http://localhost:5001


Run applications separately:

npm run dev --prefix backend
npm run dev --prefix frontend

🚀 Production Build

Build the project:

npm run build


Start the production backend:

npm start


In production, Express serves the compiled frontend from:

frontend/dist


and provides SPA fallback routing.

📜 Available Scripts
Command	Purpose
npm run install:all	Install root, frontend, and backend dependencies
npm run dev	Run frontend and backend concurrently
npm run build	Build frontend and backend
npm start	Start production backend
npm run lint	Run repository lint placeholder
🔐 Security & Deployment
🔒 Never commit backend/.env.
🔑 Replace the example JWT secret before deployment.
🗄️ Use a restricted MongoDB user.
🌐 Configure MongoDB Atlas network access correctly.
📎 Protect uploaded resume files.
💾 Use persistent storage or external object storage for production deployments.
🍪 Consider moving JWT storage from browser local storage to an httpOnly cookie strategy for higher-security deployments.
🤝 Contributions

Contributions, suggestions, and feedback are welcome.

If you have an idea that could improve STACK PORTAL, feel free to:

Open an issue
Suggest a feature
Report a bug
Submit improvements
Share UI/UX feedback
Improve performance
Improve accessibility
🎯 Project Goal

The long-term goal of STACK PORTAL is to evolve from a basic job portal into a complete platform connecting:

Job Seekers + Professionals + Employers

through a simple, modern, intuitive, and professional experience.

The primary focus is on:

🎨 UI/UX design
💡 Creative problem-solving
📱 Responsive web development
👤 User-friendly interfaces
💼 Job discovery
🤝 Professional networking
🔐 Secure authentication
⚡ Performance
✨ Modern interactions and animations
⭐ Developer Note

This project is built as a learning and development project based on real-world user requirements.

The goal is to continuously improve the platform through better:

UI/UX
Functionality
Accessibility
Performance
Security
User experience
<div align="center">
🚀 Have an idea for STACK PORTAL?

Your feedback and suggestions are always welcome.

💙 Built with passion for better career opportunities.

Created by ClimberCoder [Vansh]

</div>
