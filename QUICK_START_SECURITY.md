# Quick Start Guide - New Security Features

## For Backend Developers

### 1. Start the Server

```bash
cd Back-end

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values
# Most critical: JWT_SECRET, CONNECTION_STRING, AI_SERVICE_URL

# Start server
npm start
# Server running at: http://localhost:3000
```

### 2. Test Authentication

```bash
# Get CSRF token (required for all requests)
curl http://localhost:3000/csrf-token

# Register a new child
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token from above>" \
  -d '{
    "childname": "child_name",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -d '{
    "childname": "child_name",
    "password": "SecurePass123!"
  }'
```

### 3. Use JWT Token

```bash
# Get profile with token
curl http://localhost:3000/profile \
  -H "Authorization: Bearer <jwt_token_from_login>"

# Response includes X-New-Token if token needs refresh
```

### 4. Health Checks

```bash
# General health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/health/db

# AI service health
curl http://localhost:3000/health/ai
```

---

## For Frontend Developers

### 1. Setup React Component

```javascript
// src/main.jsx
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
```

### 2. Login Component

```javascript
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function LoginPage() {
  const { login } = useContext(AuthContext);
  const [childname, setChildname] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(childname, password);
      window.location.href = "/dashboard";
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={childname} onChange={(e) => setChildname(e.target.value)} />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### 3. Protected API Calls

```javascript
import apiClient from "../services/api";

// Already includes:
// - JWT token in Authorization header
// - CSRF token in X-CSRF-Token header
// - Idempotency-Key for POST/PUT/DELETE
// - Automatic token refresh on 401

const response = await apiClient.get("/profile");
```

### 4. WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  query: {
    childname: 'john_doe',
    sessionId: '...',
    token: localStorage.getItem('token')
  }
});

socket.on('emotion_result', (result) => {
  console.log('Emotion:', result.emotion);
});

socket.emit('landmarks', { landmarks: [...], gameId: 'quiz', qid: 'q1' });
```

---

## Environment Variables - Quick Reference

### Required for Local Development

```bash
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
CONNECTION_STRING=mongodb://localhost:27017/emotilearn

# Security (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-32-character-secret-key-here
JWT_EXPIRY=24h

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

### Optional for Development

```bash
# Redis (for production caching)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Common Commands

### Backend

```bash
# Install dependencies
npm install

# Start server
npm start

# Run tests
npm test

# Check for errors
npm run lint

# Format code
npm run format
```

### Frontend

```bash
cd Front-end

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

---

## API Endpoints Quick Reference

### Authentication

| Method | Endpoint       | Auth | Purpose          |
| ------ | -------------- | ---- | ---------------- |
| GET    | `/csrf-token`  | No   | Get CSRF token   |
| POST   | `/register`    | No   | Register child   |
| POST   | `/login`       | No   | Login child      |
| POST   | `/admin/login` | No   | Admin login      |
| GET    | `/profile`     | Yes  | Get user profile |
| POST   | `/logout`      | Yes  | Logout           |

### Scores

| Method | Endpoint        | Auth | Purpose         |
| ------ | --------------- | ---- | --------------- |
| POST   | `/store-scores` | Yes  | Save game score |

### Reports

| Method | Endpoint                 | Auth | Purpose          |
| ------ | ------------------------ | ---- | ---------------- |
| GET    | `/reports/children`      | Yes  | Get all children |
| GET    | `/reports/report/<name>` | Yes  | Get child report |

### Health

| Method | Endpoint     | Auth | Purpose           |
| ------ | ------------ | ---- | ----------------- |
| GET    | `/health`    | No   | Server health     |
| GET    | `/health/db` | No   | Database health   |
| GET    | `/health/ai` | No   | AI service health |

---

## Debug Mode

### Enable Request Logging

```bash
# .env
DEBUG=app:*
```

### Check Token Contents

```javascript
// In browser console
const token = localStorage.getItem("token");
const decoded = JSON.parse(atob(token.split(".")[1]));
console.log(decoded);
```

### WebSocket Debug

```javascript
socket.on("connect_error", (error) => {
  console.error("WebSocket error:", error);
});

socket.on("emotion_error", (error) => {
  console.error("Emotion error:", error);
});
```

---

## Testing Checklist

### Manual Testing

- [ ] Registration with weak password (should fail)
- [ ] Login with wrong password (should fail)
- [ ] Access `/profile` without token (should fail)
- [ ] CSRF token validation
- [ ] Token expiration and refresh
- [ ] WebSocket connection with JWT
- [ ] Emotion detection messages
- [ ] Duplicate score submissions (idempotency)
- [ ] Rate limiting (5 failed logins)

### Automated Testing

```bash
# Backend tests
npm test

# Frontend tests
cd Front-end
npm test

# Load testing
npm install -g artillery
artillery quick --count 1000 --num 100 http://localhost:3000/health
```

---

## Troubleshooting

### "No authentication token provided"

**Solution**: Add `Authorization: Bearer <token>` header

### "CSRF validation failed"

**Solution**:

1. Call `/csrf-token` endpoint first
2. Use returned token in `X-CSRF-Token` header

### WebSocket connection refused

**Solution**:

1. Check token is valid
2. Ensure query params include: `childname`, `sessionId`, `token`
3. Check browser console for JWT error

### "Too many requests"

**Solution**: Wait 15 minutes or change IP

### 304 Not Modified (caching issue)

**Solution**:

- This is normal! It means data hasn't changed
- If you need fresh data, use `Cache-Control: no-cache`

---

## Documentation Files

Quick links to detailed documentation:

1. **API_DOCUMENTATION.md** - Complete API reference
2. **SECURITY_IMPLEMENTATION_GUIDE.md** - Security setup and production checklist
3. **FRONTEND_INTEGRATION_GUIDE.md** - Frontend implementation examples
4. **IMPLEMENTATION_SUMMARY.md** - What was built and why

---

## Getting Help

### Check Logs

```bash
# Backend
tail -f logs/emotilearn.log

# Frontend (browser console)
F12 → Console
```

### Verify Configuration

```javascript
// .env values set correctly
// JWT_SECRET length >= 32
// CONNECTION_STRING starts with mongodb
// FRONTEND_URL matches React dev server
```

### Test Connectivity

```bash
# Test MongoDB
mongosh mongodb://localhost:27017/emotilearn

# Test AI Service
curl http://localhost:8000/health

# Test Backend
curl http://localhost:3000/health
```

---

## Next: Production Deployment

When ready for production:

1. Read: `SECURITY_IMPLEMENTATION_GUIDE.md` → Production Checklist
2. Update environment variables in AWS Secrets Manager
3. Deploy using blue-green strategy
4. Monitor health endpoints
5. Review logs for errors

---

## Summary

✅ All security features are now active
✅ JWT authentication requires valid tokens
✅ CSRF protection on all forms
✅ Rate limiting prevents abuse
✅ Request validation ensures data quality
✅ Error responses are consistent
✅ WebSocket has JWT verification
✅ Production-ready and tested

**You're all set to build secure, reliable applications with Emotilearn!**

---

**Questions?** See the detailed documentation or check API_DOCUMENTATION.md for specific endpoint usage.
