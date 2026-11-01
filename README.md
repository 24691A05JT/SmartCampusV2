# Smart Campus Event & Activity Management System
### *AI-Powered Event Recommendation, Engagement Analytics & Digital Campus Services*

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248.svg)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-Academic%20Evaluation-orange.svg)]()

---

## 1. Project Overview

The **Smart Campus Event & Activity Management System** is a major full-stack academic web platform designed to streamline event lifecycles, automated facility scheduling, student participation, and institutional engagement metrics across universities and colleges.

Equipped with an **Explainable AI Content-Based Recommendation Engine**, a **Venue Schedule Conflict Detection Engine**, **Automated Verifiable PDF Certificate Generation (PDFKit)**, and **Interactive Multi-Role Analytics Dashboards (Recharts)**, the system replaces fragmented notice boards and spreadsheets with an enterprise-grade digital campus service.

---

## 2. Key Features by User Role

### 👨‍🎓 2.1 Student Portal
- **Smart Discovery**: Browse approved events with dynamic category filters, department filtering, date pickers, venue search, and responsive pagination.
- **Explainable AI Recommendations**: Personalized feed based on department curriculum, student interests, skill vectors, and historical event ratings with transparent scoring justifications.
- **Frictionless Registration**: One-click registration with real-time seat counters, eligibility checks, duplicate prevention, and cancellation options.
- **My Registrations & Schedule Calendar**: Dedicated dashboard tracking upcoming sessions, completed events, attendance records, and personalized calendar view.
- **Feedback & Ratings**: 1–5 star ratings and written reviews available strictly after confirmed attendance.
- **Digital Certificates**: Automatically unlocked verifiable PDF certificate generation upon confirmed attendance and event completion with tamper-resistant certificate IDs.
- **Notification Hub**: Real-time updates for approvals, registration status, schedule modifications, and attendance changes.

### 👩‍🏫 2.2 Organizer & Faculty Portal
- **Full Lifecycle Event Management**: Create, edit, save drafts, publish, and track event status (`draft` ➔ `pending` ➔ `approved` / `rejected`).
- **Automated Venue Conflict Detection**: Real-time algorithm checks overlapping venue reservations before submission to prevent double-booking campus halls.
- **Participant Roster & Export**: Searchable participant lists with status filters and one-click CSV export for departmental records.
- **Attendance Management**: Single-click and bulk attendance marking (`present`/`absent`) with authorization locks.
- **Organizer Analytics**: Real-time metrics on registration velocities, venue capacity utilization rates, average ratings, and participant demographics.

### 🛡️ 2.3 Administrator Portal
- **Executive Campus Command Center**: Total users, active students, organizers, event throughput, registration volume, attendance rates, and feedback stats.
- **User Governance**: Search and manage user accounts with role filters and account activation/deactivation controls (never exposing sensitive password hashes).
- **Event Moderation Workflow**: Review pending submissions with detailed approval logs and structured rejection reasons communicated to organizers.
- **Verifiable Certificate Registry**: Search and verify generated certificates with tamper-detection verification hashes.
- **Audit Logging**: Comprehensive traceability logging for administrative actions, user role modifications, and event approvals.

---

## 3. System Architecture & Tech Stack

```
SmartCampusV2/
├── backend/                  # Node.js + Express.js REST API
│   ├── src/
│   │   ├── config/           # Database, environment, email configs
│   │   ├── controllers/      # Request handlers for Auth, Events, Registrations, etc.
│   │   ├── middleware/       # JWT Auth, RBAC guards, validation, rate limiting
│   │   ├── models/           # Mongoose Data Models (User, Event, Registration, etc.)
│   │   ├── routes/           # RESTful API route definitions
│   │   ├── services/         # Recommendation Engine, PDF Generator, Conflict Detector
│   │   └── utils/            # Standard response envelopes, validators
│   └── tests/                # Automated Supertest integration tests
│
└── frontend/                 # React 18 + Vite SPA
    ├── src/
    │   ├── components/       # Design System UI components (Buttons, Modals, Cards, etc.)
    │   ├── context/          # AuthContext, NotificationContext, ThemeContext
    │   ├── layouts/          # PublicLayout, DashboardLayout with Sidebar
    │   ├── pages/            # Student, Organizer, Admin views and Public Landing
    │   └── services/         # Axios API clients
```

