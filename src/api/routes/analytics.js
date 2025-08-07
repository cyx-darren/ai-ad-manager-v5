import express from 'express';

const router = express.Router();

// Middleware to ensure analytics core is available
const ensureAnalyticsCore = (req, res, next) => {
  if (!req.analyticsCore) {
    return res.status(500).json({
      error: 'Analytics core not available',
      message: 'Server configuration error'
    });
  }
  next();
};

// Apply middleware to all routes
router.use(ensureAnalyticsCore);

// Helper function to validate date parameters
const validateDateRange = (startDate, endDate) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!startDate || !endDate) {
    return 'Start date and end date are required (format: YYYY-MM-DD)';
  }
  
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return 'Invalid date format. Use YYYY-MM-DD';
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid dates provided';
  }
  
  if (start > end) {
    return 'Start date must be before end date';
  }
  
  // Limit to 1 year range
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > oneYearMs) {
    return 'Date range cannot exceed 1 year';
  }
  
  return null;
};

// Helper function for error handling
const handleAnalyticsError = (error, res) => {
  console.error('Analytics API Error:', error);
  
  if (error.message.includes('quota')) {
    return res.status(429).json({
      error: 'API quota exceeded',
      message: 'Please try again later'
    });
  }
  
  if (error.message.includes('permission')) {
    return res.status(403).json({
      error: 'Permission denied',
      message: 'Insufficient permissions to access this data'
    });
  }
  
  if (error.message.includes('not found')) {
    return res.status(404).json({
      error: 'Resource not found',
      message: 'The requested analytics data was not found'
    });
  }
  
  return res.status(500).json({
    error: 'Analytics query failed',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
};

// GET /api/analytics - List available endpoints
router.get('/', (req, res) => {
  res.json({
    message: 'Google Analytics API endpoints',
    version: '1.0.0',
    endpoints: {
      'GET /query': 'Custom analytics query',
      'GET /realtime': 'Real-time data',
      'GET /traffic-sources': 'Traffic source analysis',
      'GET /demographics': 'User demographics',
      'GET /pages': 'Page performance',
      'GET /conversions': 'Conversion data',
      'GET /campaigns': 'Campaign performance',
      'GET /devices': 'Device breakdown',
      'GET /geographic': 'Geographic distribution',
      'GET /metrics': 'Available metrics and dimensions'
    },
    parameters: {
      common: {
        startDate: 'Start date (YYYY-MM-DD)',
        endDate: 'End date (YYYY-MM-DD)',
        limit: 'Number of rows (default: 100, max: 1000)'
      }
    }
  });
});

// GET /api/analytics/query - Custom analytics query
router.get('/query', async (req, res) => {
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
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: dateError
      });
    }
    
    // Parse dimensions and metrics
    const dimensionArray = Array.isArray(dimensions) ? dimensions : [dimensions];
    const metricArray = Array.isArray(metrics) ? metrics : [metrics];
    
    // Validate limit
    const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    
    const data = await req.analyticsCore.queryAnalytics({
      dimensions: dimensionArray,
      metrics: metricArray,
      startDate,
      endDate,
      limit: limitNum
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        dimensions: dimensionArray,
        metrics: metricArray,
        dateRange: { startDate, endDate },
        limit: limitNum,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

// GET /api/analytics/realtime - Real-time analytics data
router.get('/realtime', async (req, res) => {
  try {
    const { metrics = ['activeUsers'], dimensions = [] } = req.query;
    
    const metricArray = Array.isArray(metrics) ? metrics : [metrics];
    const dimensionArray = Array.isArray(dimensions) ? dimensions : (dimensions ? [dimensions] : []);
    
    const data = await req.analyticsCore.getRealtimeData({
      metrics: metricArray,
      dimensions: dimensionArray
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        metrics: metricArray,
        dimensions: dimensionArray,
        timestamp: new Date().toISOString(),
        type: 'realtime'
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

// GET /api/analytics/traffic-sources - Traffic source analysis
router.get('/traffic-sources', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: dateError
      });
    }
    
    const data = await req.analyticsCore.getTrafficSources({
      startDate,
      endDate,
      limit: Math.min(parseInt(limit) || 100, 1000)
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        dateRange: { startDate, endDate },
        limit: parseInt(limit) || 100,
        timestamp: new Date().toISOString(),
        type: 'traffic_sources'
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

// GET /api/analytics/demographics - User demographics
router.get('/demographics', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: dateError
      });
    }
    
    const data = await req.analyticsCore.getUserDemographics({
      startDate,
      endDate,
      limit: Math.min(parseInt(limit) || 100, 1000)
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        dateRange: { startDate, endDate },
        limit: parseInt(limit) || 100,
        timestamp: new Date().toISOString(),
        type: 'demographics'
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

// GET /api/analytics/pages - Page performance metrics
router.get('/pages', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: dateError
      });
    }
    
    const data = await req.analyticsCore.getPagePerformance({
      startDate,
      endDate,
      limit: Math.min(parseInt(limit) || 100, 1000)
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        dateRange: { startDate, endDate },
        limit: parseInt(limit) || 100,
        timestamp: new Date().toISOString(),
        type: 'page_performance'
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

// GET /api/analytics/conversions - Conversion data
router.get('/conversions', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: dateError
      });
    }
    
    const data = await req.analyticsCore.getConversionData({
      startDate,
      endDate,
      limit: Math.min(parseInt(limit) || 100, 1000)
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        dateRange: { startDate, endDate },
        limit: parseInt(limit) || 100,
        timestamp: new Date().toISOString(),
        type: 'conversions'
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

// GET /api/analytics/campaigns - Campaign performance
router.get('/campaigns', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: dateError
      });
    }
    
    const data = await req.analyticsCore.getCampaignPerformance({
      startDate,
      endDate,
      limit: Math.min(parseInt(limit) || 100, 1000)
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        dateRange: { startDate, endDate },
        limit: parseInt(limit) || 100,
        timestamp: new Date().toISOString(),
        type: 'campaigns'
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

// GET /api/analytics/devices - Device breakdown
router.get('/devices', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: dateError
      });
    }
    
    const data = await req.analyticsCore.getDeviceBreakdown({
      startDate,
      endDate,
      limit: Math.min(parseInt(limit) || 100, 1000)
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        dateRange: { startDate, endDate },
        limit: parseInt(limit) || 100,
        timestamp: new Date().toISOString(),
        type: 'devices'
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

// GET /api/analytics/geographic - Geographic distribution
router.get('/geographic', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: dateError
      });
    }
    
    const data = await req.analyticsCore.getGeographicData({
      startDate,
      endDate,
      limit: Math.min(parseInt(limit) || 100, 1000)
    });
    
    res.json({
      success: true,
      data,
      metadata: {
        dateRange: { startDate, endDate },
        limit: parseInt(limit) || 100,
        timestamp: new Date().toISOString(),
        type: 'geographic'
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

// GET /api/analytics/metadata - Available dimensions and metrics
router.get('/metadata', async (req, res) => {
  try {
    const data = await req.analyticsCore.getMetadata();
    
    res.json({
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        type: 'metadata'
      }
    });
    
  } catch (error) {
    handleAnalyticsError(error, res);
  }
});

export default router;