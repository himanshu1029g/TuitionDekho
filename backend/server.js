const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/database');

// Load env
dotenv.config();

// Validate critical env vars
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

// DB
connectDB();

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // permissive in dev; tighten for production
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/students', require('./routes/students'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/chats', require('./routes/chats'));
app.use("/api/calls", require("./routes/calls"));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'TuitionDekho API is running' });
});

/* -------------------- 404 HANDLER -------------------- */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

/* -------------------- ERROR HANDLER (LAST) -------------------- */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

/* -------------------- SOCKET.IO -------------------- */
const { initSocket } = require('./socket');
const server = http.createServer(app);
initSocket(server);

/* -------------------- START -------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* -------------------- UNHANDLED REJECTIONS -------------------- */
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});
