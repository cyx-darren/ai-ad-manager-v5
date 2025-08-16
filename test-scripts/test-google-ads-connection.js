import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testGoogleAdsConnection() {
  console.log('🔍 Testing Google Ads API Connection...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('✓ Developer Token:', process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('✓ Client ID:', process.env.GOOGLE_ADS_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('✓ Client Secret:', process.env.GOOGLE_ADS_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('✓ Refresh Token:', process.env.GOOGLE_ADS_REFRESH_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('✓ Customer ID:', process.env.GOOGLE_ADS_CUSTOMER_ID || '❌ Missing');
  console.log('✓ Login Customer ID:', process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '❌ Missing');
  console.log('\n');

  try {
    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    });

    // Create customer instance
    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
    });

    console.log('🔗 Attempting to connect to Google Ads API...\n');

    // Test query - get account information
    const query = `
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer
      LIMIT 1
    `;

    const response = await customer.query(query);
    
    if (response && response.length > 0) {
      console.log('✅ SUCCESS! Connected to Google Ads API\n');
      console.log('📊 Account Information:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Account Name: ${response[0].customer.descriptive_name}`);
      console.log(`Customer ID: ${response[0].customer.id}`);
      console.log(`Currency: ${response[0].customer.currency_code}`);
      console.log(`Time Zone: ${response[0].customer.time_zone}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Test getting campaign data (last 7 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log(`📅 Fetching campaign data for ${startDate} to ${endDate}...\n`);

      const campaignQuery = `
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros
        FROM campaign
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        ORDER BY metrics.impressions DESC
        LIMIT 5
      `;

      const campaigns = await customer.query(campaignQuery);
      
      if (campaigns && campaigns.length > 0) {
        console.log('📈 Top Campaigns (Last 7 Days):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        campaigns.forEach((campaign, index) => {
          const cost = (campaign.metrics.cost_micros || 0) / 1000000;
          console.log(`${index + 1}. ${campaign.campaign.name}`);
          console.log(`   Status: ${campaign.campaign.status}`);
          console.log(`   Impressions: ${campaign.metrics.impressions || 0}`);
          console.log(`   Clicks: ${campaign.metrics.clicks || 0}`);
          console.log(`   Cost: $${cost.toFixed(2)}`);
          console.log('');
        });
      } else {
        console.log('ℹ️  No campaign data found for the last 7 days');
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✅ All tests passed! Google Ads API is configured correctly.');
      
    } else {
      console.log('⚠️  Connected but no data returned. Check your account permissions.');
    }

  } catch (error) {
    console.error('❌ ERROR: Failed to connect to Google Ads API\n');
    console.error('Error type:', error.constructor.name);
    console.error('Error details:', error.message || error.toString());
    
    if (error.errors && error.errors.length > 0) {
      console.error('\nGoogle Ads API Errors:');
      error.errors.forEach((e, index) => {
        console.error(`${index + 1}. ${e.error_code?.request_error || e.message}`);
      });
    }
    
    const errorStr = JSON.stringify(error);
    
    if (errorStr.includes('PERMISSION_DENIED')) {
      console.error('\n⚠️  Permission denied. Please check:');
      console.error('1. Your developer token is approved (Basic or Standard access)');
      console.error('2. Your Google Ads account has active campaigns');
      console.error('3. The OAuth credentials have proper scopes');
    } else if (errorStr.includes('INVALID_CUSTOMER_ID')) {
      console.error('\n⚠️  Invalid Customer ID. Please verify:');
      console.error('1. Customer ID is correct (no dashes)');
      console.error('2. Login Customer ID matches your Manager account');
    } else if (errorStr.includes('refresh_token') || errorStr.includes('UNAUTHENTICATED')) {
      console.error('\n⚠️  Authentication failed. Please:');
      console.error('1. Regenerate your refresh token');
      console.error('2. Ensure OAuth client credentials are correct');
    }
    
    console.error('\nFull error object:', JSON.stringify(error, null, 2));
    
    process.exit(1);
  }
}

// Run the test
testGoogleAdsConnection().catch(console.error);