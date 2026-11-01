# Smart Campus Event & Activity Management System
## Architectural Blueprint & System Specifications (Antigravity Project Masterplan)

---

## 1. Project Overview & Faculty Evaluation Standards

### 1.1 Executive Summary
The **Smart Campus Event & Activity Management System** is a next-generation, presentation-ready academic and co-curricular operations platform. Built for university-wide deployment, it unifies event lifecycle workflows, automated venue conflict detection, participant registration with capacity enforcement, attendance auditing, verifiable PDF certificates, interactive campus engagement analytics, and an explainable AI content-based recommendation engine.

### 1.2 Core Architectural Principles
- **Zero-Trust Backend Authorization**: Frontend route guards are purely UX conveniences. Every single API endpoint enforces authentication (JWT) and role-based permissions (RBAC).
- **Presentation-Grade SaaS Aesthetic**: Clean, modern dark/light-compatible UI crafted with Tailwind CSS, subtle glassmorphism, responsive data grids, skeleton loaders, and micro-interactions.
- **Fail-Safe Async UI Design**: Every view implements a 4-state lifecycle: `Loading`, `Success`, `Empty`, and `Error`. Zero unhandled runtime exceptions or blank screens.
- **Explainable Native AI**: High-performance, explainable vector recommendation engine running natively in Node.js without heavy external Python dependencies.
- **Tamper-Resistant Digital Credentials**: Cryptographically keyed, verifiable PDF certificates rendered server-side via PDFKit with public verification endpoints.

---

## 2. System Architecture & High-Level Topology

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  React 18 + Vite SPA | Tailwind CSS | React Router 6 | Recharts | Lucide Icons    |
+-----------------------------------------------------------------------------------+
                                        |  HTTPS / REST JSON
                                        v
+-----------------------------------------------------------------------------------+
|                                 SECURITY LAYER                                    |
|   Helmet | Rate Limiter | CORS Policies | JWT Auth | RBAC Guard | Input Sanitizer |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                             EXPRESS 4 REST API LAYER                              |
|  Controllers -> Services -> Model Layer                                           |
|  - Auth & Profile Controller         - AI Recommendation Engine                   |
|  - Event Lifecycle & Conflict Guard  - Analytics & Metric Aggregations            |
|  - Registration & Capacity Guard     - Certificate Generation (PDFKit)            |
|  - Attendance & Audit Logger         - Notification & Mail Service (Nodemailer)   |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                                 DATABASE LAYER                                    |
|  MongoDB Atlas (Mongoose ODM)                                                     |
|  - Collections: Users, Events, Registrations, Attendance, Feedback,               |
|                 Certificates, Notifications, AuditLogs                            |
|  - Indexes: Compound unique indexes for conflict prevention & deduplication       |
+-----------------------------------------------------------------------------------+
```

---

## 3. Role-Based Access Control (RBAC) Matrix

| Domain / Resource | Action / Endpoint | Student | Organizer / Faculty | Admin | Public / Unauth |
|---|---|:---:|:---:|:---:|:---:|
| **Authentication** | Register / Login / Reset Password | Yes | Yes (Faculty Request) | Seed Only | Yes |
| **Profile** | View / Edit Self Profile | Yes | Yes | Yes | No |
| **Events** | View Approved & Published Events | Read | Read | Read | Read |
| **Events** | Create Draft / Submit Event | No | Yes | Yes | No |
| **Events** | Edit / Delete Own Event | No | Yes (Draft/Pending) | Yes (Any) | No |
| **Events** | Approve / Reject Event (Audit Log) | No | No | Yes | No |
| **Venue Conflicts** | Run Real-time Conflict Detector | No | Yes | Yes | No |
| **Registrations** | Register / Cancel Registration | Yes | No | View / Manage | No |
| **Attendance** | Mark Present/Absent & Bulk Update | No | Yes (Own Events) | Yes (Any) | No |
| **Feedback** | Submit Rating & Comment (1-5) | Yes (Attended Only) | No | Moderate | No |
| **Certificates** | Generate & Download PDF | Yes (Eligible Only) | No | View All | Public Verify |
| **AI Recommendations**| Get Personalized Feed & Explanations | Yes | View Sample | System Preview | Fallback Only |
| **Analytics** | Dashboard & Trend Visualizations | Personal Stats | Event Metrics | Institutional KPIs | No |
| **Audit Logs** | System Event & Admin Action Log | No | No | Full Access | No |

---

## 4. Database Schema Specifications (MongoDB / Mongoose)

### 4.1 `User` Schema
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'organizer', 'admin'], default: 'student', index: true },
  department: { type: String, required: true }, // e.g. "CSE", "ECE", "MECH", "MBA"
  year: { type: Number, min: 1, max: 5 },
  semester: { type: Number, min: 1, max: 10 },
  interests: [{ type: String }], // e.g. ["Web Development", "AI/ML", "Robotics", "Cultural"]
  skills: [{ type: String }],    // e.g. ["JavaScript", "Python", "Public Speaking"]
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpire: { type: Date, select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### 4.2 `Event` Schema
```javascript
{
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Technical', 'Workshop', 'Cultural', 'Sports', 'Seminar', 'Hackathon', 'Webinar', 'Career'], 
    index: true 
  },
  tags: [{ type: String, index: true }],
  targetDepartment: { type: String, default: 'All' }, // 'All' or specific e.g. 'CSE'
  targetYear: [{ type: Number }], // [1, 2, 3, 4] or empty for all
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true }, // HH:mm format e.g. "10:00"
  endTime: { type: String, required: true },   // HH:mm format e.g. "13:00"
  venue: { type: String, required: true, index: true }, // e.g. "Auditorium A", "Lab 301"
  capacity: { type: Number, required: true, min: 1 },
  registeredCount: { type: Number, default: 0, min: 0 },
  registrationDeadline: { type: Date, required: true },
  bannerImage: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'approved', 'rejected'], 
    default: 'draft', 
    index: true 
  },
  rejectionReason: { type: String, default: '' },
  isCancelled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
