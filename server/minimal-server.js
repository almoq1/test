const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'B2B Flight Booking System is running!',
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'B2B Flight Booking System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      flights: '/api/flights',
      bookings: '/api/bookings',
      agents: '/api/agents',
      enterprise: '/api/enterprise'
    }
  });
});

// Basic auth routes (without database)
app.post('/api/auth/login', (req, res) => {
  res.json({
    message: 'Login endpoint - database not connected',
    status: 'demo'
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    message: 'Register endpoint - database not connected',
    status: 'demo'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🚀 B2B Flight Booking System Server Started!');
  console.log(`📊 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API base: http://localhost:${PORT}`);
  console.log('⚠️  Running in minimal mode (no database)');
});