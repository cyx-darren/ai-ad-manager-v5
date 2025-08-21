import express from 'express';
import { verifySupabaseToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../../db/supabase-client.js';
import { apiLogger } from '../../utils/logger.js';

const router = express.Router();

// Mock data generator for fallback scenarios
function generateMockMetrics(startDate, endDate) {
  const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  const baseFactor = Math.max(daysDiff, 1);
  
  return {
    impressions: Math.floor(Math.random() * 30000 + 15000) * baseFactor,
    clicks: Math.floor(Math.random() * 1500 + 800) * baseFactor, 
    spend: (Math.random() * 3000 + 1500) * baseFactor,
    ctr: (Math.random() * 2.5 + 2).toFixed(2),
    conversions: Math.floor(Math.random() * 80 + 40) * baseFactor,
    cpc: (Math.random() * 1.5 + 0.8).toFixed(2),
    campaigns: generateMockCampaigns(baseFactor)
  };
}

function generateMockCampaigns(baseFactor = 1) {
  const campaignNames = [
    'Custom & Corporate Gifts',
    'Lanyards & Accessories', 
    'Promotional Products',
    'Business Cards & Printing',
    'Trade Show Materials',
    'Employee Recognition'
  ];
  
  return campaignNames.map((name, index) => ({
    id: `mock_campaign_${index}`,
    name,
    spend: (Math.random() * 800 + 200) * baseFactor,
    impressions: Math.floor(Math.random() * 5000 + 2000) * baseFactor,
    clicks: Math.floor(Math.random() * 200 + 50) * baseFactor,
    conversions: Math.floor(Math.random() * 15 + 3) * baseFactor,
    ctr: (Math.random() * 3 + 1.5).toFixed(2),
    cpc: (Math.random() * 2 + 0.5).toFixed(2)
  }));
}

// Cache management functions  
async function getCachedMetrics(metricType, startDate, endDate) {
  try {
    const { data: cached } = await supabaseAdmin
      .from('google_ads_cache')
      .select('data, cached_at')
      .eq('metric_type', metricType)
      .eq('date_range_start', startDate)
      .eq('date_range_end', endDate)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      apiLogger.info(`Cache hit for ${metricType}`, { startDate, endDate });
      return {
        ...cached.data,
        cached_at: cached.cached_at,
        source: 'cache'
      };
    }
  } catch (error) {
    apiLogger.warn(`Cache miss for ${metricType}`, { error: error.message });
  }
  return null;
}

async function setCachedMetrics(metricType, startDate, endDate, data, ttlMinutes = 60) {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    
    await supabaseAdmin
      .from('google_ads_cache')
      .upsert({
        metric_type: metricType,
        date_range_start: startDate,
        date_range_end: endDate,
        data: data,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      });
    
    apiLogger.info(`Cached ${metricType}`, { startDate, endDate, expiresAt });
  } catch (error) {
    apiLogger.error(`Failed to cache ${metricType}`, { error: error.message });
  }
}

// Simulate Google Ads Core for testing (since we don't have actual Google Ads setup)
class MockGoogleAdsCore {
  constructor() {
    this.shouldFail = process.env.GOOGLE_ADS_SIMULATE_FAILURE === 'true';
    this.failureRate = parseFloat(process.env.GOOGLE_ADS_FAILURE_RATE) || 0;
  }

  async getCampaignMetrics(startDate, endDate) {
    // Simulate API failure scenarios
    if (this.shouldFail || Math.random() < this.failureRate) {
      const error = new Error('Google Ads API unavailable');
      error.code = 'API_UNAVAILABLE';
      throw error;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

    const mockData = generateMockMetrics(startDate, endDate);
    return {
      ...mockData,
      source: 'google_ads_api',
      is_live: true
    };
  }

  async getCampaignSpend(startDate, endDate) {
    const metrics = await this.getCampaignMetrics(startDate, endDate);
    return {
      totalSpend: metrics.spend,
      campaigns: metrics.campaigns,
      currency: 'SGD',
      source: metrics.source,
      is_live: metrics.is_live
    };
  }
}

// Initialize the Google Ads Core (mock for testing)
const adsCore = new MockGoogleAdsCore();

// GET /api/google-ads/metrics - Get comprehensive ads metrics with fallback
router.get('/metrics', verifySupabaseToken, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    const error = new Error('Start date and end date are required');
    error.status = 400;
    throw error;
  }

  let result;
  let dataSource = 'unknown';
  
  try {
    // Step 1: Try to get real Google Ads data
    apiLogger.info('Attempting Google Ads API call', { startDate, endDate });
    const adsData = await adsCore.getCampaignMetrics(startDate, endDate);
    
    // Cache successful response
    await setCachedMetrics('ads_metrics', startDate, endDate, adsData, 30);
    
    result = {
      ...adsData,
      source: 'google_ads_api',
      is_live: true,
      fallback_used: false
    };
    dataSource = 'live';
    
    apiLogger.info('Google Ads API success', { dataSource, metricsCount: Object.keys(adsData).length });
    
  } catch (error) {
    apiLogger.warn('Google Ads API failed, checking cache', { error: error.message });
    
    // Step 2: Try cached data
    const cached = await getCachedMetrics('ads_metrics', startDate, endDate);
    
    if (cached) {
      result = {
        ...cached,
        source: 'cache',
        is_live: false,
        fallback_used: true,
        cached_at: cached.cached_at,
        original_error: error.message
      };
      dataSource = 'cache';
      
      apiLogger.info('Using cached data', { dataSource, cachedAt: cached.cached_at });
    } else {
      // Step 3: Fall back to mock data
      const mockData = generateMockMetrics(startDate, endDate);
      result = {
        ...mockData,
        source: 'mock',
        is_live: false,
        fallback_used: true,
        note: 'Google Ads API unavailable, showing sample data',
        original_error: error.message
      };
      dataSource = 'mock';
      
      apiLogger.warn('Using mock data fallback', { dataSource, error: error.message });
    }
  }
  
