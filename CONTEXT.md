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

**`client/src/components/AuthForm.jsx`**
- `AuthForm()`

**`client/src/pages/Login.jsx`**
- `Login()`

**`client/src/pages/Landing.jsx`**
- `Landing()`

**`client/src/components/Navbar.jsx`**
- `Navbar()`

**`client/src/components/CreateServerModal.jsx`**
- `CreateServerModal()`

**`server/controllers/serverController.js`**
- `generateInviteCode()`

**`server/middleware/authMiddleware.js`**
- `verifyToken()`

**`client/src/pages/Signup.jsx`**
- `Signup()`

**`server/middleware/validate.js`**
- `validate()`

**`server/utils/ApiError.js`**
- class `ApiError`
  - `constructor()`

**`client/src/App.jsx`**
- `GuestRoute()`
- `InvitePage()`
- `AppRouter()`

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

**Notes:** large file (1016 lines)

### `server/controllers/userController.js`

**Purpose:** Implements userController.

### `client/src/pages/UserSettings.jsx`

**Purpose:** Implements UserSettings.

**Functions:**
- `function UserSettings({ onClose })`

**Notes:** large file (787 lines)

### `client/src/components/AuthForm.jsx`

**Purpose:** Implements AuthForm.

**Functions:**
- `function AuthForm(`

### `client/src/pages/Login.jsx`

**Purpose:** Implements Login.

**Functions:**
- `function Login()`

## SUPPORTING_MODULES

### `client/src/pages/Landing.jsx`

```javascript
function Landing()

```

### `client/src/components/Navbar.jsx`

```javascript
function Navbar()

```

### `client/src/components/CreateServerModal.jsx`

```javascript
const CreateServerModal = ...

```

### `server/controllers/serverController.js`

```javascript
const generateInviteCode = ...

```

### `server/app.js`

*51 lines, 0 imports*

### `server/middleware/authMiddleware.js`

```javascript
const verifyToken = ...

```

### `client/src/pages/Signup.jsx`

```javascript
function Signup()

```

### `server/middleware/validate.js`

```javascript
const validate = ...

```

### `client/src/pages/AppPage.module.css`

*1680 lines, 0 imports*

### `server/utils/ApiError.js`

```javascript
class ApiError

```

### `client/src/App.jsx`

```javascript
function GuestRoute({ children })

function InvitePage()

function AppRouter()

```

### `server/routes/userRoutes.js`

*21 lines, 0 imports*

### `client/src/components/Logo.jsx`

```javascript
function Logo({ size = 24, light = false })

```

### `server/database/db.js`

```javascript
async function connectDB()

function getDB()

```

### `server/server.js`

*75 lines, 0 imports*

### `client/src/pages/Landing.module.css`

*932 lines, 0 imports*

### `client/src/components/AuthForm.module.css`

*349 lines, 0 imports*

## DEPENDENCY_GRAPH

```mermaid
graph LR
    f0["client/src/context/AuthContext.jsx"]
    f1["client/src/pages/AppPage.jsx"]
    f2["server/controllers/userController.js"]
    f3["client/src/pages/UserSettings.jsx"]
    f4["package.json"]
    f5["package-lock.json"]
    f6["client/src/components/AuthForm.jsx"]
    f7["client/src/pages/Login.jsx"]
    f8["client/src/pages/Landing.jsx"]
    f9["client/src/components/Navbar.jsx"]
    f10["client/src/components/CreateServerModal.jsx"]
    f11["server/controllers/serverController.js"]
    f12["server/app.js"]
    f13["server/middleware/authMiddleware.js"]
    f14["client/src/pages/Signup.jsx"]
    f15["server/middleware/validate.js"]
    f16["client/src/pages/AppPage.module.css"]
    f17["server/utils/ApiError.js"]
    f18["client/src/App.jsx"]
    f19["server/routes/userRoutes.js"]
    f20["client/src/components/Logo.jsx"]
    f21["server/database/db.js"]
    f22["server/server.js"]
    f23["client/src/pages/Landing.module.css"]
    f24["client/src/components/AuthForm.module.css"]
    f1 --> f3
    f1 --> f20
    f1 --> f10
    f1 --> f0
    f2 --> f14
    f2 --> f7
    f2 --> f17
    f3 --> f0
    f5 --> f15
    f6 --> f20
    f7 --> f6
    f7 --> f0
    f8 --> f20
    f8 --> f9
    f9 --> f20
    f9 --> f0
    f12 --> f17
    f14 --> f6
    f15 --> f17
    f18 --> f1
    f18 --> f14
    f18 --> f7
    f18 --> f8
    f18 --> f0
    f19 --> f13
    f19 --> f15
    f22 --> f21
```

## RANKED_FILES

