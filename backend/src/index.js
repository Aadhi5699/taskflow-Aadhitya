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

const server = app.listen(port, () => {
  console.log(`🚀 API Server running on port ${port}`);
});

// Graceful shutdown handling
const shutdown = () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
