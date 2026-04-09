# ADSMS - Academic Digital Signature Management System

Full-stack MERN application for managing academic document signing workflows.

## Project Structure
```
Mukesh_Project/
├── backend/     # Node.js + Express API
└── frontend/    # React + Vite SPA
```

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Fill in your MongoDB URI, JWT secret, and email credentials
npm run dev            # Starts on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install            # (already done if scaffolded)
npm run dev            # Starts on http://localhost:5173
```

## Environment Variables (backend/.env)
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `EMAIL_USER` | Gmail address for notifications |
| `EMAIL_PASS` | Gmail App Password (not your account password) |
| `CLIENT_URL` | Frontend URL for CORS |

## Gmail App Password Setup
1. Go to Google Account → Security → 2-Step Verification
2. At the bottom: **App passwords**
3. Generate one for "Mail" → paste in `EMAIL_PASS`

## API Endpoints

### Auth
- `POST /api/auth/register` — Student registration
- `POST /api/auth/login` — Login (student/admin)
- `GET  /api/auth/me` — Get current user

### Documents (Student)
- `POST /api/documents/upload` — Upload document
- `GET  /api/documents/my` — Get own documents
- `GET  /api/documents/:id` — Get single document
- `DELETE /api/documents/:id` — Delete pending document
- `GET  /api/documents/:id/download` — Download file

### Admin
- `GET  /api/admin/stats` — Dashboard stats
- `GET  /api/admin/documents` — All documents
- `PUT  /api/admin/documents/:id/approve` — Approve & sign
- `PUT  /api/admin/documents/:id/reject` — Reject
- `PUT  /api/admin/documents/:id/review` — Mark under review
- `GET  /api/admin/students` — All students
- `GET  /api/admin/audit-logs` — System audit logs

## Deployment

### Frontend → Vercel
```bash
cd frontend
# Set env: VITE_API_URL = https://your-backend.onrender.com
# Deploy via vercel CLI or GitHub integration
```

### Backend → Render
- Build command: `npm install`
- Start command: `node server.js`
- Add all env variables in Render dashboard

## Default Admin Account
Create manually in MongoDB or seed script:
- Email: `admin@adsms.com`
- Role: `admin`
- Password: bcrypt hash of your password