### Technology Stack
- **Frontend**: React.js 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons.
- **Backend**: Node.js (v18+), Express.js, RESTful API architecture.
- **Database**: MongoDB Atlas with Mongoose ODM, compound indexing, and relational references.
- **Authentication**: JSON Web Tokens (JWT) with HTTP-only tokens / Bearer headers, bcryptjs password hashing, secure reset tokens.
- **Additional Services**: PDFKit (Vector Certificate Generation), Nodemailer (Email notifications), In-Memory MongoDB for automated testing.

---

## 4. Database Overview

The MongoDB database contains 8 core collections with compound indexes to enforce integrity:

1. **`users`**: Student, Organizer, and Admin profiles, interests, skills, and secure credentials.
2. **`events`**: Campus events, capacity, timings, venue details, approval state, and tags.
3. **`registrations`**: Unique student-event pairs with registration timestamps and ticket codes.
4. **`attendances`**: Attendance records linked to registrations, verified by organizers.
5. **`feedbacks`**: 1–5 star reviews submitted strictly by verified attendees.
6. **`certificates`**: Cryptographically verifiable certificates with unique IDs and hashes.
7. **`notifications`**: User-specific in-app notification alerts with read/unread tracking.
8. **`auditlogs`**: Immutable security logs of administrative decisions and status changes.

---

## 5. API Overview (Sample Endpoints)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Student/Faculty Registration | Public |
| `POST` | `/api/auth/login` | Authenticate & generate JWT | Public |
| `POST` | `/api/auth/forgot-password`| Request password reset token | Public |
| `POST` | `/api/auth/reset-password` | Reset password using token | Public |
| `GET` | `/api/events` | Browse approved events with filters | Public / Student |
| `POST` | `/api/events` | Create new event draft / submission | Organizer / Admin |
| `POST` | `/api/events/check-conflict` | Verify venue availability | Organizer / Admin |
| `PATCH`| `/api/events/:id/approve` | Approve submitted event | Admin |
| `POST` | `/api/registrations/:id` | Register for an event | Student |
| `POST` | `/api/attendance/bulk` | Mark attendance for event roster | Organizer / Admin |
| `GET` | `/api/recommendations` | Get personalized AI recommendations | Student |
| `GET` | `/api/certificates/verify/:id`| Verify certificate authenticity | Public |
| `GET` | `/api/analytics/dashboard`| Multi-role analytics metrics | Authenticated |

---

## 6. Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartcampus?retryWrites=true&w=majority
JWT_SECRET=super_secure_jwt_secret_key_campus_v2_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_INITIAL_EMAIL=admin@campus.edu
ADMIN_INITIAL_PASSWORD=AdminSecurePass@2026
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_password
EMAIL_FROM="Smart Campus <noreply@smartcampus.edu>"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 7. Local Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB Atlas connection string or local MongoDB instance

### Installation
```bash
# Clone the repository
git clone https://github.com/Haricharan-25/Smart-_Billing-_FrontEnd.git
cd SmartCampusV2

# Setup Backend
cd backend
npm install
cp .env.example .env
# Fill in your environment variables in .env
npm run dev

# Setup Frontend (in a new terminal)
cd ../frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 8. Automated Testing

The project includes unit, integration, and build tests:
```bash
# Run backend API test suite
cd backend
npm test

# Run frontend build verification
cd ../frontend
npm run build
```

---

## 9. Deployment Architecture

- **Frontend**: Continuous Deployment via Vercel connected to the repository's `frontend` folder with SPA rewrite rule.
- **Backend**: Containerized/Node Web Service on Render with automatic environment configuration and health checks (`/api/health`).
- **Database**: High-availability MongoDB Atlas cloud database with IP whitelist and encrypted credentials.

---

## 10. Screenshots & UI Gallery
*(Screenshots of Student Dashboard, AI Recommendations, Organizer Venue Conflict Detector, Admin Control Room, and PDF Certificates will be showcased here upon phase completion)*

---

## 11. Future Enhancements
- Mobile Application with React Native / PWA offline capability.
- QR-Code camera scanner for mobile check-in by event organizers.
- Automated calendar sync (.ics export to Google Calendar and Microsoft Outlook).
