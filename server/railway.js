// Railway-compatible server
const express = require('express');
const path = require('path');
const { fileURLToPath } = require('url');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'EduTrack Railway server',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../dist/public');
  app.use(express.static(publicPath));
  
  // Serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    }
  });
}

// Basic API routes for testing
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API working',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'available' : 'not configured'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const port = parseInt(process.env.PORT || "5000", 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`EduTrack Railway server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`Static files: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled'}`);
});