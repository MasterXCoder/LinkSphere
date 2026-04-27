## ARCHITECTURE

A javascript-based project composed of the following subsystems:

- **client/**: Primary subsystem containing 30 files
- **server/**: Primary subsystem containing 21 files
- **Root**: Contains scripts and execution points

## ENTRY_POINTS

*No entry points identified within budget.*

## SYMBOL_INDEX

**`client/src/context/AuthContext.jsx`**
- `AuthProvider()`
- `useAuth()`

**`client/src/pages/AppPage.jsx`**
- `authHeaders()`
- `AppPage()`

**`client/src/pages/UserSettings.jsx`**
- `UserSettings()`

**`client/src/pages/Signup.jsx`**
- `Signup()`

**`client/src/pages/Login.jsx`**
- `Login()`

**`client/src/pages/Landing.jsx`**
- `Landing()`

**`client/src/components/AuthForm.jsx`**
- `AuthForm()`

**`server/controllers/serverController.js`**
- `generateInviteCode()`

**`client/src/components/Navbar.jsx`**
- `Navbar()`

**`server/middleware/authMiddleware.js`**
- `verifyToken()`

**`server/middleware/validate.js`**
- `validate()`

**`client/src/App.jsx`**
- `GuestRoute()`
- `InvitePage()`
- `AppRouter()`

**`client/src/components/CreateServerModal.jsx`**
- `CreateServerModal()`

**`server/utils/ApiError.js`**
- class `ApiError`
  - `constructor()`

**`client/src/components/Logo.jsx`**
- `Logo()`

**`server/database/db.js`**
- `connectDB()`
- `getDB()`

## IMPORTANT_CALL_PATHS

server()
  → db.connectDB()
## CORE_MODULES

### `client/src/context/AuthContext.jsx`

**Purpose:** Implements AuthContext.

**Functions:**
- `function AuthProvider({ children })`
- `function useAuth()`

### `client/src/pages/AppPage.jsx`

**Purpose:** Implements AppPage.

**Functions:**
- `function AppPage()`
- `function authHeaders(token)`

**Notes:** large file (920 lines)

### `server/controllers/userController.js`

**Purpose:** Implements userController.

### `client/src/pages/UserSettings.jsx`

**Purpose:** Implements UserSettings.

**Functions:**
- `function UserSettings({ onClose })`

**Notes:** large file (787 lines)

### `client/src/pages/Signup.jsx`

**Purpose:** Implements Signup.

**Functions:**
- `function Signup()`

### `client/src/pages/Login.jsx`

**Purpose:** Implements Login.

**Functions:**
- `function Login()`

## SUPPORTING_MODULES

### `client/src/pages/Landing.jsx`

```javascript
function Landing()

```

### `client/src/components/AuthForm.jsx`

```javascript
function AuthForm(

```

### `client/src/pages/AppPage.module.css`

*1595 lines, 0 imports*

### `server/controllers/serverController.js`

```javascript
const generateInviteCode = ...

```

### `server/app.js`

*61 lines, 0 imports*

### `client/src/components/Navbar.jsx`

```javascript
function Navbar()

```

### `server/middleware/authMiddleware.js`

```javascript
const verifyToken = ...

```

### `server/middleware/validate.js`

```javascript
const validate = ...

```

### `client/src/App.jsx`

```javascript
function GuestRoute({ children })

function InvitePage()

function AppRouter()

```

### `client/src/pages/Landing.module.css`

*929 lines, 0 imports*

### `client/src/components/CreateServerModal.jsx`

```javascript
const CreateServerModal = ...

```

### `server/server.js`

*78 lines, 0 imports*

### `server/utils/ApiError.js`

```javascript
class ApiError

```

### `client/src/components/Logo.jsx`

```javascript
function Logo({ size = 24, light = false })

```

### `server/routes/userRoutes.js`

*21 lines, 0 imports*

### `server/database/db.js`

```javascript
async function connectDB()

function getDB()

```

## DEPENDENCY_GRAPH

```mermaid
graph LR
    f0["client/src/context/AuthContext.jsx"]
    f1["client/src/pages/AppPage.jsx"]
    f2["server/controllers/userController.js"]
    f3["client/src/pages/UserSettings.jsx"]
    f4["client/src/pages/Signup.jsx"]
    f5["package.json"]
    f6["package-lock.json"]
    f7["client/src/pages/Login.jsx"]
    f8["client/src/pages/Landing.jsx"]
    f9["client/src/components/AuthForm.jsx"]
    f10["client/src/pages/AppPage.module.css"]
    f11["server/controllers/serverController.js"]
    f12["server/app.js"]
    f13["client/src/components/Navbar.jsx"]
    f14["server/middleware/authMiddleware.js"]
    f15["server/middleware/validate.js"]
    f16["client/src/App.jsx"]
    f17["client/src/pages/Landing.module.css"]
    f18["client/src/components/CreateServerModal.jsx"]
    f19["server/server.js"]
    f20["server/utils/ApiError.js"]
    f21["client/src/components/Logo.jsx"]
    f22["server/routes/userRoutes.js"]
    f23["server/database/db.js"]
    f24["client/src/components/AuthForm.module.css"]
    f1 --> f3
    f1 --> f21
    f1 --> f18
    f1 --> f0
    f2 --> f4
    f2 --> f7
    f2 --> f20
    f3 --> f0
    f4 --> f9
    f6 --> f15
    f7 --> f9
    f7 --> f0
    f8 --> f21
    f8 --> f13
    f9 --> f21
    f13 --> f21
    f13 --> f0
    f15 --> f20
    f16 --> f1
    f16 --> f4
    f16 --> f7
    f16 --> f8
    f16 --> f0
    f19 --> f23
    f22 --> f14
    f22 --> f15
```

## RANKED_FILES

| File | Score | Tier | Tokens |
|------|-------|------|--------|
| `client/src/context/AuthContext.jsx` | 0.560 | structured summary | 36 |
| `client/src/pages/AppPage.jsx` | 0.552 | structured summary | 44 |
| `server/controllers/userController.js` | 0.490 | structured summary | 15 |
| `client/src/pages/UserSettings.jsx` | 0.465 | structured summary | 38 |
| `client/src/pages/Signup.jsx` | 0.420 | structured summary | 25 |
| `package.json` | 0.415 | one-liner | 10 |
| `package-lock.json` | 0.413 | one-liner | 12 |
| `client/src/pages/Login.jsx` | 0.408 | structured summary | 24 |
| `client/src/pages/Landing.jsx` | 0.405 | signatures | 17 |
| `client/src/components/AuthForm.jsx` | 0.395 | signatures | 18 |
| `client/src/pages/AppPage.module.css` | 0.354 | signatures | 19 |
| `server/controllers/serverController.js` | 0.342 | signatures | 19 |
| `server/app.js` | 0.330 | signatures | 14 |
| `client/src/components/Navbar.jsx` | 0.326 | signatures | 17 |
| `server/middleware/authMiddleware.js` | 0.314 | signatures | 19 |
| `server/middleware/validate.js` | 0.290 | signatures | 18 |
| `client/src/App.jsx` | 0.282 | signatures | 26 |
| `client/src/pages/Landing.module.css` | 0.281 | signatures | 18 |
| `client/src/components/CreateServerModal.jsx` | 0.271 | signatures | 21 |
| `server/server.js` | 0.248 | signatures | 14 |
| `server/utils/ApiError.js` | 0.240 | signatures | 18 |
| `client/src/components/Logo.jsx` | 0.236 | signatures | 26 |
| `server/routes/userRoutes.js` | 0.235 | signatures | 16 |
| `server/database/db.js` | 0.222 | signatures | 21 |
| `client/src/components/AuthForm.module.css` | 0.209 | one-liner | 15 |
| `client/package-lock.json` | 0.207 | one-liner | 13 |
| `client/package.json` | 0.207 | one-liner | 11 |
| `client/src/index.css` | 0.201 | one-liner | 12 |
| `server/utils/cloudinaryHelper.js` | 0.190 | one-liner | 18 |
| `README.md` | 0.177 | one-liner | 10 |
| `client/vite.config.js` | 0.173 | one-liner | 17 |
| `client/src/components/ProtectedRoute.jsx` | 0.167 | one-liner | 23 |
| `client/src/components/EditServerModal.jsx` | 0.162 | one-liner | 23 |
| `client/src/components/Navbar.module.css` | 0.158 | one-liner | 15 |
| `server/routes/serverRoutes.js` | 0.151 | one-liner | 13 |
| `client/src/pages/OAuthCallback.jsx` | 0.150 | one-liner | 23 |
| `client/src/components/JoinServerModal.jsx` | 0.148 | one-liner | 24 |
| `server/routes/authRoutes.js` | 0.124 | one-liner | 13 |
| `server/validations/serverSchemas.js` | 0.123 | one-liner | 16 |
| `server/config/passport.js` | 0.122 | one-liner | 13 |

## PERIPHERY

- `package.json` — 40 lines
- `package-lock.json` — 2600 lines
- `client/src/components/AuthForm.module.css` — 349 lines
- `client/package-lock.json` — 3568 lines
- `client/package.json` — 32 lines
- `client/src/index.css` — 51 lines
- `server/utils/cloudinaryHelper.js` — 2 functions, 47 lines
- `README.md` — 132 lines
- `client/vite.config.js` — 2 imports, 19 lines
- `client/src/components/ProtectedRoute.jsx` — 1 function, 2 imports, 18 lines
- `client/src/components/EditServerModal.jsx` — 1 function, 2 imports, 122 lines
- `client/src/components/Navbar.module.css` — 107 lines
- `server/routes/serverRoutes.js` — 54 lines
- `client/src/pages/OAuthCallback.jsx` — 1 function, 3 imports, 67 lines
- `client/src/components/JoinServerModal.jsx` — 1 function, 2 imports, 82 lines
- `server/routes/authRoutes.js` — 64 lines
- `server/validations/serverSchemas.js` — 48 lines
- `server/config/passport.js` — 70 lines
- `client/src/pages/UserSettings.module.css` — 709 lines
- `nodemon.json` — 8 lines
- `client/src/main.jsx` — 5 imports, 14 lines
- `server/models/Message.js` — 43 lines
- `server/models/Server.js` — 52 lines
- `server/validations/userSchemas.js` — 59 lines
- `server/middleware/errorMiddleware.js` — 2 functions, 40 lines
- `server/utils/catchAsync.js` — 1 function, 6 lines
- `server/routes/uploadRoutes.js` — 39 lines
- `server/models/User.js` — 39 lines
- `client/index.html` — 14 lines
- `client/src/components/CreateServerModal.module.css` — 485 lines
- `client/public/favicon.svg` — 6 lines
- `client/README.md` — 17 lines
- `client/eslint.config.js` — 5 imports, 30 lines