| File | Score | Tier | Tokens |
|------|-------|------|--------|
| `client/src/context/AuthContext.jsx` | 0.568 | structured summary | 36 |
| `client/src/pages/AppPage.jsx` | 0.514 | structured summary | 45 |
| `server/controllers/userController.js` | 0.500 | structured summary | 15 |
| `client/src/pages/UserSettings.jsx` | 0.437 | structured summary | 38 |
| `package.json` | 0.390 | one-liner | 10 |
| `package-lock.json` | 0.387 | one-liner | 12 |
| `client/src/components/AuthForm.jsx` | 0.367 | structured summary | 26 |
| `client/src/pages/Login.jsx` | 0.343 | structured summary | 24 |
| `client/src/pages/Landing.jsx` | 0.342 | signatures | 17 |
| `client/src/components/Navbar.jsx` | 0.330 | signatures | 17 |
| `client/src/components/CreateServerModal.jsx` | 0.329 | signatures | 21 |
| `server/controllers/serverController.js` | 0.318 | signatures | 19 |
| `server/app.js` | 0.318 | signatures | 14 |
| `server/middleware/authMiddleware.js` | 0.318 | signatures | 19 |
| `client/src/pages/Signup.jsx` | 0.308 | signatures | 17 |
| `server/middleware/validate.js` | 0.300 | signatures | 18 |
| `client/src/pages/AppPage.module.css` | 0.300 | signatures | 19 |
| `server/utils/ApiError.js` | 0.300 | signatures | 18 |
| `client/src/App.jsx` | 0.253 | signatures | 26 |
| `server/routes/userRoutes.js` | 0.245 | signatures | 16 |
| `client/src/components/Logo.jsx` | 0.236 | signatures | 26 |
| `server/database/db.js` | 0.231 | signatures | 21 |
| `server/server.js` | 0.223 | signatures | 14 |
| `client/src/pages/Landing.module.css` | 0.218 | signatures | 18 |
| `client/src/components/AuthForm.module.css` | 0.217 | signatures | 18 |
| `client/src/index.css` | 0.205 | one-liner | 12 |
| `server/utils/cloudinaryHelper.js` | 0.200 | one-liner | 18 |
| `.gitignore` | 0.194 | one-liner | 10 |
| `README.md` | 0.181 | one-liner | 10 |
| `client/src/components/ProtectedRoute.jsx` | 0.171 | one-liner | 23 |
| `server/routes/serverRoutes.js` | 0.161 | one-liner | 13 |
| `client/src/pages/OAuthCallback.jsx` | 0.158 | one-liner | 23 |
| `client/src/components/Navbar.module.css` | 0.158 | one-liner | 15 |
| `server/middleware/errorMiddleware.js` | 0.150 | one-liner | 18 |
| `client/src/components/EditServerModal.jsx` | 0.149 | one-liner | 23 |
| `server/routes/authRoutes.js` | 0.132 | one-liner | 13 |
| `server/config/passport.js` | 0.131 | one-liner | 13 |
| `nodemon.json` | 0.123 | one-liner | 11 |
| `client/src/pages/UserSettings.module.css` | 0.121 | one-liner | 15 |
| `server/models/Message.js` | 0.111 | one-liner | 13 |

## PERIPHERY

- `package.json` — 38 lines
- `package-lock.json` — 2600 lines
- `client/src/index.css` — 51 lines
- `server/utils/cloudinaryHelper.js` — 2 functions, 47 lines
- `.gitignore` — 18 lines
- `README.md` — 132 lines
- `client/src/components/ProtectedRoute.jsx` — 1 function, 2 imports, 18 lines
- `server/routes/serverRoutes.js` — 54 lines
- `client/src/pages/OAuthCallback.jsx` — 1 function, 3 imports, 67 lines
- `client/src/components/Navbar.module.css` — 107 lines
- `server/middleware/errorMiddleware.js` — 2 functions, 40 lines
- `client/src/components/EditServerModal.jsx` — 1 function, 2 imports, 122 lines
- `server/routes/authRoutes.js` — 64 lines
- `server/config/passport.js` — 70 lines
- `nodemon.json` — 8 lines
- `client/src/pages/UserSettings.module.css` — 709 lines
- `server/models/Message.js` — 43 lines
- `server/models/Server.js` — 52 lines
- `client/vite.config.js` — 2 imports, 7 lines
- `client/src/main.jsx` — 5 imports, 14 lines
- `server/validations/serverSchemas.js` — 48 lines
- `server/validations/userSchemas.js` — 59 lines
- `server/utils/catchAsync.js` — 1 function, 6 lines
- `client/package-lock.json` — 3568 lines
- `client/package.json` — 32 lines
- `server/models/User.js` — 39 lines
- `server/routes/uploadRoutes.js` — 39 lines
- `client/index.html` — 14 lines
- `client/src/components/CreateServerModal.module.css` — 485 lines
- `client/public/favicon.svg` — 6 lines
- `client/src/components/JoinServerModal.jsx` — 1 function, 2 imports, 82 lines
- `client/README.md` — 17 lines
- `client/eslint.config.js` — 5 imports, 30 lines

