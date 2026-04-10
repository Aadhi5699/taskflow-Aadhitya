# TaskFlow — Full Stack Management System

## 1. Overview
TaskFlow tool built to manage professional projects and team assignments. 
- **Frontend**: React, TypeScript, Tailwind CSS v4.
- **Backend**: Node.js, Express, PostgreSQL.
- **Infrastructure**: Docker & Dbmate migrations.

## 2. Architecture Decisions
- **PostgreSQL**: Chosen for relational integrity between Users, Projects, and Tasks.
- **Repository Pattern**: Models handle all direct database queries to keep controllers lean and testable.
- **React Query**: Used for server-state management to handle caching and provide **Optimistic UI** updates (moving tasks between columns happens instantly on the UI).
- **Custom UI Library**: Built using Tailwind to ensure a lightweight footprint without the overhead of a massive external UI framework.
- **Multi-stage Docker Builds**: The API Dockerfile uses a builder pattern to ensure the final image is minimal and secure for production.
- **Reversible Migrations**: Every database change includes an `up` and `down` script to ensure full version control and auditability via `dbmate rollback`.
- **Graceful Shutdown**: The Node.js process listens for `SIGTERM` signals to ensure it drains active connections before shutting down, preventing data loss.
- **Structured Logging**: Implemented JSON-based logging to support professional observability and easier debugging in containerized environments.

### Intentional Omissions
To ensure a complete and stable MVP within the 5 hour timeframe, the following optional features were intentionally omitted:
- **Frontend**: Drag-and-drop, Dark mode, and Real-time updates (WebSockets) were left out to focus on core CRUD reliability and state persistence.
- **Backend**: The statistics endpoint and integration tests were omitted. Instead, the focus was placed on strict schema validation, secure password hashing (Bcrypt cost 12), and robust Docker orchestration.

## 3. Running Locally
Assume you have **Docker** installed. Follow these exact steps:

```bash
git clone https://github.com/Aadhi5699/taskflow-Aadhitya
cd taskflow-Aadhitya
cp .env.example .env
docker compose up
```
*App will be available at: **http://localhost:3000***

## 4. Running Migrations
Migrations run **automatically** on container start via the `migrations` service in `docker-compose.yml`. No manual steps are required.

## 5. Test Credentials
You can log in immediately using the seeded test account:
- **Email:** `test@example.com`
- **Password:** `password123`

## 6. API Reference
All non-auth endpoints require `Authorization: Bearer <token>`

> **Postman Collection**: A [Postman Collection](TaskFlow_Collection.postman_collection.json) is included in the root directory for quick API testing and endpoint exploration.

### Auth
- `POST /auth/register`: Create a new user account.
- `POST /auth/login`: Returns a JWT token valid for 24 hours.

### Projects
- `GET /projects`: List all projects. Supports pagination.
  - *Example*: `{{base_url}}/projects?page=1&limit=2`
- `POST /projects`: Create a new project.
- `GET /projects/:id`: Get specific project details and its associated tasks.
- `PATCH /projects/:id`: Update project name/description (Owner only).
- `DELETE /projects/:id`: Delete a project and all its tasks (Owner only).

### Tasks
- `GET /projects/:id/tasks`: List tasks for a project. Supports filtering and pagination.
  - *Example*: `{{base_url}}/projects/{{project_id}}/tasks?status=todo&page=1&limit=3`
- `POST /projects/:id/tasks`: Create a new task within a project.
- `PATCH /tasks/:id`: Update task details including status and priority.
- `DELETE /tasks/:id`: Remove a task (Owner or Creator only).

 ## Database Tables

- **users** — stores user accounts
- **projects** — stores projects created by users
- **tasks** — stores tasks under projects
- **schema_migrations** — tracks database migrations

## 7. What You'd Do With More Time
- I would have added unit testing for the backend and frontend.
- UI Enhancements and cosmetics changes
- I used localStorage for simplicity. In a high-security production environment, I would transition to HTTP-only Cookies.