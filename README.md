# 🚀 Task Manager API

A production-grade backend system for managing projects, tasks, and team collaboration. Built with Node.js, Express, and MySQL — with Redis and Bull for async background job processing and email notifications.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Authentication Flow](#authentication-flow)
- [Permission System](#permission-system)
- [How Email Notifications Work](#how-email-notifications-work)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Key Design Decisions](#key-design-decisions)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## ✨ Features

- User registration and login with secure password hashing
- JWT-based stateless authentication
- Project creation with automatic owner membership
- Role-based access control — owner, member, viewer
- Full task CRUD with status and priority tracking
- Task filtering by status, priority, and assignee
- Pagination on task listing with accurate filtered counts
- Task assignment with async email notification
- Background email worker with retry and exponential backoff

---

## 🛠 Tech Stack

| Layer            | Technology            |
| ---------------- | --------------------- |
| Runtime          | Node.js               |
| Framework        | Express.js            |
| Database         | MySQL                 |
| DB Driver        | mysql2                |
| Password Hashing | bcryptjs              |
| Authentication   | jsonwebtoken          |
| Validation       | express-validator     |
| Job Queue        | Bull                  |
| Queue Backend    | Redis                 |
| Email            | Nodemailer + Mailtrap |
| Config           | dotenv                |
| Dev Server       | nodemon               |

---

## 📁 Project Structure

```
task-manager-api/
├── src/
│   ├── config/
│   │   ├── db.js                  # MySQL connection pool
│   │   ├── redis.js               # Redis connection config
│   │   └── mailer.js              # Nodemailer transporter
│   ├── controllers/
│   │   ├── authController.js      # Auth request/response handling
│   │   ├── projectController.js   # Project request/response handling
│   │   └── taskController.js      # Task request/response handling
│   ├── middlewares/
│   │   ├── validate.js            # Validation runner middleware
│   │   ├── authValidation.js      # Auth validation rules
│   │   ├── projectsValidation.js  # Project validation rules
│   │   ├── taskValidation.js      # Task validation rules
│   │   └── verifyToken.js         # JWT verification middleware
│   ├── queues/
│   │   └── emailQueue.js          # Bull email queue definition
│   ├── routes/
│   │   ├── authRoutes.js          # Auth route definitions
│   │   ├── projectRoutes.js       # Project route definitions
│   │   └── taskRoutes.js          # Task route definitions
│   ├── services/
│   │   ├── authService.js         # Auth business logic
│   │   ├── projectService.js      # Project business logic
│   │   └── taskService.js         # Task business logic
│   ├── workers/
│   │   └── emailWorker.js         # Background email job processor
│   └── app.js                     # Express app setup
├── .env                           # Environment variables (not committed)
├── .gitignore
├── package.json
└── server.js                      # Entry point
```

---

## 🗄 Database Schema

Four tables with foreign key relationships enforced at the database level.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE project_members (
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  role ENUM('owner', 'member', 'viewer') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, project_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id INT NOT NULL,
  assigned_to INT,
  created_by INT,
  status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
```

**Relationships:**

- A user can own many projects and belong to many projects as a member
- A project has one owner and many members via `project_members`
- A task belongs to one project, has one optional assignee, and one creator
- Deleting a project cascades and removes all its members and tasks automatically
- Deleting a user sets their assigned/created tasks to NULL rather than deleting the tasks

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MySQL](https://www.mysql.com/) (v8 or higher)
- [Redis](https://redis.io/) (v6 or higher)
- A [Mailtrap](https://mailtrap.io) account for email testing

### Installation

```bash
git clone https://github.com/your-username/task-manager-api.git
cd task-manager-api
npm install
```

### Environment Variables

Create a `.env` file in the root:

```
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_manager

JWT_SECRET_KEY=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=1d

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass
MAIL_FROM=noreply@taskmanager.com
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### Running the Server

Make sure MySQL and Redis are running first:

```bash
redis-cli ping   # Should respond: PONG
```

```bash
npm run dev
```

You should see:

```
📬 Email worker is running...
Server running on port 3000
✅ Database connected successfully
```

The email worker starts automatically with the server — no separate process needed.

---

## 🔐 Authentication Flow

**Step 1 — Register**

```
POST /api/auth/register
```

**Step 2 — Login to receive a token**

```
POST /api/auth/login
```

**Step 3 — Send token with every protected request**

```
Authorization: Bearer <your_token_here>
```

**Step 4 — Token expiry**

Tokens expire after 1 day. Log in again to receive a new token.

---

## 🔒 Permission System

Access control is enforced in the service layer — not middleware — so it cannot be bypassed.

| Role   | View Project | Create Tasks | Update Tasks | Delete Tasks | Manage Members |
| ------ | ------------ | ------------ | ------------ | ------------ | -------------- |
| owner  | ✅           | ✅           | ✅           | ✅           | ✅             |
| member | ✅           | ✅           | ✅           | ✅ own tasks | ❌             |
| viewer | ✅           | ❌           | ❌           | ❌           | ❌             |

**Additional rules:**

- Only the project owner can update or delete the project
- Only the project owner can add or remove members
- Tasks can only be assigned to existing project members
- The owner cannot remove themselves from the project
- Task deletion is allowed for the project owner OR the task creator

---

## 📬 How Email Notifications Work

When a task is assigned via `PATCH /tasks/:taskId/assign`, an email is sent to the assignee asynchronously — the API response is returned immediately without waiting for the email.

```
Task assigned
      ↓
assigned_to updated in MySQL
      ↓
Email job pushed to Redis queue  ← API returns 200 here instantly
      ↓
Background worker picks up job
      ↓
Nodemailer sends email via Mailtrap
      ↓
Job marked complete and removed from queue
```

**If the email fails:**

- Bull retries up to 3 times automatically
- Retries use exponential backoff — 2s, 4s, 8s between attempts
- Task assignment succeeds regardless of email outcome

---

## 📡 API Reference

### Health Check

```
GET /health
```

**Response — 200 OK**

```json
{ "status": "OK" }
```

---

### Auth Endpoints

#### Register

```
POST /api/auth/register
```

**Request Body**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response — 201 Created**

```json
{
  "message": "Account created successfully",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com" }
}
```

---

#### Login

```
POST /api/auth/login
```

**Request Body**

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response — 200 OK**

```json
{
  "message": "User logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

### Project Endpoints

> All project endpoints require `Authorization: Bearer <token>`

#### Create Project

```
POST /api/projects
```

**Request Body**

```json
{
  "title": "My Project",
  "description": "Project description"
}
```

**Response — 201 Created**

```json
{
  "message": "Project created successfully",
  "project": {
    "id": 1,
    "userId": 1,
    "title": "My Project",
    "description": "Project description"
  }
}
```

---

#### Get All Projects

```
GET /api/projects
```

Returns all projects the authenticated user belongs to as any role.

**Response — 200 OK**

```json
{
  "message": "All projects fetched",
  "allProjects": [
    {
      "id": 1,
      "title": "My Project",
      "description": "...",
      "created_at": "..."
    }
  ]
}
```

---

#### Get Project by ID

```
GET /api/projects/:id
```

Returns project details with full members list. User must be a member.

**Response — 200 OK**

```json
{
  "message": "Project fetched successfully",
  "project": {
    "id": 1,
    "title": "My Project",
    "description": "...",
    "owner_id": 1,
    "created_at": "...",
    "members": [
      { "id": 1, "name": "John Doe", "role": "owner" },
      { "id": 2, "name": "Jane Smith", "role": "member" }
    ]
  }
}
```

---

#### Update Project

```
PUT /api/projects/:id
```

Owner only.

**Request Body**

```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response — 200 OK**

```json
{ "message": "Project Updated successfully" }
```

---

#### Delete Project

```
DELETE /api/projects/:id
```

Owner only. Cascades — deletes all tasks and members automatically.

**Response — 200 OK**

```json
{ "message": "Project Deleted successfully" }
```

---

#### Add Member

```
POST /api/projects/:id/members
```

Owner only.

**Request Body**

```json
{
  "targetUserId": 2,
  "role": "member"
}
```

**Response — 201 Created**

```json
{
  "message": "Member added successfully",
  "member": { "projectId": 1, "userId": 2, "role": "member" }
}
```

---

#### Remove Member

```
DELETE /api/projects/:id/members/:userId
```

Owner only. Cannot remove yourself.

**Response — 200 OK**

```json
{ "message": "Member removed successfully" }
```

---

### Task Endpoints

> All task endpoints require `Authorization: Bearer <token>` and project membership.

---

#### Create Task

```
POST /api/projects/:projectId/tasks
```

**Request Body**

```json
{
  "title": "Fix login bug",
  "description": "Users can't login with special characters",
  "assignedTo": 2,
  "status": "todo",
  "priority": "high"
}
```

> `assignedTo`, `status`, and `priority` are optional.

**Response — 201 Created**

```json
{
  "message": "Tasks created successfully",
  "task": {
    "id": 1,
    "title": "Fix login bug",
    "description": "...",
    "projectId": 1,
    "assignedTo": 2,
    "createdBy": 1,
    "status": "todo",
    "priority": "high"
  }
}
```

---

#### Get All Tasks

```
GET /api/projects/:projectId/tasks
```

Supports filtering and pagination via query parameters:

| Parameter | Type   | Description                                |
| --------- | ------ | ------------------------------------------ |
| status    | string | Filter by `todo`, `in_progress`, or `done` |
| priority  | string | Filter by `low`, `medium`, or `high`       |
| assignee  | number | Filter by assignee user ID                 |
| page      | number | Page number (default: 1)                   |
| limit     | number | Results per page (default: 10)             |

**Example request with filters:**

```
GET /api/projects/1/tasks?status=todo&priority=high&page=1&limit=5
```

**Response — 200 OK**

```json
{
  "message": "Tasks fetched successfully",
  "tasks": [
    {
      "id": 1,
      "title": "Fix login bug",
      "status": "todo",
      "priority": "high",
      "assigned_to": 2,
      "created_by": 1,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 2
  }
}
```

> `total` reflects the count of filtered results, not all tasks in the project.

---

#### Get Task by ID

```
GET /api/projects/:projectId/tasks/:taskId
```

**Response — 200 OK**

```json
{
  "message": "Task fetched successfully",
  "task": {
    "id": 1,
    "title": "Fix login bug",
    "description": "...",
    "status": "todo",
    "priority": "high",
    "assigned_to": 2,
    "created_by": 1,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

#### Update Task

```
PUT /api/projects/:projectId/tasks/:taskId
```

Project members only.

**Request Body**

```json
{
  "title": "Fix login bug (urgent)",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high"
}
```

**Response — 200 OK**

```json
{ "message": "Task updated successfully" }
```

---

#### Delete Task

```
DELETE /api/projects/:projectId/tasks/:taskId
```

Project owner or task creator only.

**Response — 200 OK**

```json
{ "message": "Task deleted successfully" }
```

---

#### Assign Task

```
PATCH /api/projects/:projectId/tasks/:taskId/assign
```

Assignee must be a project member. Triggers an email notification to the assignee.

**Request Body**

```json
{
  "assignedTo": 2
}
```

**Response — 200 OK**

```json
{
  "message": "Task assigned successfully",
  "task": { "id": 1, "projectId": 1, "assignedTo": 2 }
}
```

---

## ⚠️ Error Handling

All endpoints return consistent error responses:

```json
{ "error": "Description of what went wrong" }
```

| Status Code | Meaning                                        |
| ----------- | ---------------------------------------------- |
| 200         | Success                                        |
| 201         | Resource created                               |
| 401         | Unauthorized — missing or invalid token        |
| 403         | Forbidden — authenticated but lacks permission |
| 404         | Not found                                      |
| 409         | Conflict — resource already exists             |
| 422         | Validation failed                              |
| 500         | Internal server error                          |

---

## 🏗 Key Design Decisions

**Service-Layer Authorization**
All permission checks live in the service layer, not middleware. This makes authorization reusable, testable, and impossible to accidentally bypass by adding a new route.

**Owner Auto-Added to project_members**
When a project is created, the owner is automatically inserted into `project_members` with role `owner`. This means a single query against `project_members` handles permission checks for all users uniformly — no special-casing for owners.

**Task Assignment Enforces Project Membership**
Before assigning a task, the service verifies the assignee is a project member. This is enforced at the application layer since MySQL foreign keys cannot express cross-table conditional relationships.

**PATCH for Assignment, PUT for Updates**
`PUT /tasks/:id` replaces the full task (title, description, status, priority). `PATCH /tasks/:id/assign` modifies only the `assigned_to` field. Different HTTP verbs communicate different intent clearly.

**Dynamic Query Builder for Filtering**
Task filtering uses a dynamic query builder that appends conditions only for provided filters. This avoids N separate endpoints for each filter combination and keeps the SQL clean and parameterized.

**Async Email Processing**
Emails are sent via a Redis-backed Bull queue. The API returns instantly without waiting for email delivery. Failed jobs retry with exponential backoff automatically.

**Parameterized Queries**
All SQL uses `?` placeholders — never string concatenation. Prevents SQL injection at the driver level.

**Cascade Deletes**
Deleting a project automatically removes all its `project_members` and `tasks` rows via `ON DELETE CASCADE`. No orphaned data, enforced by the database.

---
