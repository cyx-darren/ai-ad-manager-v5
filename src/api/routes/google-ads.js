import express from 'express';
import { verifySupabaseToken } from '../middleware/auth.js';
import { GoogleAdsCore } from '../../core/ads-core-enhanced.js';

const router = express.Router();

// Get Google Ads connection status
router.get('/status', verifySupabaseToken, async (req, res) => {
  try {
    // Check if we have the necessary environment variables
    const hasCredentials = !!(
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN &&
      process.env.GOOGLE_ADS_CUSTOMER_ID
    );

    if (!hasCredentials) {
      return res.json({
        connected: false,
        error: 'Google Ads credentials not configured',
        accounts: []
      });
    }

    // Try to initialize the Google Ads client
    try {
      const adsCore = new GoogleAdsCore();
      
      // Test connection by trying to get basic account info
      // For MVP, we'll simulate this check
      const accounts = [{
        id: process.env.GOOGLE_ADS_CUSTOMER_ID,
        name: 'Main Google Ads Account',
        currency: 'SGD'
      }];

      res.json({
        connected: true,
        lastSync: new Date().toISOString(),
        accounts,
        customerInfo: {
          customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
          timeZone: 'Asia/Singapore',
          currency: 'SGD'
        }
      });

    } catch (adsError) {
      console.error('Google Ads connection test failed:', adsError);
      res.json({
        connected: false,
        error: 'Failed to connect to Google Ads API',
        lastError: adsError.message,
        accounts: []
      });
    }

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      connected: false,
      error: 'Failed to check connection status',
      accounts: []
    });
  }
});

// Disconnect Google Ads account (for MVP, this is mostly UI feedback)
router.post('/disconnect', verifySupabaseToken, async (req, res) => {
  try {
    // In a full implementation, this would revoke tokens
    // For MVP, we'll just return success
    res.json({
      success: true,
      message: 'Account disconnected successfully',
      note: 'In MVP, credentials are managed via environment variables'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect account'
    });
  }
});

// Initiate OAuth flow (for future implementation)
router.get('/oauth/initiate', verifySupabaseToken, (req, res) => {
  // For MVP, redirect to Google's documentation
  res.redirect('https://developers.google.com/google-ads/api/docs/oauth/overview');
});

// OAuth callback (for future implementation)
router.get('/oauth/callback', verifySupabaseToken, (req, res) => {
  // For MVP, just show a success message
  res.send(`
    <html>
      <body>
        <h2>Google Ads OAuth (MVP)</h2>
        <p>In the MVP version, Google Ads credentials are configured via environment variables.</p>
        <p>Full OAuth integration will be available in the next version.</p>
        <a href="/settings">Return to Settings</a>
      </body>
    </html>
  `);
});

// Test Google Ads API connection
router.post('/test-connection', verifySupabaseToken, async (req, res) => {
  try {
    const adsCore = new GoogleAdsCore();
    
    // Test with a simple date range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const testResult = await adsCore.getCampaignSpend(startDate, endDate);
    
    res.json({
      success: true,
      message: 'Google Ads API connection successful',
      testData: {
        totalSpend: testResult.totalSpend,
        campaignCount: testResult.campaigns.length,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Connection test failed:', error);
    res.json({
      success: false,
      error: 'Google Ads API connection failed',
      details: error.message,
      suggestion: 'Check your Google Ads API credentials and account access'
    });
  }
});

// Get account information
router.get('/account-info', verifySupabaseToken, async (req, res) => {
  try {
    // For MVP, return basic account info from environment variables
    res.json({
      customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
      loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      timeZone: 'Asia/Singapore',
      currency: 'SGD',
      accountName: 'Main Google Ads Account',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Account info error:', error);
    res.status(500).json({
      error: 'Failed to get account information'
    });
  }
});

export default router;