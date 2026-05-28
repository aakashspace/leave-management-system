# Leave Management System (LMS)
**IGNOU BCA Final Year Project** — MEVN Stack (MongoDB, Express.js, Vue.js 3, Node.js)

---

## Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **MongoDB** Community Server (running locally on port 27017) — https://www.mongodb.com/try/download/community

---

## Project Structure

```
LMS/
├── backend/              ← Express.js API (port 5000)
│   ├── config/           ← MongoDB connection
│   ├── controllers/      ← Route handlers (authController, etc.)
│   ├── middleware/       ← JWT auth middleware (verifyToken, requireAdmin, requireEmployee)
│   ├── models/           ← Mongoose schemas
│   ├── routes/           ← API routes (auth, users, departments, leaveTypes, leaveRequests, reports)
│   ├── seeds/            ← Seed data + auto admin seeding
│   ├── tests/            ← API test suite (62 tests)
│   ├── .env
│   └── server.js
└── frontend/             ← Vue.js 3 app (port 5173)
    └── src/
        ├── api/          ← Axios instance (JWT interceptor)
        ├── layouts/      ← Employee & Admin layouts
        ├── router/       ← Vue Router (JWT navigation guard)
        ├── store/        ← Pinia store (auth state)
        └── views/        ← All pages
```

---

## Setup & Running

### Step 1 — Configure Environment
Create `backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/lms
PORT=5000
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

### Step 2 — Start MongoDB
Make sure MongoDB is running locally on port `27017`.

### Step 3 — Backend Setup
```bash
cd backend
npm install
npm run dev       # Starts server on http://localhost:5000
```
> The server automatically seeds a default admin account (`admin@lms.com`) on first startup.

### Step 4 — Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

### Step 5 — Open the App
Navigate to: **http://localhost:5173**

---

## Default Login

| Role     | Email           | Password   |
|----------|-----------------|------------|
| Admin    | admin@lms.com   | Admin@123  |

Employees register through the app (Admin approval required before first login).

---

## How It Works

1. Open the app — you'll see the **Login** screen with two tabs: **Login** and **Register**.
2. **Login tab** — enter email and password. On success, a JWT token is issued and stored in `localStorage`. You are redirected to your role-appropriate dashboard.
3. **Register tab** — new employees submit a registration request (name, email, password, department). The account is pending until an Admin approves it.
4. The Vue Router `beforeEach` guard checks the JWT token on every navigation — unauthenticated users are redirected to `/login`, and role mismatches are redirected to the correct dashboard.
5. **Admin** → Dashboard, Manage Users, All Leaves, Leave Types, Departments, Reports, Team Calendar
6. **Employee** → Dashboard, Apply Leave, My Leaves, Leave Calendar, Profile

---

## Authentication

- JWT-based stateless authentication (`jsonwebtoken`)
- Passwords hashed with `bcryptjs` (salt rounds: 10)
- Token stored in `localStorage` as `lms_token`; user object as `lms_user`
- Axios request interceptor automatically attaches `Authorization: Bearer <token>` to every API call
- Axios response interceptor clears auth and redirects to `/login` on HTTP 401

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Authenticate; returns JWT token + user | None |
| GET | /api/users | List all users | Admin (JWT) |
| GET | /api/users/pending | Pending approval users | Admin (JWT) |
| POST | /api/users | Register new employee | None |
| GET | /api/users/:id | Get user by ID | JWT Required |
| PUT | /api/users/:id | Update user | JWT Required |
| DELETE | /api/users/:id | Delete user | Admin (JWT) |
| PUT | /api/users/:id/approve | Approve user | Admin (JWT) |
| PUT | /api/users/:id/reject | Reject user | Admin (JWT) |
| GET | /api/departments | List departments | None |
| POST | /api/departments | Create department | Admin (JWT) |
| PUT | /api/departments/:id | Update department | Admin (JWT) |
| DELETE | /api/departments/:id | Delete department | Admin (JWT) |
| GET | /api/leave-types | Active leave types | JWT Required |
| GET | /api/leave-types/all | All leave types | Admin (JWT) |
| POST | /api/leave-types | Create leave type | Admin (JWT) |
| PUT | /api/leave-types/:id | Update leave type | Admin (JWT) |
| DELETE | /api/leave-types/:id | Delete leave type | Admin (JWT) |
| POST | /api/leave-requests | Apply for leave | JWT Required |
| GET | /api/leave-requests/my/:user_id | My leave history | JWT Required |
| GET | /api/leave-requests/all | All leave requests | Admin (JWT) |
| PUT | /api/leave-requests/:id/status | Approve/Reject leave | Admin (JWT) |
| PUT | /api/leave-requests/:id/cancel | Cancel own leave | JWT Required |
| GET | /api/reports/dashboard | Dashboard stats | Admin (JWT) |
| GET | /api/reports/by-type | Leave stats by type | Admin (JWT) |
| GET | /api/reports/by-status | Leave stats by status | Admin (JWT) |
| GET | /api/reports/by-department | Leave stats by dept | Admin (JWT) |

---

## Tech Stack

- **MongoDB** — NoSQL database
- **Express.js** — REST API framework
- **Vue.js 3** — Frontend (Composition API + `<script setup>`)
- **Node.js** — Runtime
- **jsonwebtoken** — JWT signing and verification
- **bcryptjs** — Password hashing
- **Pinia** — State management
- **Vue Router 4** — Client-side routing with JWT navigation guard
- **Axios** — HTTP client with JWT interceptor
- **Vite** — Build tool / dev server
- **Pure CSS** — No UI library (custom design system)

---

## Running Tests

```bash
cd backend
npm test          # Runs 62 API tests (Jest + Supertest)
```
