# Workspace Manager

Workspace Manager is a MERN-style collaborative project-management application. It gives authenticated users shared workspaces containing projects, configurable task boards, list/calendar views, comments, activity history, notifications, members, saved filters, attachments, and import/export tools.

The project solves the coordination problem of keeping tasks, ownership, status, deadlines, discussion, and workspace history in one application. The frontend is a Vite React SPA; the backend is an Express API backed by MongoDB and supplemented by Socket.IO for live updates.

## Main capabilities

- Register, log in, restore a session, update a profile, and log out.
- Create and manage workspaces, workspace members, and workspace roles.
- Create projects from built-in templates or from scratch.
- Configure project columns and archive projects.
- Create, edit, move, assign, duplicate, convert, delete, and bulk-edit tasks.
- Create subtasks, add labels and priorities, set due dates, and manage attachments.
- View project work as Kanban, list, or calendar data.
- Comment on tasks and mention users.
- Search users, projects, and tasks.
- Save project filters.
- Review activity and notifications and mark notifications read.
- Export, import, reset, or delete workspace data.
- Continue selected task workflows offline through IndexedDB caching and a mutation queue.
- Receive task, project, workspace, member, and notification updates through Socket.IO.

## Architecture

```text
React/Vite frontend
  -> Axios REST requests with credentials
  -> Socket.IO client for authenticated realtime events
Express application
  -> route middleware: auth, validation, selected role checks, upload parsing
  -> controllers
  -> Mongoose models
MongoDB

Controllers/services -> Socket.IO user/workspace/project rooms
Upload controller -> Cloudinary when configured, data-URI fallback otherwise
```

The frontend never talks directly to MongoDB. A typical task edit is dispatched from a component, handled by a Redux thunk, sent through a feature API service to `/api/tasks`, validated and authenticated by Express middleware, executed by `taskController`, persisted through `Task`, and reflected back into Redux. Related activity or notifications may be persisted and emitted to connected clients.

## Repository structure

```text
frontend/
  index.html, package.json, vite.config.js, tailwind.config.js
  src/
    App.jsx, main.jsx, index.css
    app/                 Redux store
    components/          layout, task, Kanban, list, calendar, comments, settings
    features/            Redux slices and async thunks
    hooks/               auth, permissions, shortcuts, offline sync
    pages/               auth, dashboard, project, activity, settings screens
    services/            Axios API modules
    sockets/             Socket.IO client
    utils/               IndexedDB, dates, class names

backend/
  package.json
  src/
    app.js, server.js
    config/              MongoDB and Cloudinary setup
    constants/           project templates
    controllers/         request handlers
    middleware/          auth, permissions, validation, errors, uploads
    models/              Mongoose schemas
    routes/              Express route modules
    services/            activity and notification persistence/events
    sockets/             Socket.IO authentication and rooms
    utils/               seed script
    validators/          Zod request schemas
```

## Frontend overview

`main.jsx` initializes theme state and mounts Redux, routing, and toast providers. `App.jsx` restores the auth session, loads initial workspaces/notifications, loads projects for the selected workspace, registers realtime handlers, and defines the protected route shell.

The Redux store contains auth, workspaces, projects, tasks, comments, activity, notifications, and UI slices. `authSlice` owns login/register/session/logout/profile thunks. Workspace and project slices own selection, CRUD, members, templates, columns, cache, and room-related state. `taskSlice` owns CRUD, movement, bulk operations, subtasks, undo/rollback, offline queueing, and task realtime reducers. The remaining slices own their matching resource state and UI state.

The main screens are `AuthPage`, `DashboardPage`, `ProjectPage`, `ActivityPage`, and `SettingsPage`. `AppShell` supplies `Navbar`, `Sidebar`, `OfflineBanner`, global modals, and `CommandPalette`. Project work is presented through `KanbanBoard`, `ListView`, or `CalendarView`; `TaskDetailModal`, `CommentsSection`, `SubtaskList`, and attachment controls provide detailed task operations.

REST services under `frontend/src/services` wrap Axios calls for auth, users, workspaces, projects, tasks, comments, activity, notifications, search, and saved filters. `api.js` enables credentials and uses `VITE_BACKEND_URL` or `http://localhost:5000` as the backend origin. `useOfflineSync` and `indexedDb.js` support cached data and sequential queued mutations. `usePermissions` provides client-side capability checks, while `useKeyboardShortcuts` provides command palette, task creation, navigation, and view shortcuts.

