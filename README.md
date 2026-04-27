<p align="center">
  <b>LinkSphere</b>
</p>
<p align="center">
  A scalable real-time communication platform inspired by Discord
</p>
<p align="center">
  Built with Node.js • Express • React • MongoDB • Socket.io
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Frontend Routes](#frontend-routes)
- [Real-time Features](#real-time-features)
- [Database Models](#database-models)
- [Run Commands](#run-commands)
- [License](#license)

---

## Overview

LinkSphere is a full-stack real-time communication platform that enables users to create servers, join communities, and communicate through channel-based messaging. It features voice and video calling capabilities, real-time message delivery, and a modern Discord-inspired interface.

---

## Features

### Authentication & Security
- **JWT-based Authentication** — Secure token-based auth with expiry handling
- **Password Hashing** — bcrypt for secure password storage
- **Google OAuth** — Social login via Passport.js with Google Strategy
- **Protected Routes** — Server-side JWT verification for all protected endpoints
- **Input Validation** — Zod schemas for request validation

### Server Management
- **Create Servers** — Users can create their own servers with custom names and icons
- **Edit Servers** — Update server name, icon, and color theme
- **Delete Servers** — Owners can delete their servers
- **Invite System** — Generate shareable invite codes to invite friends
- **Member Management** — View server members, join/leave servers anytime
- **Channel System** — Create and manage text channels within servers

### Messaging
- **Real-time Messaging** — Instant message delivery via Socket.io
- **Channel-based Chat** — Organized conversations in server channels
- **Message History** — Persistent message storage in MongoDB
- **System Messages** — Automated messages for server events

### Voice & Video
- **WebRTC Calling** — Peer-to-peer voice and video calls
- **Call Signaling** — Socket.io-based call initiation and management
- **Audio/Video Toggle** — Support for both call types

### User Experience
- **Modern UI** — Discord-inspired dark theme interface
- **Responsive Design** — Works on desktop and mobile
- **User Settings** — Profile customization with avatar uploads
- **Online Presence** — Real-time online/offline status indicators

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, React Router 7, Vite, Tailwind CSS 4 |
| **Backend** | Node.js 25, Express 5, Socket.io 4 |
| **Database** | MongoDB, Mongoose 9 |
| **Authentication** | JWT, bcrypt 6, Passport.js, Google OAuth 2.0 |
| **Storage** | Cloudinary (image uploads) |
| **Real-time** | Socket.io, WebRTC |
| **Validation** | Zod |
| **Dev Tools** | concurrently, nodemon |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (optional, for image uploads)
- Google OAuth credentials (optional, for social login)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/linksphere.git
cd linksphere

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Create environment file
cp .env.example .env  # Or create manually
```

### Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=8000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/linksphere

# JWT
JWT_SECRET=your_super_secret_key_at_least_32_characters
SESSION_SECRET=your_session_secret

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Running the Application

```bash
# Development (starts both server and client)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
linksphere/
│
├── server/                    # Express Backend
│   ├── app.js               # Express app configuration
│   ├── server.js           # Entry point (HTTP + Socket.io)
│   │
│   ├── config/
│   │   └── passport.js    # Passport Google OAuth strategy
│   │
│   ├── controllers/        # Business logic
│   │   ├── userController.js
│   │   └── serverController.js
│   │
│   ├── database/
│   │   └── db.js         # MongoDB connection
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── validate.js       # Zod validation
│   │   └── errorMiddleware.js
│   │
│   ├── models/           # Mongoose models
│   │   ├── User.js
│   │   ├── Server.js
│   │   └── Message.js
│   │
│   ├── routes/          # API routes
│   │   ├── userRoutes.js
│   │   ├── serverRoutes.js
│   │   ├── authRoutes.js
│   │   └── uploadRoutes.js
│   │
│   ├── validations/      # Zod schemas
│   │   ├── userSchemas.js
│   │   └── serverSchemas.js
│   │
│   └── utils/           # Helpers
│       ├── ApiError.js
│       ├── cloudinaryHelper.js
│       └── catchAsync.js
│
├── client/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx      # Router setup
│   │   ├── main.jsx     # Entry point
│   │   ├── index.css   # Global styles
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state management
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── AuthForm.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── CreateServerModal.jsx
│   │   │   ├── EditServerModal.jsx
│   │   │   ├── JoinServerModal.jsx
│   │   │   └── CallModal.jsx
│   │   │
│   │   └── pages/
│   │       ├── Landing.jsx
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── AppPage.jsx
│   │       ├── UserSettings.jsx
│   │       └── OAuthCallback.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── package.json           # Root package.json
├── nodemon.json         # Nodemon configuration
└── README.md
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 8000) |
| `NODE_ENV` | No | development or production |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `SESSION_SECRET` | Yes | Secret for sessions |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

---

## API Endpoints

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | `/api/users/signup` | No | Register new user |
| POST | `/api/users/login` | No | Login user |
| GET | `/api/users/:id` | Yes | Get user by ID |
| PUT | `/api/users/:id` | Yes | Update user |
| DELETE | `/api/users/:id` | Yes | Delete user |

### Servers

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | `/api/servers` | Yes | Create server |
| GET | `/api/servers/mine` | Yes | Get user's servers |
| GET | `/api/servers/:id` | Yes | Get server |
| PATCH | `/api/servers/:id` | Yes | Update server |
| DELETE | `/api/servers/:id` | Yes | Delete server |

### Channels

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | `/api/servers/:id/channels` | Yes | Create channel |
| DELETE | `/api/servers/:id/channels/:channelId` | Yes | Delete channel |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | `/api/servers/:id/channels/:channelId/messages` | Yes | Get messages |
| POST | `/api/servers/:id/channels/:channelId/messages` | Yes | Send message |

### Invites

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | `/api/servers/invite/:code` | Yes | Get server by invite code |
| POST | `/api/servers/invite/:code/join` | Yes | Join via invite |

### Membership

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | `/api/servers/:id/join` | Yes | Join server |
| POST | `/api/servers/:id/leave` | Yes | Leave server |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | `/api/auth/google` | No | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | No | Google OAuth callback |

### Uploads

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | `/api/upload/image` | Yes | Upload image |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | `/api/health` | No | Health check |

---

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login page |
| `/signup` | Signup page |
| `/app` | Main application (protected) |
| `/app/settings` | User settings (protected) |
| `/oauth-callback` | OAuth callback handler |
| `/invite/:code` | Join server via invite link |

---

## Real-time Features

### Socket.io Events

#### Connection
- `connect` — Client connects to socket server
- `disconnect` — Client disconnects

#### Channel Management
- `join_channel` — Join a channel room
- `leave_channel` — Leave a channel room

#### Presence
- `online-users-list` — Sent to client on connect with all online users
- `user-online` — Broadcast when user comes online
- `user-offline` — Broadcast when user goes offline

#### Voice/Video Calls
- `call-user` — Initiate call to another user
- `call-incoming` — Receive incoming call
- `call-accepted` — Call accepted
- `call-rejected` — Call rejected
- `call-ended` — Call ended
- `ice-candidate` — ICE candidate exchange
- `user-left-call` — User left during call

### WebRTC Integration

The application uses WebRTC for peer-to-peer voice and video calls. The socket server acts as a signaling server to exchange offer/answer SDP and ICE candidates between peers.

---

## Database Models

### User

```javascript
{
  id: Number,           // Unique ID (timestamp-based)
  username: String,    // Display name
  email: String,      // Email (unique)
  password: String,    // Hashed password (optional for OAuth)
  dob: Date,          // Date of birth
  googleId: String,   // Google OAuth ID
  avatarUrl: String,   // Profile picture URL
  socketId: String,    // Current socket connection
  createdAt: Date,
  updatedAt: Date
}
```

### Server

```javascript
{
  id: Number,           // Unique ID
  name: String,         // Server name
  iconUrl: String,     // Server icon URL
  inviteCode: String,  // Unique invite code
  ownerId: Number,     // Owner user ID
  members: Number[],   // Member user IDs
  color: String,      // Theme color (hex)
  channels: [{
    id: String,
    name: String,
    type: String       // "text" or "voice"
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Message

```javascript
{
  id: Number,           // Unique ID
  serverId: Number,   // Server ID
  channelId: String,  // Channel ID
  authorId: Number,   // Author user ID
  authorName: String,// Author username
  content: String,   // Message content
  attachmentUrl: String, // Attachment URL
  type: String,     // "user" or "system"
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Run Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development (server + client) |
| `npm run server` | Start server only |
| `npm run client` | Start client only |
| `npm run build` | Build production client |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint (client) |

---

## License

ISC License

---

<p align="center">
  <sub>Built with passion using the MERN stack</sub>
</p>