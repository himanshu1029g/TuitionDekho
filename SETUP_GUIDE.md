# Redis & Kafka Setup Guide

## Overview

Your project uses:
- **Redis**: For caching (teacher list cache)
- **Kafka**: For event streaming/logging (search logs, request logs)
- **MongoDB**: Main database

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

2. **Start all services (MongoDB, Redis, Kafka, Backend, Frontend):**
   ```powershell
   docker-compose up --build
   ```

3. **Services will be available at:**
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:3000`
   - MongoDB: `localhost:27017`
   - Redis: `localhost:6379`
   - Kafka: `localhost:9092`

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

### 2. Redis
```powershell
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use Windows Subsystem for Linux (WSL)
# OR use Docker:
docker run -d -p 6379:6379 redis:7

# Test connection:
redis-cli
```

### 3. Kafka (Optional - for event streaming)
```powershell
# Download from: https://kafka.apache.org/downloads
# Complex setup - recommend Docker instead
# OR use Docker:
docker-compose up mongo redis kafka zookeeper
```

---

## Option 3: Running Locally Without Kafka/Redis

### .env Configuration
```env
MONGODB_URI=mongodb://localhost:27017
PORT=5000
JWT_SECRET=tonystark@123
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
NODE_ENV=development
```

### Start Services
```powershell
# Terminal 1: MongoDB (if running locally)
mongod

# Terminal 2: Redis (if running)
redis-server

# Terminal 3: Backend
cd backend
npm install
npm start

# Terminal 4: Frontend
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

# Redis (optional but recommended)
REDIS_URL=redis://localhost:6379

# Kafka (optional)
KAFKA_BROKERS=localhost:9092
```

---

## Service Details

### Redis Usage
- **Purpose**: Caching teacher list for faster searches
- **TTL**: 30 seconds
- **Fallback**: If Redis is down, data is fetched from MongoDB directly
- **Location**: `backend/services/redisClient.js`

### Kafka Usage
- **Purpose**: Event streaming and logging
- **Topics Used**:
  - `search-logs`: Cache hits/misses
  - `request-logs`: Meeting request events
- **Fallback**: If Kafka is down, app continues without event streaming
- **Location**: `backend/services/kafka.js`

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

# Start Redis
redis-server

# Terminal 3: Backend
cd backend
npm start
# Should see: "Server running on port 5000"
# Should see: "Redis connected" or "Redis unavailable (caching disabled)"

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
| `Redis connection error` | Optional - app works without it (caching disabled) |
| `Kafka connection failed` | Optional - app works without it (event logging disabled) |
| `CORS errors` | Frontend proxy is set to `http://localhost:5000` in `vite.config.ts` |

---

## Recommended Setup for Development

1. **Use Docker Compose** (easiest):
   ```powershell
   docker-compose up
   ```

2. **Or Manual Setup**:
   - MongoDB: Local or MongoDB Atlas (cloud)
   - Redis: Docker container only
   - Backend: `npm start`
   - Frontend: `npm run dev`

