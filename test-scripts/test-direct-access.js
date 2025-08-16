import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testDirectAccess() {
  console.log('🔍 Testing Direct Access to EasyPrint SG Account...\n');
  
  try {
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    });

    // Try direct access to EasyPrint SG (without login_customer_id)
    console.log('Attempting direct access to EasyPrint SG...');
    const directCustomer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID, // EasyPrint SG
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
      // No login_customer_id - direct access
    });

    const query = `
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer
      LIMIT 1
    `;

    const result = await directCustomer.query(query);
    
    if (result && result.length > 0) {
      console.log('✅ SUCCESS! Direct access to EasyPrint SG works!\n');
      console.log('📊 Account Information:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Account Name: ${result[0].customer.descriptive_name}`);
      console.log(`Customer ID: ${result[0].customer.id}`);
      console.log(`Currency: ${result[0].customer.currency_code}`);
      console.log(`Time Zone: ${result[0].customer.time_zone}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Test campaign data
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log(`Testing campaign data (${startDate} to ${endDate})...\n`);

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
        ORDER BY metrics.cost_micros DESC
        LIMIT 10
      `;

      try {
        const campaigns = await directCustomer.query(campaignQuery);
        
        if (campaigns && campaigns.length > 0) {
          console.log('📈 Campaign Data (Last 30 Days):');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          let totalSpend = 0;
          let totalImpressions = 0;
          let totalClicks = 0;
          
          campaigns.forEach((campaign, index) => {
            const cost = (campaign.metrics.cost_micros || 0) / 1000000;
            totalSpend += cost;
            totalImpressions += campaign.metrics.impressions || 0;
            totalClicks += campaign.metrics.clicks || 0;
            
            console.log(`${index + 1}. ${campaign.campaign.name}`);
            console.log(`   Status: ${campaign.campaign.status}`);
            console.log(`   Spend: $${cost.toFixed(2)} SGD`);
            console.log(`   Impressions: ${campaign.metrics.impressions || 0}`);
            console.log(`   Clicks: ${campaign.metrics.clicks || 0}`);
            console.log('');
          });
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📊 TOTALS (Last 30 Days):`);
          console.log(`   Total Spend: $${totalSpend.toFixed(2)} SGD`);
          console.log(`   Total Impressions: ${totalImpressions.toLocaleString()}`);
          console.log(`   Total Clicks: ${totalClicks.toLocaleString()}`);
          if (totalImpressions > 0) {
            const ctr = (totalClicks / totalImpressions * 100).toFixed(2);
            console.log(`   Click-Through Rate: ${ctr}%`);
          }
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          console.log('🎉 Perfect! Google Ads API is working correctly!');
          console.log('\n💡 RECOMMENDATION:');
          console.log('Since direct access works, update your .env file:');
          console.log('- Remove GOOGLE_ADS_LOGIN_CUSTOMER_ID or set it to same as CUSTOMER_ID');
          console.log('- Keep GOOGLE_ADS_CUSTOMER_ID=5962724983');
          
        } else {
          console.log('ℹ️  No campaign data found for the date range');
          console.log('✅ But connection to account is working!');
        }
        
      } catch (campaignError) {
        console.log('✅ Account access works, but campaign query failed:');
        console.log(campaignError.errors?.[0]?.message || campaignError.message);
      }

    } else {
      console.log('⚠️  Connected but no account data returned');
    }

  } catch (error) {
    console.error('❌ Direct access failed:');
    console.error(error.errors?.[0]?.message || error.message);
    
    console.error('\nThis means:');
    console.error('1. The refresh token was not generated for the correct account');
    console.error('2. The account that generated the token does not have access to EasyPrint SG');
    console.error('3. You need to regenerate the refresh token using an account that can access EasyPrint SG');
  }
}

testDirectAccess().catch(console.error);