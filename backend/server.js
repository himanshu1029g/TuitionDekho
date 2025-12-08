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
// initialize kafka (async, don't block server start)
initKafka().catch(e=>console.warn('Kafka init failed (ok if Kafka not running):', e));

// mount requests route
const requestsRouter = require('./routes/requests');
app.use('/api/requests', requestsRouter);


// Middleware
// app.use(cors());  

//  now 
app.use(cors({
  // origin: "http://localhost:5173",
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/students', require('./routes/students'));
app.use('/api/notifications', require('./routes/notifications'));


// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
  console.log("server is working .well ")
});

// Error handling middleware

// Cached teacher list endpoint (caches results in Redis for 30s)
app.get('/api/teachers', async (req, res, next) => {
  try {
    const cacheKey = 'teachers:all';
    const cached = await redis.get(cacheKey);
    if (cached) {
      // also log search analytics to kafka
      const { sendEvent } = require('./services/kafka');
      sendEvent('search-logs', { type: 'CACHE_HIT', key: cacheKey, timestamp: new Date() });
      return res.json(JSON.parse(cached));
    }
    // Fallback: read teachers from User model (users with role 'teacher')
    const User = require('./models/User');
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    await redis.set(cacheKey, JSON.stringify(teachers), 'EX', 30); // 30s TTL
    const { sendEvent } = require('./services/kafka');
    sendEvent('search-logs', { type: 'CACHE_MISS', key: cacheKey, count: teachers.length, timestamp: new Date() });
    res.json(teachers);
  } catch (err) { next(err); }
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

