import express from 'express';
import { verifySupabaseToken } from '../middleware/auth.js';

const router = express.Router();

// Mock impressions endpoint (10K-50K random)
router.get('/mock/impressions', verifySupabaseToken, (req, res) => {
  const impressions = Math.floor(Math.random() * 40000) + 10000;
  res.json({
    data: impressions,
    is_mock: true,
    note: 'Will be replaced with real data post-MVP',
    timestamp: new Date().toISOString(),
    user: req.user.email
  });
});

// Mock click rate endpoint (2-5% random)
router.get('/mock/clickrate', verifySupabaseToken, (req, res) => {
  const clickRate = (Math.random() * 3 + 2).toFixed(2);
  res.json({
    data: parseFloat(clickRate),
    unit: 'percentage',
    is_mock: true,
    note: 'Will be replaced with real data post-MVP',
    timestamp: new Date().toISOString(),
    user: req.user.email
  });
});

// Real GA4 data query endpoint
router.get('/query', verifySupabaseToken, async (req, res) => {
  try {
    const { dimensions, metrics, startDate, endDate, limit = 100 } = req.query;
    
    // Validate required parameters
    if (!dimensions || !metrics) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'dimensions and metrics are required',
        example: '/api/analytics/query?dimensions=date&metrics=sessions&startDate=2025-08-01&endDate=2025-08-07'
      });
    }
    
    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing date range',
        message: 'startDate and endDate are required (format: YYYY-MM-DD)'
      });
    }
    
    // Parse dimensions and metrics
    const dimensionArray = Array.isArray(dimensions) ? dimensions : [dimensions];
    const metricArray = Array.isArray(metrics) ? metrics : [metrics];
    
    // Import analytics core dynamically to avoid startup issues
    const { GoogleAnalyticsCore } = await import('../../core/analytics-core.js');
    const analyticsCore = new GoogleAnalyticsCore();
    
    // Initialize and query GA4 data
    await analyticsCore.initialize();
    const data = await analyticsCore.queryAnalytics({
      dimensions: dimensionArray,
      metrics: metricArray,
      startDate,
      endDate,
      limit: Math.min(Math.max(parseInt(limit) || 100, 1), 1000)
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        dimensions: dimensionArray,
        metrics: metricArray,
        dateRange: { startDate, endDate },
        limit: parseInt(limit) || 100,
        timestamp: new Date().toISOString(),
        user: req.user.email
      }
    });
    
  } catch (error) {
    console.error('Analytics query error:', error);
    
    // Handle specific GA4 errors
    if (error.message.includes('quota')) {
      return res.status(429).json({
        error: 'API quota exceeded',
        message: 'Please try again later'
      });
    }
    
    if (error.message.includes('permission')) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'Insufficient permissions to access GA4 data'
      });
    }
    
    res.status(500).json({
      error: 'Analytics query failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Additional mock endpoints for comprehensive testing
router.get('/mock/sessions', verifySupabaseToken, (req, res) => {
  const sessions = Math.floor(Math.random() * 5000) + 1000;
  res.json({
    data: sessions,
    is_mock: true,
    note: 'Mock sessions data - will be replaced with real GA4 data',
    timestamp: new Date().toISOString()
  });
});

router.get('/mock/users', verifySupabaseToken, (req, res) => {
  const users = Math.floor(Math.random() * 3000) + 500;
  res.json({
    data: users,
    is_mock: true,
    note: 'Mock users data - will be replaced with real GA4 data',
    timestamp: new Date().toISOString()
  });
});

router.get('/mock/bounce-rate', verifySupabaseToken, (req, res) => {
  const bounceRate = (Math.random() * 30 + 30).toFixed(2); // 30-60%
  res.json({
    data: parseFloat(bounceRate),
    unit: 'percentage',
    is_mock: true,
    note: 'Mock bounce rate data - will be replaced with real GA4 data',
    timestamp: new Date().toISOString()
  });
});

router.get('/mock/conversions', verifySupabaseToken, (req, res) => {
  const conversions = Math.floor(Math.random() * 200) + 50;
  res.json({
    data: conversions,
    is_mock: true,
    note: 'Mock conversions data - will be replaced with real GA4 data',
    timestamp: new Date().toISOString()
  });
});

// List all available analytics endpoints
router.get('/', (req, res) => {
  res.json({
    message: 'Analytics API endpoints',
    version: '1.0.0',
    endpoints: {
      'GET /query': 'Real GA4 data query (requires auth)',
      'GET /mock/impressions': 'Mock impressions data (requires auth)',
      'GET /mock/clickrate': 'Mock click rate data (requires auth)',
      'GET /mock/sessions': 'Mock sessions data (requires auth)',
      'GET /mock/users': 'Mock users data (requires auth)',
      'GET /mock/bounce-rate': 'Mock bounce rate data (requires auth)',
      'GET /mock/conversions': 'Mock conversions data (requires auth)'
    },
    parameters: {
      query: {
        dimensions: 'GA4 dimensions (e.g., date, country)',
        metrics: 'GA4 metrics (e.g., sessions, totalUsers)',
        startDate: 'Start date (YYYY-MM-DD)',
        endDate: 'End date (YYYY-MM-DD)',
        limit: 'Number of rows (default: 100, max: 1000)'
      }
    },
    mockData: {
      note: 'Mock endpoints return random data for MVP development',
      ranges: {
        impressions: '10,000 - 50,000',
        clickrate: '2% - 5%',
        sessions: '1,000 - 6,000',
        users: '500 - 3,500',
        bounceRate: '30% - 60%',
        conversions: '50 - 250'
      }
    }
  });
});

export default router;