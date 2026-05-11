# LinkSphere

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/license-ISC-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/node-18%2B-yellow?style=flat-square" alt="Node Version">
  <img src="https://img.shields.io/badge/mern-stack-Discord-orange?style=flat-square" alt="Stack">
</p>

<p align="center">
  A scalable real-time communication platform inspired by Discord, featuring server creation, channel-based messaging, voice/video calling, and real-time collaboration.
</p>

<p align="center">
  <a href="#quick-start"><strong>Get Started</strong></a> •
  <a href="#features"><strong>Features</strong></a> •
  <a href="#api-documentation"><strong>API</strong></a> •
  <a href="#deployment"><strong>Deploy</strong></a> •
  <a href="#contributing"><strong>Contribute</strong></a>
</p>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Quick Start](#quick-start)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Configuration](#configuration)
   - [Running the App](#running-the-app)
5. [Project Structure](#project-structure)
6. [Environment Variables](#environment-variables)
7. [API Documentation](#api-documentation)
   - [Authentication](#authentication)
   - [Users](#users)
   - [Servers](#servers)
   - [Channels](#channels)
   - [Messages](#messages)
   - [Invites](#invites)
   - [Membership](#membership)
   - [Uploads](#uploads)
8. [Frontend Routes](#frontend-routes)
9. [Real-time Features](#real-time-features)
   - [Socket.io Events](#socketio-events)
   - [WebRTC Calling](#webrtc-calling)
10. [Database Schema](#database-schema)
11. [Deployment](#deployment)
    - [Production Build](#production-build)
    - [Environment Setup](#environment-setup)
12. [Security](#security)
13. [Troubleshooting](#troubleshooting)
14. [FAQ](#faq)
15. [Contributing](#contributing)
16. [License](#license)

---

## Overview

LinkSphere is a full-stack real-time communication platform that enables users to create servers, join communities, and communicate through channel-based messaging. Inspired by Discord, it provides a modern platform for teams and communities to collaborate in real-time.

### Key Capabilities

- **Server Management** — Create, customize, and manage private servers
- **Channel System** — Organized text and voice channels within servers
- **Real-time Messaging** — Instant message delivery with Socket.io
- **Voice/Video Calls** — WebRTC-powered peer-to-peer calling
- **User Presence** — Real-time online/offline status tracking
- **Rich Media** — File and image attachments via Cloudinary

---

## Features

### Authentication & Security

| Feature | Description |
|---------|-------------|
| JWT Authentication | Secure token-based auth with automatic expiry handling |
| Password Hashing | bcrypt for secure password storage |
| Google OAuth | Social login via Passport.js with Google Strategy |
| Protected Routes | Server-side JWT verification for all protected endpoints |
| Input Validation | Zod schemas for request validation |

### Server Management

| Feature | Description |
|---------|-------------|
| Create Servers | Create custom servers with name and icon |
| Edit Servers | Update name, icon, and color theme |
| Delete Servers | Owners can delete their servers |
| Invite System | Generate unique invite codes |
| Member Management | View and manage server members |
| Channel System | Create and manage text channels |

### Messaging

| Feature | Description |
|---------|-------------|
| Real-time Messaging | Instant delivery via Socket.io |
| Channel-based Chat | Organized conversations in channels |
| Message History | Persistent storage in MongoDB |
| System Messages | Automated messages for events |
| File Attachments | Image and file uploads |

### Voice & Video

| Feature | Description |
|---------|-------------|
| WebRTC Calling | Peer-to-peer voice and video calls |
| Call Signaling | Socket.io-based call management |
| Audio Toggle | Enable/disable microphone |
| Video Toggle | Enable/disable camera |
| Call Modal | UI for initiating calls |

### User Experience

| Feature | Description |
|---------|-------------|
| Modern UI | Discord-inspired dark theme |
| Responsive Design | Desktop and mobile support |
| User Settings | Profile customization |
| Avatar Uploads | Custom profile pictures |
| Online Presence | Real-time status indicators |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI Framework |
| React Router | 7 | Client-side routing |
| Vite | 6 | Build tool |
| Tailwind CSS | 4 | Styling |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 25 | Runtime |
| Express | 5 | Web framework |
| Socket.io | 4 | Real-time communication |
| mongoose | 9 | MongoDB ODM |

### Database & Storage

| Technology | Purpose |
|------------|---------|
| MongoDB | Primary database |
| Cloudinary | Image/file storage |

### Authentication

| Technology | Purpose |
|------------|---------|
| JWT | Token-based auth |
| bcrypt | Password hashing |
| Passport.js | OAuth strategy |
| Google OAuth 2.0 | Social login |

### Validation & Tools

| Technology | Purpose |
|------------|---------|
| Zod | Input validation |
| WebRTC | Voice/video calls |
| concurrently | Dev orchestration |
| nodemon | Development watcher |

---

## Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** — Version 18 or higher
- **MongoDB** — Local installation or MongoDB Atlas cloud
- **npm** — Comes with Node.js

#### Optional Services

| Service | Required | Purpose |
|---------|----------|---------|
| Cloudinary | No | Image/file uploads |
| Google OAuth | No | Social login |

### Installation

```bash
# Clone the repository
git clone https://github.com/anomalyco/linksphere.git
cd linksphere

# Install root dependencies
npm install

# Install backend dependencies
npm install --prefix server

# Install frontend dependencies
npm install --prefix client
```

### Configuration

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Connection
MONGODB_URI=mongodb://localhost:27017/linksphere

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
SESSION_SECRET=your_session_secret_key

# Cloudinary (optional - for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth (optional - for social login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application URL
CLIENT_URL=http://localhost:5173
```

#### Generating Secrets

```bash
# Generate a secure JWT secret
openssl rand -base64 32

# Generate a session secret
openssl rand -base64 32
```

### Running the App

#### Development Mode (Recommended)

```bash
# Starts both backend and frontend concurrently
npm run dev
```

This will start:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:5173

#### Individual Services

```bash
# Backend only
npm run server

# Frontend only
npm run client
```

#### Production Build

```bash
# Build the client for production
npm run build

# Start production server
npm start
```

---

## Project Structure

```
linksphere/
│
├── server/                      # Express Backend
│   ├── server.js               # Entry point (HTTP + Socket.io)
│   ├── app.js                 # Express app configuration
│   │
│   ├── config/
│   │   └── passport.js        # Passport Google OAuth strategy
│   │
│   ├── controllers/           # Business logic
│   │   ├── userController.js
│   │   ├── serverController.js
│   │   ├── dmController.js
│   │   └── friendController.js
│   │
│   ├── database/
│   │   └── db.js             # MongoDB connection
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   ├── validate.js       # Zod validation
│   │   └── errorMiddleware.js # Error handling
│   │
│   ├── models/               # Mongoose models
│   │   ├── User.js
│   │   ├── Server.js
│   │   ├── Message.js
│   │   ├── Attachment.js
│   │   └── DirectMessage.js
│   │
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── serverRoutes.js
│   │   ├── dmRoutes.js
│   │   ├── friendRoutes.js
│   │   └── uploadRoutes.js
│   │
│   ├── validations/         # Zod schemas
│   │   ├── userSchemas.js
│   │   └── serverSchemas.js
│   │
│   ├── utils/              # Helper functions
│   │   ├── ApiError.js
│   │   ├── cloudinaryHelper.js
│   │   └── catchAsync.js
│   │
│   ├── scripts/            # Utility scripts
│   │   └── fixGoogleIdIndex.js
│   │
│   ├── package.json
│   └── server/
│
├── client/                    # React Frontend
│   ├── src/
│   │   ├── App.jsx        # Router configuration
│   │   ├── main.jsx       # Entry point
│   │   └── index.css     # Global styles
│   │
│   ├── context/
│   │   └── AuthContext.jsx   # Auth state management
│   │
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Logo.jsx
│   │   ├── AuthForm.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── CreateServerModal.jsx
│   │   ├── EditServerModal.jsx
│   │   ├── JoinServerModal.jsx
│   │   ├── CallModal.jsx
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── AppPage.jsx
│   │   ├── AppPage.module.css
│   │   ├── UserSettings.jsx
│   │   ├── UserSettings.module.css
│   │   └── OAuthCallback.jsx
│   │
│   ├── hooks/
│   │   └── useVoiceChannel.jsx
│   │
│   ├── utils/
│   │   └── theme.js
│   │
│   ├── public/
│   │   └── favicon.svg
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── package.json            # Root package.json
├── nodemon.json          # Nodemon configuration
└── README.md            # This file
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | 8000 | Server port number |
| `NODE_ENV` | No | development | Environment mode |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `SESSION_SECRET` | Yes | - | Session secret |
| `CLOUDINARY_CLOUD_NAME` | No | - | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | - | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | - | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth client secret |
| `CLIENT_URL` | No | http://localhost:5173 | Frontend URL |

---

## API Documentation

Base URL: `http://localhost:8000/api`

### Authentication

#### Register User

```
POST /auth/signup
Content-Type: application/json

Request:
{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "dob": "YYYY-MM-DD"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1234567890,
    "username": "string",
    "email": "user@example.com",
    "avatarUrl": "string"
  },
  "token": "jwt_token"
}
```

#### Login User

```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "string"
}

Response (200):
{
  "success": true,
  "data": {
    "id": 1234567890,
    "username": "string",
    "email": "user@example.com",
    "avatarUrl": "string"
  },
  "token": "jwt_token"
}
```

#### Google OAuth

```
GET /auth/google
```
Redirects to Google for authentication.

```
GET /auth/google/callback
```
Handles OAuth callback, returns JWT token.

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | `/users/:id` | Yes | Get user by ID |
| PUT | `/users/:id` | Yes | Update user |
| DELETE | `/users/:id` | Yes | Delete user |

### Servers

#### Create Server

```
POST /servers
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "Server Name",
  "iconUrl": "url (optional)",
  "color": "#hex (optional)"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1234567890,
    "name": "Server Name",
    "inviteCode": "abc123",
    ...
  }
}
```

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | `/servers` | Yes | Create server |
| GET | `/servers/mine` | Yes | Get user's servers |
| GET | `/servers/:id` | Yes | Get server |
| PATCH | `/servers/:id` | Yes | Update server |
| DELETE | `/servers/:id` | Yes | Delete server |

### Channels

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | `/servers/:id/channels` | Yes | Create channel |
| DELETE | `/servers/:id/channels/:channelId` | Yes | Delete channel |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | `/servers/:id/channels/:channelId/messages` | Yes | Get messages |
| POST | `/servers/:id/channels/:channelId/messages` | Yes | Send message |

### Invites

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | `/servers/invite/:code` | Yes | Get server by code |
| POST | `/servers/invite/:code/join` | Yes | Join via invite |

### Membership

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| POST | `/servers/:id/join` | Yes | Join server |
| POST | `/servers/:id/leave` | Yes | Leave server |

### Uploads

```
POST /upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request:
{
  "file": File
}

Response (201):
{
  "success": true,
  "data": {
    "url": "https://...",
    "type": "image"
  }
}
```

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|--------------|
| GET | `/health` | No | Health check |

---

## Frontend Routes

| Route | Description | Auth |
|-------|--------------|------|
| `/` | Landing page | No |
| `/login` | Login page | No |
| `/signup` | Signup page | No |
| `/app` | Main application | Yes |
| `/app/settings` | User settings | Yes |
| `/oauth-callback` | OAuth callback | No |
| `/invite/:code` | Join via invite | Yes |

---

## Real-time Features

### Socket.io Events

#### Connection Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Server | Client connects |
| `disconnect` | Server | Client disconnects |

#### Channel Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_channel` | `{ channelId }` | Join channel room |
| `leave_channel` | `{ channelId }` | Leave channel room |
| `message` | `{ message }` | Broadcast new message |

#### Presence Events

| Event | Payload | Description |
|-------|---------|-------------|
| `online-users-list` | `{ users[] }` | Initial online users |
| `user-online` | `{ userId }` | User came online |
| `user-offline` | `{ userId }` | User went offline |

#### Call Events

| Event | Payload | Description |
|-------|---------|-------------|
| `call-user` | `{ to, from, callType }` | Initiate call |
| `call-incoming` | `{ from, callType }` | Incoming call |
| `call-accepted` | `{ to, sdp }` | Call accepted |
| `call-rejected` | `{ to }` | Call rejected |
| `call-ended` | `{ from }` | Call ended |
| `ice-candidate` | `{ to, candidate }` | ICE candidate |
| `user-left-call` | `{ userId }` | User left call |
| `offer` | `{ to, sdp }` | WebRTC offer |
| `answer` | `{ to, sdp }` | WebRTC answer |

### WebRTC Calling

The application uses WebRTC for peer-to-peer voice and video calls:

1. **Call Initiation** — User A initiates call via Socket.io
2. **Signaling** — Socket.io exchanges SDP offers/answers
3. **ICE Candidates** — ICE candidates exchanged via socket
4. **Direct Connection** — Peers connect directly via WebRTC

---

## Database Schema

### User Model

```javascript
{
  id: Number,           // Unique ID (timestamp-based)
  username: String,    // Display name (unique)
  email: String,       // Email (unique)
  password: String,   // Hashed password
  dob: Date,          // Date of birth
  googleId: String,   // Google OAuth ID
  avatarUrl: String,  // Profile picture URL
  socketId: String,   // Current socket connection
  createdAt: Date,
  updatedAt: Date
}
```

### Server Model

```javascript
{
  id: Number,           // Unique ID
  name: String,         // Server name
  iconUrl: String,      // Server icon URL
  inviteCode: String,  // Unique invite code
  ownerId: Number,     // Owner user ID
  members: Number[],   // Member user IDs
  color: String,       // Theme color (hex)
  channels: [{
    id: String,
    name: String,
    type: String       // "text" or "voice"
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model

```javascript
{
  id: Number,           // Unique ID
  serverId: Number,   // Server ID
  channelId: String,  // Channel ID
  authorId: Number,   // Author user ID
  authorName: String, // Author username
  content: String,   // Message content
  attachmentUrl: String, // Attachment URL
  type: String,      // "user" or "system"
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Deployment

### Production Build

```bash
# Install and build client
npm run build
```

This creates an optimized build in `client/dist/`.

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT and session secrets
4. Configure Cloudinary for production
5. Set `CLIENT_URL` to your production URL

### Docker (Optional)

```dockerfile
# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build client
RUN npm run build

# Expose port
EXPOSE 8000

# Start server
CMD ["npm", "start"]
```

---

## Security

### Implemented Security Measures

- **Password Hashing** — All passwords hashed with bcrypt
- **JWT Tokens** — Secure token-based authentication
- **Input Validation** — Zod schemas validate all input
- **Protected Routes** — Middleware verifies JWT on protected routes
- **CORS** — Configured for allowed origins
- **Rate Limiting** — Express rate limiting (optional)

### Security Best Practices

- Use strong, unique secrets for `JWT_SECRET` and `SESSION_SECRET`
- Enable HTTPS in production
- Keep Node.js and dependencies up to date
- Use environment variables for secrets
- Implement rate limiting for API endpoints

---

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed

```bash
# Check MongoDB is running
mongod

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/linksphere
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
PORT=8001
```

#### JWT Token Expiry

JWT tokens expire after 7 days. Re-login to get a new token.

#### Socket.io Connection Issues

- Ensure client connects to correct port
- Check firewall allows WebSocket connections
- Verify `NODE_ENV` is not blocking connections

#### Cloudinary Upload Fails

- Verify Cloudinary credentials in `.env`
- Check API keys have upload permissions
- Verify file size is under limit

---

## FAQ

### Q: How do I create a server?

A: Click the "+" icon next to "Servers" in the sidebar, then select "Create Server".

### Q: How do I invite friends?

A: Open server settings, click "Invite", and share the generated invite code.

### Q: How do I join a server?

A: Use an invite link like `http://localhost:5173/invite/abc123` or enter the code in "Join Server".

### Q: How do voice calls work?

A: Click the phone icon on a user's profile to initiate a voice call. Both parties need to accept.

### Q: Can I upload images?

A: Yes, drag and drop images into the message input or use the attachment button.

### Q: How do I change my avatar?

A: Go to Settings > Profile and upload a new avatar image.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Coding Standards

- Use meaningful variable and function names
- Add comments for complex logic
- Follow existing code style
- Run lint before submitting

---

## License

ISC License — See [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with passion using the MERN stack</sub>
</p>