// Compound Index for Conflict Optimization:
// { venue: 1, date: 1, status: 1 }
```

### 4.3 `Registration` Schema
```javascript
{
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  registrationDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed', index: true },
  ticketCode: { type: String, unique: true, index: true }, // unique UUID / human-readable hash
  cancelledAt: { type: Date }
}
// Unique compound index:
// { event: 1, student: 1 } (Prevents duplicate registrations)
```

### 4.4 `Attendance` Schema
```javascript
{
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  markedAt: { type: Date, default: Date.now },
  remarks: { type: String, default: '' }
}
// Unique compound index:
// { event: 1, student: 1 }
```

### 4.5 `Feedback` Schema
```javascript
{
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true },
  submittedAt: { type: Date, default: Date.now }
}
// Unique compound index:
// { event: 1, student: 1 }
```

### 4.6 `Certificate` Schema
```javascript
{
  certificateId: { type: String, required: true, unique: true, index: true }, // e.g. "CERT-2026-X9A2F1"
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  issueDate: { type: Date, default: Date.now },
  verificationHash: { type: String, required: true },
  status: { type: String, enum: ['valid', 'revoked'], default: 'valid' }
}
// Unique compound index:
// { event: 1, student: 1 }
```

### 4.7 `Notification` Schema
```javascript
{
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['registration', 'approval', 'rejection', 'attendance', 'certificate', 'event_update', 'system'], 
    default: 'system' 
  },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now }
}
```

### 4.8 `AuditLog` Schema
```javascript
{
  action: { type: String, required: true, index: true }, // e.g., "EVENT_APPROVED", "USER_DEACTIVATED"
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetModel: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
}
```

---

## 5. Explainable AI Recommendation Engine Formulation

### 5.1 Objective
Deliver a personalized, content-based recommendation score $S \in [0, 100]$ for each upcoming approved event, paired with an explainable justification string.

### 5.2 Mathematical Scoring Formulation
$$S_{total} = \min(100, S_{dept} + S_{interests} + S_{skills} + S_{popularity} + S_{affinity})$$

Where:
1. **Department Match ($S_{dept}$, Weight = 30 pts):**
   $$S_{dept} = \begin{cases} 30 & \text{if } E_{dept} = 'All' \lor E_{dept} = U_{dept} \\ 0 & \text{otherwise} \end{cases}$$

2. **Interests Vector Overlap ($S_{interests}$, Weight = 35 pts):**
   $$J_{interests} = \frac{|U_{interests} \cap (\{E_{cat}\} \cup E_{tags})|}{|U_{interests} \cup (\{E_{cat}\} \cup E_{tags})|}$$
   $$S_{interests} = \text{round}(35 \times J_{interests})$$

3. **Skills Alignment ($S_{skills}$, Weight = 15 pts):**
   $$S_{skills} = \min\left(15, 7.5 \times |U_{skills} \cap E_{tags}|\right)$$

4. **Event Popularity & Urgency ($S_{popularity}$, Weight = 10 pts):**
   $$S_{popularity} = \text{round}\left(10 \times \frac{E_{registered}}{E_{capacity}}\right)$$

5. **Historical Category Affinity ($S_{affinity}$, Weight = 10 pts):**
   If student previously attended an event in $E_{cat}$ and rated it $\ge 4$:
   $$S_{affinity} = 10 \quad (\text{else } 0)$$

### 5.3 Explanation Generation Engine
- If $S_{dept} = 30$ and $S_{interests} > 15$:
  `"Recommended because this event matches your ${user.department} curriculum and your interest in ${matchedInterest}."`
- If $S_{affinity} = 10$:
  `"Recommended based on your positive 5-star experience with previous ${event.category} workshops."`
- If $S_{popularity} \ge 8$:
  `"Trending fast! Over ${utilization}% of seats are already reserved by fellow campus peers."`
- **Cold-Start Fallback**: When user profile has no filled skills/interests, the engine recommends top approved upcoming events sorted by highest rating and registrations with the reason:
  `"Campus Popular: Highly rated and trending among students across all departments."`

---

## 6. Venue Conflict & Schedule Overlap Algorithm

To prevent double-booking of physical campus facilities (auditoriums, seminar halls, computer labs):
Two events $E_A$ and $E_B$ conflict if and only if:
1. $E_A.venue == E_B.venue$
2. $E_A.date == E_B.date$
3. Both events are in `approved` or `pending` status (drafts don't reserve venue).
4. Time interval overlap condition:
   $$\max(Start_A, Start_B) < \min(End_A, End_B)$$

The conflict service executes this verification query before any event draft submission or approval and provides the exact conflict details (e.g., *"Venue Conflict: 'Auditorium A' is already booked for 'AI Conclave' on 2026-11-15 from 10:00 to 12:30"*).

---

## 7. Digital Certificate Generation & Cryptographic Verification

1. **Eligibility Criteria**:
   - Valid `Registration` with status `confirmed`.
   - `Attendance` record with status `present`.
   - Event `date` and `endTime` are in the past.
2. **Tamper-Resistant Certificate ID**:
   - Format: `CERT-YYYY-[SHA256(studentId + eventId + salt).substring(0,8).toUpperCase()]`
3. **Public Verification Route**:
   - `/verify/:certificateId` or `/api/certificates/verify/:certificateId`
   - Returns verified student name, event title, organizer department, date of event, and issue timestamp.
4. **PDFKit Generation**:
   - Landscape A4 (841.89 x 595.28 pt)
   - High-resolution SVG border, university seal/crest, signature lines, gold accent ribbons, and embedded QR code pointing to verification link.

---

## 8. Frontend Design System & Component Guidelines

- **Color Palette**:
  - Primary: Deep Indigo / Violet (`#4f46e5`, `#6366f1`)
  - Backgrounds: Dark (`#090d16` canvas, `#111827` cards) / Crisp Light (`#f8fafc` canvas, `#ffffff` cards)
  - Semantic: Emerald (`#10b981`) for Approved/Present; Amber (`#f59e0b`) for Pending/Waitlist; Rose (`#ef4444`) for Rejected/Absent
