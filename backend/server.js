require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB = require('./config/db');

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/admin',     require('./routes/admin'));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ADSMS API is running', timestamp: new Date() });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File size too large. Max 10MB allowed.' });
  }
  if (err.message && err.message.includes('Only PDF')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ── Start Server with Auto-Fallback Port ─────────────────────────────────────
const PRIMARY_PORT = parseInt(process.env.PORT) || 5001;
const FALLBACK_PORT = PRIMARY_PORT + 1;           // e.g. 5002 if primary is 5001

function startServer(port) {
  const server = app.listen(port, () => {
    console.log('');
    console.log('┌──────────────────────────────────────────────────┐');
    console.log('│  🚀 ADSMS Server started successfully             │');
    console.log(`│  📡 Port        : ${String(port).padEnd(31)}│`);
    console.log(`│  🌍 Environment : ${(process.env.NODE_ENV || 'development').padEnd(31)}│`);
    console.log(`│  🔗 API Base    : http://localhost:${port}/api      │`);
    console.log(`│  💻 Frontend    : ${(process.env.CLIENT_URL || 'http://localhost:5173').padEnd(31)}│`);
    console.log('└──────────────────────────────────────────────────┘');
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${port} is already in use.`);

      if (port === PRIMARY_PORT) {
        console.log(`🔄 Trying fallback port ${FALLBACK_PORT}...\n`);
        startServer(FALLBACK_PORT);
      } else {
        console.error(`❌ Fallback port ${port} is also busy.`);
        console.error('');
        console.error('👉 Fix: Run this command to free up ports, then restart:');
        console.error('       taskkill /IM node.exe /F');
        console.error('');
        process.exit(1);
      }
    } else {
      console.error('❌ Unexpected server error:', err.message);
      process.exit(1);
    }
  });
}

startServer(PRIMARY_PORT);
