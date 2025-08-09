import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { verifySupabaseToken } from './middleware/auth.js';
import uploadRoutes from './routes/upload.js';
import analyticsRoutes from './routes/analytics.js';
import dashboardRoutes from './routes/dashboard.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.API_PORT || 5050;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      supabase: 'connected'
    }
  });
});



// Upload routes
app.use('/api/upload', uploadRoutes);

// Test endpoint for mock data (bypasses auth for testing)
app.get('/api/test/mock/impressions', async (req, res) => {
  const impressions = Math.floor(Math.random() * 40000) + 10000;
  res.json({
    data: impressions,
    is_mock: true,
    note: 'Test endpoint - bypasses auth for demonstration',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test/mock/clickrate', async (req, res) => {
  const clickRate = (Math.random() * 3 + 2).toFixed(2);
  res.json({
    data: parseFloat(clickRate),
    unit: 'percentage',
    is_mock: true,
    note: 'Test endpoint - bypasses auth for demonstration',
    timestamp: new Date().toISOString()
  });
});

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Start server
app.listen(port, () => {
  console.log(`API Server running on port ${port}`);
});