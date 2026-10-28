# StaffSync — Modern Human Resource Management System (HRMS)

StaffSync is an enterprise-grade, modern web-based Human Resource Management System (HRMS) built from scratch using the **MERN** stack (MongoDB, Express.js, React.js, Node.js). It digitizes, automates, and unifies workforce operations across three distinct organizational roles: **HR Administrator**, **Manager**, and **Employee**.

---

## 🌟 Key Features by Role

### 1. 🛡️ HR Administrator Portal
- **Executive Analytics Dashboard**: Real-time KPI summary cards, interactive Recharts visualizations (7-Day Attendance Trends, Department Headcount Distribution, Leave Request Ratios).
- **Employee Directory & Lifecycle Management**: Add new staff, modify designations, assign departments and reporting managers, toggle account statuses (`ACTIVE`, `INACTIVE`, `PROBATION`, `TERMINATED`).
- **Department Structure**: Create, modify, and manage organizational units with designated managers, locations, and real-time employee counts.
- **Organization-Wide Attendance**: Live daily rosters, historical filter logs, manual timestamp correction with required audit logging and employee alerts, CSV report export.
- **Leave Administration**: Review company-wide leave requests, approve or reject with comments, export leaves to CSV.
- **Company Announcements**: Broadcast organizational news, policy updates, festive notices, and event announcements with priority tags.
- **Training & Development**: Schedule corporate training programs, set capacity limits, monitor participant enrollments, certify course completion.
- **Exportable Reports**: One-click CSV downloads for Attendance, Leaves, and Employee Master records.

### 2. 👔 Manager Portal
- **Scoped Supervision**: Scoped strictly to assigned reporting team members.
- **Team Attendance Roster**: Daily shift check-in statuses (Present, Absent, Late), working hours breakdown, date picker history.
- **Leave Approvals**: Review submitted requests from direct reports; approve or reject with mandatory decision comments and atomic database updates.
- **Team Training**: Create and schedule workshops specifically for team members; track attendee participation and completion.
- **Team Member Directory**: Search and view employee profiles, contact information, and department designations.

### 3. 👤 Employee Portal
- **Smart Shift Attendance**: One-click Clock In and Clock Out with automated server-side working hours calculation, late arrival detection (post 9:30 AM), and duplicate clock-in/out protection.
- **Leave Application Workflow**: Apply for time off across 4 categories (Casual, Sick, Earned, Unpaid), automatic date range validation, overlapping leave detection, and request cancellation for pending items.
- **Training Hub**: Browse available technical courses, self-enroll with seat capacity enforcement, track completion status and trainer evaluations.
- **Company Newsfeed**: Read company announcements categorized by General, HR Policy, Events, and Holidays with search and priority tags.
- **Profile & Security**: Inspect verified administrative records (readonly employee ID, salary, department), update personal phone/address, and change account passwords.
- **Real-Time Notifications**: Unread badges and instant alerts for leave decisions, training registrations, and administrative announcements.

---

## 💻 Technology Stack

### Frontend
- **React 18** via **Vite 6**
- **Bootstrap 5** & Modern Custom SaaS CSS
- **React Icons** (Feather icon set)
- **React Router DOM v7** (Nested protected routes & role-based guards)
- **Redux Toolkit** (Global authentication and user session state)
- **Recharts** (Interactive Area, Bar, and Pie/Donut charts)
- **React Hot Toast** (Toast feedback notifications)
- **Axios** (Centralized API client with JWT interceptor & 401 handling)

### Backend
- **Node.js** & **Express.js** (ES Modules)
- **MongoDB** & **Mongoose ODM**
- **JSON Web Tokens (JWT)** (Secure stateless authentication)
- **Bcryptjs** (10-round salted password hashing)
- **Express Validator** (Input validation & sanitization)
- **Helmet, CORS & Morgan** (HTTP security headers & dev logging)
- **MongoMemoryServer** (Embedded standalone fallback ensuring zero setup failures)

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+ or v20+ LTS recommended)
- npm (v9+)
- MongoDB (Optional: The application automatically connects to local MongoDB on `mongodb://127.0.0.1:27017/staffsync` OR launches an embedded native standalone instance if a daemon is not running).

### 1. Clone & Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/staffsync
JWT_SECRET=staffsync_super_secret_jwt_key_2026_xyz
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🔑 Demo Accounts & Pre-Seeded Data

The system comes pre-seeded with realistic organizational data (1 HR Director, 2 Department Managers, and 11 Employees across 5 departments, past attendance logs, leaves, announcements, trainings, and notifications).

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **HR Administrator** | Eleanor Vance | `hr@staffsync.com` | `Admin@123` |
| **Manager (Engineering)** | Sarah Chen | `manager.sarah@staffsync.com` | `Manager@123` |
| **Manager (Marketing)** | David Rodriguez | `manager.david@staffsync.com` | `Manager@123` |
| **Employee (Senior Engineer)**| John Doe | `john.doe@staffsync.com` | `Employee@123` |
| **Employee (Frontend Dev)** | Jane Smith | `jane.smith@staffsync.com` | `Employee@123` |

