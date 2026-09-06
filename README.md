# Workspace Manager

A clean Notion/Jira-style workspace manager built with **React.js + Vite + JavaScript/JSX**. The project uses Firebase for authentication and Firestore data, Cloudinary for media uploads, Tailwind CSS for styling, and client-side role-based access control.

## Important

This project is intentionally **React + Vite only**. It does not use Next.js or TypeScript.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

If you already installed dependencies from an older copy, remove the old install first:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Environment variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

## Why these tools?

- **React + Vite:** fast development and simple component-based UI.
- **Firebase:** authentication and Firestore without creating a custom backend server.
- **Cloudinary:** stores avatars, workspace icons, and task attachments outside Firestore.
- **Tailwind CSS:** utility-first styling for a consistent minimal interface.
- **Redux/Context:** this version uses React Context for authentication, theme, and workspace state.
- **@dnd-kit:** React-friendly drag-and-drop foundation compatible with the current React setup.
- **date-fns:** date utilities.
- **Lucide React:** lightweight interface icons.
- **Framer Motion:** subtle motion can be added to page transitions and micro-interactions.

## Folder structure

```text
src/
├── components/       Reusable UI pieces and protected routing
├── context/          Auth, theme, and workspace state
├── data/             Demo data used before/alongside Firestore wiring
├── hooks/             Permission helpers
├── pages/             Route-level screens
├── services/          Firebase and Cloudinary configuration
├── App.jsx            Application routes
├── main.jsx           React entry point
└── index.css          Tailwind and shared styles
```

## RBAC

| Role | Main access |
|---|---|
| Owner | Full workspace/project/task control and member role management |
| Admin | Project management, task management, invites, workspace settings |
| Member | Create/edit own work and collaborate on tasks/comments |
| Viewer | Read-only access |

`ProtectedRoute` blocks protected pages and `usePermission` is used to hide or disable restricted UI actions.

## Core functions

| File | Function | Purpose |
|---|---|---|
| `services/firebase.js` | Firebase initialization | Creates Firebase Auth, Firestore and Google provider instances. |
| `services/cloudinary.js` | `uploadToCloudinary(file)` | Uploads a local file and returns its secure Cloudinary URL. |
| `context/AuthContext.jsx` | `AuthProvider` | Tracks the Firebase user and provides login/signup/logout actions. |
| `context/ThemeContext.jsx` | `ThemeProvider` | Persists and switches light/dark theme. |
| `context/WorkspaceContext.jsx` | `WorkspaceProvider` | Holds workspace, project, tasks and notifications. |
| `hooks/usePermission.js` | `usePermission()` | Provides role-aware permission checks. |
| `components/ProtectedRoute.jsx` | `ProtectedRoute` | Redirects unauthenticated or unauthorized users. |
| `pages/ProjectPage.jsx` | Project views | Provides Kanban, List and Calendar task representations. |
| `components/TaskModal.jsx` | Task detail modal | Edits task fields, subtasks and attachments. |

## Firebase setup

1. Create a Firebase project.
2. Enable Email/Password authentication.
3. Enable Google authentication if you want the Google login button.
4. Create a Firestore database.
5. Copy the web-app configuration values into `.env`.

The intended Firestore collections are `users`, `workspaces`, `projects`, `tasks`, `comments`, and `activityLogs`.

## Cloudinary setup

1. Create a Cloudinary account.
2. Create an unsigned upload preset.
3. Put the cloud name and unsigned preset name into `.env`.

## Troubleshooting

### npm reports an old dependency conflict

Make sure you are using the current `package.json`. This version uses `@dnd-kit/core` instead of the older `@hello-pangea/dnd` dependency that conflicted with React 19.

Run:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase errors

Check every `VITE_FIREBASE_*` value in `.env` and restart Vite after changing environment variables.

### Cloudinary errors

Check `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`. The preset must allow unsigned browser uploads.