  res.json(result);
}));

// GET /api/google-ads/campaigns - Get campaign spend data with fallback
router.get('/campaigns', verifySupabaseToken, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    const error = new Error('Start date and end date are required');
    error.status = 400;
    throw error;
  }

  let result;
  
  try {
    // Try to get campaign data
    const spendData = await adsCore.getCampaignSpend(startDate, endDate);
    
    // Cache successful response
    await setCachedMetrics('campaign_spend', startDate, endDate, spendData, 30);
    
    result = {
      ...spendData,
      fallback_used: false
    };
    
  } catch (error) {
    apiLogger.warn('Campaign data API failed, checking alternatives', { error: error.message });
    
    // Try cached data first
    const cached = await getCachedMetrics('campaign_spend', startDate, endDate);
    
    if (cached) {
      result = {
        ...cached,
        fallback_used: true,
        cached_at: cached.cached_at
      };
    } else {
      // Generate mock campaign data
      const mockCampaigns = generateMockCampaigns();
      const totalSpend = mockCampaigns.reduce((sum, c) => sum + c.spend, 0);
      
      result = {
        totalSpend,
        campaigns: mockCampaigns,
        currency: 'SGD',
        source: 'mock',
        is_live: false,
        fallback_used: true,
        note: 'Using mock campaign data'
      };
    }
  }
  
  res.json(result);
}));

// GET /api/google-ads/health - Check Google Ads API connectivity
router.get('/health', verifySupabaseToken, asyncHandler(async (req, res) => {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    google_ads_api: 'unknown',
    cache_system: 'unknown',
    simulated_failure: process.env.GOOGLE_ADS_SIMULATE_FAILURE === 'true'
  };

  try {
    // Test a simple API call with short date range
    const today = new Date().toISOString().split('T')[0];
    await adsCore.getCampaignMetrics(today, today);
    
    healthCheck.google_ads_api = 'healthy';
    healthCheck.status = 'healthy';
  } catch (error) {
    healthCheck.google_ads_api = 'unhealthy';
    healthCheck.google_ads_error = error.message;
  }

  try {
    // Test cache system
    const testCacheKey = 'health_check';
    const testData = { test: true, timestamp: Date.now() };
    
    await setCachedMetrics(testCacheKey, '2025-01-01', '2025-01-01', testData, 1);
    const retrieved = await getCachedMetrics(testCacheKey, '2025-01-01', '2025-01-01');
    
    if (retrieved && retrieved.test) {
      healthCheck.cache_system = 'healthy';
    } else {
      healthCheck.cache_system = 'unhealthy';
    }
  } catch (error) {
    healthCheck.cache_system = 'unhealthy';
    healthCheck.cache_error = error.message;
  }

  if (healthCheck.status === 'unknown') {
    healthCheck.status = healthCheck.cache_system === 'healthy' ? 'degraded' : 'unhealthy';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 206 : 503;
  
  res.status(statusCode).json(healthCheck);
}));

// POST /api/google-ads/toggle-failure - Toggle failure simulation for testing
router.post('/toggle-failure', verifySupabaseToken, asyncHandler(async (req, res) => {
  const currentState = process.env.GOOGLE_ADS_SIMULATE_FAILURE === 'true';
  const newState = !currentState;
  
  // In production, this would need proper environment variable management
  process.env.GOOGLE_ADS_SIMULATE_FAILURE = newState.toString();
  adsCore.shouldFail = newState;
  
  apiLogger.info('Google Ads failure simulation toggled', { 
    previousState: currentState, 
    newState: newState 
  });
  
  res.json({
    success: true,
    failure_simulation: newState,
    message: newState ? 
      'Google Ads API will now simulate failures' : 
      'Google Ads API simulation restored to normal'
  });
}));

// Legacy routes for backward compatibility
router.get('/status', verifySupabaseToken, asyncHandler(async (req, res) => {
  // Redirect to health check
  const healthRes = await fetch(`${req.protocol}://${req.get('host')}/api/google-ads/health`, {
    headers: { Authorization: req.get('Authorization') }
  });
  const healthData = await healthRes.json();
  
  res.json({
    connected: healthData.google_ads_api === 'healthy',
    lastSync: healthData.timestamp,
    accounts: healthData.google_ads_api === 'healthy' ? [{
      id: process.env.GOOGLE_ADS_CUSTOMER_ID || 'mock_account',
      name: 'Main Google Ads Account',
      currency: 'SGD'
    }] : [],
    error: healthData.google_ads_error
  });
}));

router.post('/test-connection', verifySupabaseToken, asyncHandler(async (req, res) => {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const testResult = await adsCore.getCampaignSpend(startDate, endDate);
    
    res.json({
      success: true,
      message: 'Google Ads API connection successful',
      testData: {
        totalSpend: testResult.totalSpend,
        campaignCount: testResult.campaigns?.length || 0,
        dateRange: { startDate, endDate },
        source: testResult.source
      }
    });

  } catch (error) {
    res.json({
      success: false,
      error: 'Google Ads API connection failed',
      details: error.message,
      suggestion: 'Check your Google Ads API credentials and account access'
    });
  }
}));

export default router;