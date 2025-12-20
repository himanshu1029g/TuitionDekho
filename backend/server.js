const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/database');

// Load env
dotenv.config();

// DB
connectDB();

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- SERVICES -------------------- */
const redis = require('./services/redisClient');
const { initKafka, sendEvent } = require('./services/kafka');

initKafka().catch(e =>
  console.warn('Kafka init failed (ok if Kafka not running):', e.message)
);

/* -------------------- ROUTES -------------------- */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/students', require('./routes/students'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/chats', require('./routes/chats'));
app.use("/api/calls", require("./routes/calls"));


app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

/* -------------------- CACHED TEACHERS (SAFE) -------------------- */
app.get('/api/teachers/all', async (req, res, next) => {
  try {
    const cacheKey = 'teachers:all';

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        sendEvent('search-logs', {
          type: 'CACHE_HIT',
          key: cacheKey,
          timestamp: new Date()
        });
        return res.json(JSON.parse(cached));
      }
    } catch (e) {
      console.warn('Redis read failed, falling back to DB');
    }

    const User = require('./models/User');
    const teachers = await User.find({ role: 'teacher' }).select('-password');

    try {
      await redis.set(cacheKey, JSON.stringify(teachers), 'EX', 30);
      sendEvent('search-logs', {
        type: 'CACHE_MISS',
        key: cacheKey,
        count: teachers.length,
        timestamp: new Date()
      });
    } catch (e) {
      console.warn('Redis write failed');
    }

    res.json(teachers);
  } catch (err) {
    next(err);
  }
});

/* -------------------- ERROR HANDLER (LAST) -------------------- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

/* -------------------- SOCKET.IO -------------------- */
const { initSocket } = require('./socket');
const server = http.createServer(app);
initSocket(server);

/* -------------------- START -------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
