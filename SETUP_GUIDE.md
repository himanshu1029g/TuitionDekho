# Note: Redis & Kafka removed (Dec 2025)

## Overview

Redis and Kafka were removed from the project to simplify the stack — the app now only requires MongoDB, Backend and Frontend to run locally.

---

## Option 1: Using Docker Compose (Recommended)

### Prerequisites
- Docker installed on your machine
- Docker Compose installed

### Steps

1. **Navigate to project root:**
   ```powershell
   cd D:\4th year\Tuition at 16-11-25
   ```

2. **Start services (MongoDB, Backend, Frontend):**
   ```powershell
   docker-compose up --build
   ```

3. **Services will be available at:**
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:3000`
   - MongoDB: `localhost:27017`

4. **To stop services:**
   ```powershell
   docker-compose down
   ```

---

## Option 2: Manual Installation (Windows)

### 1. MongoDB
```powershell
# Using MongoDB Atlas (Cloud)
# OR Install MongoDB locally from: https://www.mongodb.com/try/download/community

# Test connection:
mongosh "mongodb://localhost:27017"
```





---

## Option 3: Running Locally

### .env Configuration
```env
MONGODB_URI=mongodb://localhost:27017
PORT=5000
JWT_SECRET=tonystark@123
NODE_ENV=development
```

### Start Services
```powershell
# Terminal 1: MongoDB (if running locally)
mongod

# Terminal 2: Backend
cd backend
npm install
npm start

# Terminal 3: Frontend
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tuitiondekho

# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key

# Note: Redis & Kafka removed (not required)
```

---

## Service Details

### MongoDB
- **Primary**: Main application database
- **Required**: Yes, app won't work without it
- **Location**: `backend/config/database.js`

---

## Testing Setup

### Quick Test (Docker)
```powershell
# Start everything
docker-compose up

# In another terminal, test backend:
curl http://localhost:5000

# Test frontend:
# Open http://localhost:3000
```

### Quick Test (Local)
```powershell
# Start MongoDB
mongod

# Terminal 3: Backend
cd backend
npm start
# Should see: "Server running on port 5000"

# Terminal 4: Frontend
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173/"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Port 5000 already in use` | Change `PORT` in `.env` or kill process on 5000 |
| `MongoDB connection failed` | Ensure MongoDB is running on 27017 |
| `Redis connection error` / `Kafka connection failed` | Not applicable — Redis and Kafka removed from this project |
| `CORS errors` | Frontend proxy is set to `http://localhost:5000` in `vite.config.ts` |

---

## Recommended Setup for Development

1. **Use Docker Compose** (easiest):
   ```powershell
   docker-compose up
   ```

2. **Or Manual Setup**:
   - MongoDB: Local or MongoDB Atlas (cloud)
   - Backend: `npm start`
   - Frontend: `npm run dev`

