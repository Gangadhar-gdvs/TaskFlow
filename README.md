# ⚡ TaskFlow — Team Task Manager

A full-stack team task management web application built with **React**, **Node.js/Express**, and **MongoDB**. Supports role-based access control, project and task management, and a live dashboard with task analytics.

### 🌐 Live Links
- **Live Application:** [https://taskflow-production-50d6.up.railway.app](https://taskflow-production-50d6.up.railway.app/)
- **Backend API:** [https://taskflow-production-334e.up.railway.app/api](https://taskflow-production-334e.up.railway.app/api)

---

## 📸 Features

- 🔐 **JWT Authentication** — Secure signup & login with bcrypt password hashing
- 📁 **Project Management** — Create projects, add/remove members
- ✅ **Task Management** — Create, assign, and track tasks with priority and due dates
- 📊 **Dashboard** — Live stats: total tasks, status breakdown, tasks per user, overdue count
- 👑 **Role-Based Access** — Admins manage everything; Members can only update their assigned tasks
- 🪟 **Session Isolation** — Each browser window maintains its own independent login session

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Styling | Vanilla CSS |

---

## 📂 Project Structure

```
Task_Manager/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js          # Signup & Login
│   │   ├── users.js         # User listing
│   │   ├── projects.js      # Project CRUD + member management
│   │   ├── tasks.js         # Task CRUD with role enforcement
│   │   └── dashboard.js     # Aggregated stats
│   ├── server.js
│   ├── .env                 # ← NOT committed (see setup below)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.js
    │   │   └── ProtectedRoute.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Signup.js
    │   │   ├── Dashboard.js
    │   │   ├── Projects.js
    │   │   └── ProjectDetail.js
    │   ├── api.js            # Axios instance with auth interceptor
    │   ├── App.js
    │   └── index.css
    ├── .env                  # ← NOT committed (see setup below)
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/Gangadhar-gdvs/TaskFlow.git
cd TaskFlow
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskflow
JWT_SECRET=your_super_secret_key
```

Start the backend:

```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm start
```

The app will open at **http://localhost:3000**

---

## 🚀 Deployment (Railway)

### Backend

1. Create a new Railway project and connect your GitHub repo
2. Set the **root directory** to `backend/`
3. Add these environment variables in Railway's dashboard:

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_production_secret
```

4. Railway will run `npm start` automatically (`node server.js`)

### Frontend

1. Create a second Railway service and connect the same repo
2. Set the **root directory** to `frontend/`
3. Add this environment variable:

```
REACT_APP_API_URL=https://taskflow-production-334e.up.railway.app/api
```

4. Railway will run `npm run build` and serve the static files

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/signup` | Register a new user | Public |
| POST | `/api/auth/login` | Login and receive JWT | Public |

### Users
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/users` | List all users | Authenticated |
| GET | `/api/users/me` | Get current user profile | Authenticated |

### Projects
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/projects` | Get user's projects | Authenticated |
| POST | `/api/projects` | Create a project | Authenticated |
| GET | `/api/projects/:id` | Get project details | Member/Admin |
| POST | `/api/projects/:id/members` | Add a member | Admin only |
| DELETE | `/api/projects/:id/members/:userId` | Remove a member | Admin only |
| DELETE | `/api/projects/:id` | Delete a project | Admin only |

### Tasks
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/tasks?projectId=` | Get tasks for a project | Member/Admin |
| POST | `/api/tasks` | Create a task | Admin only |
| PUT | `/api/tasks/:id` | Update a task | Admin (all fields) / Member (status only) |
| DELETE | `/api/tasks/:id` | Delete a task | Admin only |

### Dashboard
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/dashboard` | Get task analytics | Authenticated |

---

## 🔐 Role-Based Access

| Action | Admin | Member |
|---|---|---|
| Create / Edit / Delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| Add / Remove project members | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| View dashboard stats | ✅ (all tasks) | ✅ (assigned tasks) |

---

## 🗄️ Database Schema

### User
```
name        String (required)
email       String (required, unique)
password    String (hashed, required)
timestamps
```

### Project
```
name        String (required)
description String
admin       ObjectId → User (required)
members     [ObjectId → User]
timestamps
```

### Task
```
title       String (required)
description String
dueDate     Date
priority    Enum: Low | Medium | High  (default: Medium)
status      Enum: To Do | In Progress | Done  (default: To Do)
project     ObjectId → Project (required)
assignedTo  ObjectId → User
createdBy   ObjectId → User (required)
timestamps
```

---

## 📄 License

MIT License — feel free to use and modify.

---

> Built with ❤️ using React, Node.js, and MongoDB.
