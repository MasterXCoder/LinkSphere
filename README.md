# LinkSphere — Setup Guide

LinkSphere is a scalable real-time communication platform inspired by Discord, built with Node.js, Express, and React.

## Project Structure
```
linksphere/
├── server.js               ← Express entry point
├── package.json            ← Root scripts + backend deps
├── server/
│   │
│   ├── controllers/            # Business logic
│   │   ├── userController.js
│   │   └── serverController.js
│   │
│   ├── middleware/             # Custom middleware
│   │   └── authMiddleware.js
│   │
│   ├── routes/                 # API route definitions
│   │   ├── userRoutes.js
│   │   └── serverRoutes.js
│   │
│   └── app.js                  # Express app configuration
└── client/                 ← Vite + React frontend
    └── src/
        ├── App.jsx          ← React Router setup
        ├── index.css        ← Global styles
        ├── main.jsx         ← Entry point
        ├── components/
        │   ├── Navbar.jsx + Navbar.module.css
        │   └── AuthForm.jsx + AuthForm.module.css
        └── pages/
            ├── Landing.jsx + Landing.module.css
            ├── Login.jsx
            ├── Signup.jsx
            └── AppPage.jsx + AppPage.module.css
```

## Install Dependencies

### 1. Backend (from root)
```bash
npm install
```

### 2. Frontend (from /client)
```bash
cd client
npm install react-router-dom
```

## Run

Both server and client run simultaneously using `concurrently`:

```bash
# From root
npm run dev
```

- Backend → `http://localhost:3000` (nodemon, auto-restarts on changes)
- Frontend → `http://localhost:5173` (Vite HMR)

## API Routes

### User Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/users/signup` | Register a new user |
| POST | `/api/users/login` | Log in a user |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user details |
| DELETE | `/api/users/:id` | Delete user account |

---

### Server Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/servers` | Create a new server |
| GET | `/api/servers/mine` | Get servers created or joined by the user |
| GET | `/api/servers/:id` | Get server details |
| DELETE | `/api/servers/:id` | Delete a server |

---

### Invite Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/servers/invite/:code` | Get server using invite code |
| POST | `/api/servers/invite/:code/join` | Join server using invite code |

---

### Channel Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/servers/:id/channels` | Create a new channel in a server |
| DELETE | `/api/servers/:id/channels/:channelId` | Delete a channel |

---

### Server Membership

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/servers/:id/join` | Join a server |
| POST | `/api/servers/:id/leave` | Leave a server |

---

### Message Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/servers/:id/channels/:channelId/messages` | Get messages from a channel |
| POST | `/api/servers/:id/channels/:channelId/messages` | Send a message to a channel |

---

## Pages
| Route | Page |
|-------|------|
| / | Landing page with navbar + CTA |
| /login | Login form |
| /signup | Signup form |
| /app | Discord-like app layout |
