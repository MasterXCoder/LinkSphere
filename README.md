# LinkSphere — Setup Guide
# LinkSphere — Setup Guide

LinkSphere is a scalable real-time communication platform inspired by Discord, built with Node.js, Express, and React.

## Project Structure
```
linksphere/
├── server.js               ← Express entry point
├── package.json            ← Root scripts + backend deps
├── src/
│   ├── app.js              ← Express app config
│   ├── routes/
│   │   └── userRoutes.js   ← /api/users routes
│   └── controllers/
│       └── userController.js
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
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/users/login | Log in a user |
| POST | /api/users/signup | Register a new user |
| GET | /api/users/:id | Get user by ID |
| GET | /api/health | Health check |

## Pages
| Route | Page |
|-------|------|
| / | Landing page with navbar + CTA |
| /login | Login form |
| /signup | Signup form |
| /app | Discord-like app layout |

LinkSphere is a scalable real-time communication platform inspired by Discord, built with Node.js, Express, and React.

## Project Structure
```
linksphere/
├── server.js               ← Express entry point
├── package.json            ← Root scripts + backend deps
├── src/
│   ├── app.js              ← Express app config
│   ├── routes/
│   │   └── userRoutes.js   ← /api/users routes
│   └── controllers/
│       └── userController.js
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
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/users/login | Log in a user |
| POST | /api/users/signup | Register a new user |
| GET | /api/users/:id | Get user by ID |
| GET | /api/health | Health check |

## Pages
| Route | Page |
|-------|------|
| / | Landing page with navbar + CTA |
| /login | Login form |
| /signup | Signup form |
| /app | Discord-like app layout |