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
├── backend/          ← Express.js API (port 5000)
│   ├── config/       ← MongoDB connection
│   ├── controllers/  ← Route handlers
│   ├── models/       ← Mongoose schemas
│   ├── routes/       ← API routes
│   ├── seeds/        ← Seed data script
│   ├── .env
│   └── server.js
└── frontend/         ← Vue.js 3 app (port 5173)
    └── src/
        ├── api/      ← Axios instance
        ├── layouts/  ← Employee & Admin layouts
        ├── router/   ← Vue Router
        ├── store/    ← Pinia store
        └── views/    ← All pages
```

---

## Setup & Running

### Step 1 — Start MongoDB
Make sure MongoDB is running locally on port `27017`.

### Step 2 — Backend Setup
```bash
cd backend
npm install
npm run seed      # Seeds sample users, departments, and leave types
npm run dev       # Starts server on http://localhost:5000
```

### Step 3 — Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

### Step 4 — Open the App
Navigate to: **http://localhost:5173**

---

## Seed Data (created by `npm run seed`)

| Name          | Email           | Role     | Status   |
|---------------|-----------------|----------|----------|
| System Admin  | admin@lms.com   | admin    | approved |
| Alice Johnson | alice@lms.com   | employee | approved |
| Bob Smith     | bob@lms.com     | employee | approved |
| Carol White   | carol@lms.com   | employee | approved |
| David Lee     | david@lms.com   | employee | pending  |

**Departments:** Engineering, Marketing, HR, Finance

**Leave Types:**
- Annual Leave — 15 days
- Sick Leave — 10 days
- Casual Leave — 7 days
- Maternity Leave — 90 days
- Emergency Leave — 3 days

---

## How It Works

1. Open the app — you'll see the **Select User** screen.
2. Pick any approved user from the dropdown.
3. Click **Continue** — the UI adapts based on role:
   - **Employee** → Dashboard, Apply Leave, My Leaves, Calendar
   - **Admin** → Dashboard, Manage Leaves, Manage Users, Leave Types, Departments, Reports
4. Use **Switch User** in the sidebar to go back to the selection screen.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users (filter: `?status=approved`) |
| POST | /api/users | Create user |
| PUT | /api/users/:id/approve | Approve user |
| PUT | /api/users/:id/reject | Reject user |
| GET | /api/departments | List departments |
| POST | /api/departments | Create department |
| GET | /api/leave-types | Active leave types |
| POST | /api/leave-types | Create leave type |
| POST | /api/leave-requests | Apply for leave |
| GET | /api/leave-requests/my/:user_id | My leave history |
| GET | /api/leave-requests/all | All leave requests (admin) |
| PUT | /api/leave-requests/:id/status | Approve/Reject leave |
| PUT | /api/leave-requests/:id/cancel | Cancel leave |
| GET | /api/reports/dashboard | Dashboard stats |
| GET | /api/reports/leave-stats | Leave analytics |
| GET | /api/reports/employee-stats | Per-employee stats |

---

## Tech Stack

- **MongoDB** — NoSQL database
- **Express.js** — REST API framework
- **Vue.js 3** — Frontend (Composition API + `<script setup>`)
- **Node.js** — Runtime
- **Pinia** — State management
- **Vue Router 4** — Client-side routing
- **Axios** — HTTP client
- **Vite** — Build tool / dev server
- **Pure CSS** — No UI library (custom design system)