*(Tip: The landing page and login page feature instant 1-click demo buttons that pre-fill credentials for quick evaluation!)*

---

## 🏃 Running the Application

### Start the Backend Server
```bash
cd server
npm run dev
# Server runs on: http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### Start the Frontend Client
```bash
cd client
npm run dev
# Frontend runs on: http://localhost:5173
```

### Reset / Re-Seed Sample Database
```bash
cd server
npm run seed
```

---

## 🧪 Automated Testing

A comprehensive automated test suite covers Authentication, RBAC, Attendance Clock-in/Clock-out, Leave Request & Approval workflows, and Training registrations.

Run tests:
```bash
cd server
npm test
```
*Result: 25 passing test suites verifying end-to-end functionality.*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Employee registration (enforces `EMPLOYEE` role)
- `POST /api/auth/login` - User login with JWT generation
- `GET /api/auth/me` - Retrieve current authenticated profile
- `PUT /api/auth/profile` - Update permitted contact details (phone, address)
- `POST /api/auth/change-password` - Securely change account password
- `POST /api/auth/logout` - Logout and invalidate session

### Employees (`/api/employees`)
- `GET /api/employees` - List employees (HR sees all; Managers see direct team)
- `POST /api/employees` - Create new employee/manager (HR only)
- `GET /api/employees/:id` - Get employee profile by ID
- `PUT /api/employees/:id` - Update employee administrative fields (HR only)
- `PATCH /api/employees/:id/status` - Toggle account status (`ACTIVE`, `INACTIVE`, etc.)
- `GET /api/employees/:id/attendance` - Get attendance history for employee
- `GET /api/employees/:id/leaves` - Get leave history for employee

### Departments (`/api/departments`)
- `GET /api/departments` - List all departments with headcount & managers
- `POST /api/departments` - Create new department (HR only)
- `PUT /api/departments/:id` - Update department details (HR only)
- `DELETE /api/departments/:id` - Delete department (blocked if employees assigned)

### Attendance (`/api/attendance`)
- `POST /api/attendance/clock-in` - Record today's clock in (prevents duplicates, checks late threshold)
- `POST /api/attendance/clock-out` - Record clock out (calculates duration and half-day thresholds)
- `GET /api/attendance/me` - Current employee's attendance record and monthly stats
- `GET /api/attendance/team` - Manager's team roster and attendance metrics
- `GET /api/attendance` - Organization-wide attendance (HR only)
- `PATCH /api/attendance/:id/correction` - Manual HR correction with audit log

### Leaves (`/api/leaves`)
- `POST /api/leaves` - Submit leave request (validates date order & overlaps)
- `GET /api/leaves/me` - Current employee's leaves & remaining quota
- `GET /api/leaves` - List leaves (scoped by role)
- `PATCH /api/leaves/:id/approve` - Approve request with comments (Manager/HR)
- `PATCH /api/leaves/:id/reject` - Reject request with comment (Manager/HR)
- `PATCH /api/leaves/:id/cancel` - Cancel pending request (Applicant only)

### Trainings (`/api/trainings`)
- `GET /api/trainings` - List upcoming and completed courses
- `POST /api/trainings` - Create new workshop (HR / Manager)
- `POST /api/trainings/:id/enroll` - Enroll employee (validates seat capacity)
- `PATCH /api/trainings/:id/enrollments/:enrollmentId` - Mark participant completion

### Announcements (`/api/announcements`)
- `GET /api/announcements` - List published announcements (with category & search filter)
- `POST /api/announcements` - Publish announcement (HR only)
- `PUT /api/announcements/:id` - Edit announcement (HR only)
- `DELETE /api/announcements/:id` - Remove announcement (HR only)

### Reports & Analytics (`/api/reports`)
- `GET /api/reports/dashboard` - Aggregated charts and KPI metrics
- `GET /api/reports/attendance?format=csv` - Stream attendance data as CSV
- `GET /api/reports/leaves?format=csv` - Stream leave data as CSV
- `GET /api/reports/employees?format=csv` - Stream employee directory as CSV

---

## 🔒 Security Architecture
1. **Password Hashing**: Bcrypt with 10 salt rounds; passwords never stored or returned in plaintext.
2. **Stateless JWT Authorization**: Signed bearer tokens with 7-day expiration.
3. **Server-Enforced Authorization**: Roles are determined strictly from verified database records.
4. **Scoped Visibility**: Team managers cannot access unrelated departments or approve their own leaves.
5. **Auditing**: Sensitive modifications (attendance corrections, status toggles) are written to the `AuditLog` collection.
6. **Input Validation**: Express-validator enforces sanitization and parameter checks on all mutation endpoints.

---

## 📄 License
This project is licensed under the ISC License.
