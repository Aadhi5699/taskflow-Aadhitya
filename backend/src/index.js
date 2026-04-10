require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middlewares/errorHandler');
const authMiddleware = require('./middlewares/authMiddleware');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/auth', authRoutes);
app.use('/projects', authMiddleware, projectRoutes);
app.use('/tasks', authMiddleware, taskRoutes);
app.get('/users', authMiddleware, async (req, res, next) => {
  try {
    const users = await require('./models/userModel').findAll();
    res.json(users);
  } catch(err) { next(err); }
});

// Generic error handler must be last
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Structured Logging Helper
const logger = (msg, meta = {}) => {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), message: msg, ...meta }));
};

const server = app.listen(PORT, () => {
  logger('🚀 API Server running', { port: PORT, env: process.env.NODE_ENV });
});

// Graceful Shutdown Support
const shutdown = () => {
  logger('⚠️ SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger('🛑 Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