- **Component Standard Checklist**:
  - `Button`: Primary, Secondary, Outline, Danger, Ghost; built-in spinner loading state and disabled accessibility.
  - `Input` & `Select`: Label, error message, helper text, clear focus rings, password visibility eye toggles.
  - `Card`: Hover micro-elevations, consistent padding, clean separator borders.
  - `Table`: Responsive container, striped/hover rows, empty state graphic, sorting headers.
  - `Modal`: Backdrop blur, ESC key dismiss, trapped focus, smooth entrance animation.
  - `Toast`: Global notification system (Success, Error, Warning, Info) with auto-dismiss.
  - `SkeletonLoader`: Pulsing content placeholders for async page loads to eliminate layout shift.

---

## 9. Comprehensive Testing Strategy

- **Unit & Integration Tests (Backend)**:
  - Supertest + Jest/Vitest with `mongodb-memory-server`
  - Auth, Role-Based Access Guards, Event CRUD, Conflict Detection, Registration Capacity, Attendance, AI Recommendation Scoring, Certificates.
- **Frontend Build & Component Validation**:
  - Strict Vite production build (`npm run build`) with zero lint/type/bundler errors.
  - Form validation tests, UI state rendering tests.
- **Security Audit**:
  - Password hashing verification (bcrypt salt rounds = 10).
  - JWT token tamper tests, expired token rejection, unauthorized role access denial.
  - SQL/NoSQL injection prevention (Mongoose typed schemas and sanitized query objects).

---

## 10. Deployment Topology

- **Frontend**: Hosted on Vercel with SPA routing rewrite (`vercel.json`).
- **Backend**: Hosted on Render as a Web Service with environment variables, health check probe `/api/health`, and automated restart.
- **Database**: MongoDB Atlas M0/M10 multi-region cluster with automated backups and network IP access list.
- **Continuous Integration**: Automated test and build verification before merging to production.