## Backend overview

`server.js` loads dotenv, requires a successful MongoDB connection, creates the HTTP server, initializes Socket.IO, and listens on `PORT` (default `5000`). `app.js` configures CORS, cookies, JSON/urlencoded parsing, Morgan logging, health endpoints, API routers, and centralized error handling.

The controllers implement authentication, user profiles/search, workspace and member management, project/templates/columns, task lifecycle and bulk actions, comments/mentions, activity, notifications, search, attachments, saved filters, and workspace import/export/reset. `activityService` and `notificationService` centralize persistence plus event emission.

The data model consists of `User`, `Workspace`, `Project`, `Task`, `Comment`, `Activity`, `Notification`, and `SavedFilter`. Tasks reference projects/workspaces and can reference parent tasks; projects reference workspaces; workspace members carry roles. Mongoose indexes support the common workspace, project, task, comment, activity, notification, and filter queries.

## API overview

The REST base URL is `http://localhost:5000/api` by default.

| Area | Endpoints |
|---|---|
| Auth | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me` |
| Users | `/users/profile`, `/users/search` |
| Workspaces | `/workspaces`, `/workspaces/:id/members`, import/export/reset actions |
| Projects | `/projects/templates`, project CRUD, archive, columns, members |
| Tasks | project listing, CRUD, status/assignee patches, duplicate, convert, subtasks, bulk actions |
| Comments | task comment create/list and comment update/delete |
| Activity | workspace, project, and task activity queries |
| Notifications | list and read-state actions |
| Search | global search with `q` and `workspaceId` |
| Uploads | attachment upload and task attachment removal |
| Saved filters | create, project listing, delete |

Most resource routes require `protect`. Zod validation is applied to many auth, workspace, project, task, comment, filter, and import inputs. `permissionMiddleware` implements owner/admin/member/viewer role checks for selected routes.

## Authentication and authorization

Registration and login issue a JWT in an HTTP-only cookie. The auth middleware checks that cookie first, then supports a bearer token, verifies the token with `JWT_SECRET`, loads the user, and attaches it to `req.user`. `GET /api/auth/me` restores the current session after a frontend reload. Cookies use secure production settings.

Socket.IO authenticates the same general token sources and uses `user:<id>`, `workspace:<id>`, and `project:<id>` rooms. Workspace/project room joins are membership-checked. The role hierarchy is owner > admin > member > viewer.

Authorization is not uniform across all mutation and read routes: several task, comment, upload, search, activity, and project paths currently rely primarily on authentication. This is an implementation detail to account for when deploying or extending the system.

## Setup

Prerequisites are Node.js, npm, and a reachable MongoDB instance. Cloudinary is optional for local development because the upload adapter has a data-URI fallback.

### Backend environment

Create `backend/.env` with values appropriate to the environment:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/workspace-manager
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

`MONGO_URI` is required. Use real Cloudinary credentials when persistent hosted attachments are required. Do not commit secrets or reuse the fallback JWT secret in a deployed environment.

### Frontend environment

Create `frontend/.env` only when the backend is not at the default origin:

```env
VITE_BACKEND_URL=http://localhost:5000
```

### Install and run

```bash
cd backend
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. To populate demo data, configure MongoDB and run `npm run seed` from `backend`; the seed script creates demo users, workspaces, projects, tasks, comments, activity, notifications, and saved filters and prints the demo credentials.

For a frontend production build, run `npm run build` in `frontend` and serve the generated Vite output with an appropriate static host. The backend has start/dev scripts but no repository-provided deployment configuration.

## Implementation notes and current caveats

- `backend/package.json` references `tests/runAllTests.js`, but no tests directory/file was present in the inspected project.
- The backend emits `task:bulk-updated`, while the frontend listens for `tasks:bulkUpdated`; bulk realtime updates need alignment.
- Comment/activity realtime reducers exist on the frontend, but their socket listeners are not registered in `App.jsx`.
- Import creates a transaction session but does not consistently pass that session to writes.
- Attachment deletion removes the database reference without deleting the remote Cloudinary object.
- There is no email service, refresh-token flow, migration tooling, scheduled worker, or documented production deployment setup.