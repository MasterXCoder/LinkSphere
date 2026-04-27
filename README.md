# <pre>  ██████╗ ██████╗ ███████╗██╗   ██╗    ██╗    ██╗ █████╗ ██╗     ██╗     ███████╗██████╗ </pre>
<pre> ██╔════╝██╔═══██╗██╔════╝╚██╗ ██╔╝    ██║    ██║██╔══██╗██║     ██║     ██╔════╝██╔══██╗</pre>
<pre> ██║    ██║   ██║█████╗   ╚████╔╝     ██║ █╗ ██║███████║██║     ██║     █████╗  ██████╔╝</pre>
<pre> ██║    ██║   ██║██╔══╝    ╚██╔╝      ██║███╗██║██╔══██║██║     ██║     ██╔══╝  ██╔══██╗</pre>
<pre> ╚██████╗╚██████╔╝██║        ██║       ╚███╔███╔╝██║  ██║███████╗███████╗███████╗██║  ██║</pre>
<pre>  ╚═════╝ ╚═════╝ ╚═╝        ╚═╝        ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝</pre>

---

<p align="center">
  <b>A scalable real-time communication platform inspired by Discord</b><br>
  Built with Node.js • Express • React • MongoDB
</p>

---

## ✨ Features

- 🔐 **Authentication** — Secure JWT-based auth with bcrypt password hashing
- 🖼️ **Image Uploads** — Cloudinary integration for avatar and server icon uploads
- 💬 **Real-time Messaging** — Channel-based messaging system
- 🗂️ **Server Management** — Create, edit, and manage your own servers
- 🔗 **Invite System** — Share servers with friends via invite codes
- 👥 **Member Management** — Join servers, view members, leave anytime
- 🎨 **Modern UI** — Discord-inspired dark theme interface
- ⚡ **Hot Reload** — Vite + nodemon for lightning-fast development

---

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/linksphere.git
cd linksphere

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Start development (both server + client)
npm run dev
```

**That's it!** 🎉 Open `http://localhost:5173` in your browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, React Router, Vite, CSS Modules |
| **Backend** | Node.js, Express, MongoDB, Mongoose |
| **Auth** | JWT, bcrypt, Passport.js |
| **Storage** | Cloudinary |
| **Dev Tools** | concurrently, nodemon |

---

## 📁 Project Structure

```
linksphere/
│
├── server/                    # Express Backend
│   ├── app.js                 # App configuration
│   ├── server.js              # Entry point
│   ├── config/
│   │   └── passport.js        # Passport strategy
│   ├── controllers/           # Business logic
│   │   ├── userController.js
│   │   └── serverController.js
│   ├── database/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification
│   │   ├── validate.js       # Input validation
│   │   └── errorMiddleware.js
│   ├── models/                # Mongoose models
│   │   ├── User.js
│   │   ├── Server.js
│   │   └── Message.js
│   ├── routes/                # API routes
│   │   ├��─ userRoutes.js
│   │   ├── serverRoutes.js
│   │   ├── authRoutes.js
│   │   └── uploadRoutes.js
│   └── utils/                 # Helpers
│       ├── ApiError.js
│       ├── cloudinaryHelper.js
│       └── catchAsync.js
│
└── client/                    # React Frontend
    ├── src/
    │   ├── App.jsx            # Router setup
    │   ├── main.jsx           # Entry
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Logo.jsx
    │   │   ├── AuthForm.jsx
    │   │   ├── CreateServerModal.jsx
    │   │   ├── EditServerModal.jsx
    │   │   ├── JoinServerModal.jsx
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── Landing.jsx
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       ├── AppPage.jsx
    │       ├── UserSettings.jsx
    │       └── OAuthCallback.jsx
    └── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/linksphere
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🌐 API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/signup` | Register new user |
| POST | `/api/users/login` | Login user |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Servers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/servers` | Create server |
| GET | `/api/servers/mine` | Get user's servers |
| GET | `/api/servers/:id` | Get server |
| PUT | `/api/servers/:id` | Update server |
| DELETE | `/api/servers/:id` | Delete server |

### Channels
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/servers/:id/channels` | Create channel |
| DELETE | `/api/servers/:id/channels/:channelId` | Delete channel |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/servers/:id/channels/:channelId/messages` | Get messages |
| POST | `/api/servers/:id/channels/:channelId/messages` | Send message |

### Invites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/servers/invite/:code` | Get by invite code |
| POST | `/api/servers/invite/:code/join` | Join via invite |

### Membership
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/servers/:id/join` | Join server |
| POST | `/api/servers/:id/leave` | Leave server |

### Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/image` | Upload image |

---

## 📱 Pages

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/login` | Login |
| `/signup` | Signup |
| `/app` | Main app |
| `/app/settings` | User settings |
| `/oauth/callback` | OAuth callback |

---

## 🏃 Run Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server + client |
| `npm start` | Start production server |

---

<p align="center">
  <sub>Built with ❤️ using the MERN stack</sub>
</p>