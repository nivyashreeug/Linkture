const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const ApiError = require('./utils/ApiError');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const matchRoutes = require('./routes/matchRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const pitchDeckRoutes = require('./routes/pitchDeckRoutes');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 5000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});

app.use(apiLimiter);

// Serve uploads directory securely
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (request, response) => {
  response.json({ 
    success: true, 
    message: 'Linkture API', 
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      profile: '/api/profile',
      match: '/api/match',
      connections: '/api/connections',
      pitch: '/api/startups/pitch',
    }
  });
});

app.get('/api/health', (request, response) => {
  response.json({ success: true, message: 'Linkture API is healthy.' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/startups/pitch', pitchDeckRoutes);

app.use((request, response, next) => {
  next(new ApiError(404, `Route not found: ${request.originalUrl}`));
});

app.use((error, request, response, next) => {
  // Handle known DB/network errors gracefully
  if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
    return response.status(503).json({ success: false, message: 'Service unavailable. Please try again later.' });
  }

  if (error.name === 'MongooseTimeoutError') {
    return response.status(504).json({ success: false, message: 'Database request timed out.' });
  }

  // CastError usually means a malformed id or param
  if (error.name === 'CastError') {
    return response.status(400).json({ success: false, message: 'Invalid identifier provided.' });
  }

  const statusCode = error.statusCode || 500;
  let message = error.message || 'Server error';

  // In production, mask unhandled 500 internal errors
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  // Log server errors for diagnostics when not in test
  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  response.status(statusCode).json({
    success: false,
    message,
    details: process.env.NODE_ENV === 'production' && statusCode === 500 ? null : (error.details || null),
  });
});

module.exports = app;
