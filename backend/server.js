const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// --- Added services: Redis and Kafka ---
const redis = require('./services/redisClient');
const { initKafka } = require('./services/kafka');
initKafka().catch(e => console.warn('Kafka init failed (ok if Kafka not running):', e));

// Requests route
const requestsRouter = require('./routes/requests');
app.use('/api/requests', requestsRouter);

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/students', require('./routes/students'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
  console.log("server is working .well ");
});

// Cached teacher endpoint
app.get('/api/teachers', async (req, res, next) => {
  try {
    const cacheKey = 'teachers:all';
    const cached = await redis.get(cacheKey);
    if (cached) {
      const { sendEvent } = require('./services/kafka');
      sendEvent('search-logs', { type: 'CACHE_HIT', key: cacheKey, timestamp: new Date() });
      return res.json(JSON.parse(cached));
    }

    const User = require('./models/User');
    const teachers = await User.find({ role: 'teacher' }).select('-password');

    await redis.set(cacheKey, JSON.stringify(teachers), 'EX', 30);

    const { sendEvent } = require('./services/kafka');
    sendEvent('search-logs', { type: 'CACHE_MISS', key: cacheKey, count: teachers.length, timestamp: new Date() });

    res.json(teachers);
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ---------------------------------------------
// 🚀 SOCKET.IO INTEGRATION (REAL-TIME CHAT)
// ---------------------------------------------
const http = require('http');
const { Server } = require('socket.io');

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

// Store user sockets
const userSockets = new Map();

// When a user connects
io.on("connection", (socket) => {
  console.log("🔥 Socket connected:", socket.id);

  // Receive user ID and save socket mapping
  socket.on("register", (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User registered: ${userId} -> ${socket.id}`);
  });

  // Handle private messages
  socket.on("private_message", ({ toUserId, message }) => {
    const targetSocket = userSockets.get(toUserId);
    if (targetSocket) {
      io.to(targetSocket).emit("private_message", message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    userSockets.forEach((id, key) => {
      if (id === socket.id) userSockets.delete(key);
    });
  });
});

// ---------------------------------------------
// START SERVER
// ---------------------------------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running with Socket.IO on port ${PORT}`);
});
