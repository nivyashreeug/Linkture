const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const ApiError = require('./utils/ApiError');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

app.get('/api/health', (request, response) => {
  response.json({ success: true, message: 'Linkture API is healthy.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((request, response, next) => {
  next(new ApiError(404, `Route not found: ${request.originalUrl}`));
});

app.use((error, request, response, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server error';

  response.status(statusCode).json({
    success: false,
    message,
    details: error.details || null,
  });
});

module.exports = app;
