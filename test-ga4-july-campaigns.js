import dotenv from 'dotenv';
import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

dotenv.config();

async function getJuly2025CampaignData() {
  try {
    console.log('🔍 Fetching GA4 Campaign Data for July 2025...\n');
    
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Query for July 2025 (full month)
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);
    
    // Query GA4 for campaign data with engagement rate (to calculate bounce rate)
    const campaignData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName'],
      metrics: ['sessions', 'engagementRate', 'totalUsers', 'conversions'],
      startDate,
      endDate,
      dimensionFilter: {
        notExpression: {
          filter: {
            fieldName: 'sessionCampaignName',
            inListFilter: {
              values: ['(not set)', '(direct)', '(referral)', '(organic)', '(none)']
            }
          }
        }
      }
    });
    
    console.log('📊 GA4 Campaign Performance for July 2025:\n');
    console.log('=' .repeat(80));
    
    if (campaignData && campaignData.rows) {
      // Filter to only show the 3 main Google Ads campaigns
      const mainCampaigns = ['Custom & Corporate Gifts', 'Lanyards', 'EP | DSA 10 | SG'];
      
      campaignData.rows.forEach(row => {
        const campaignName = row.dimensionValues[0]?.value;
        
        // Only show the 3 main campaigns
        if (mainCampaigns.includes(campaignName)) {
          const sessions = parseInt(row.metricValues[0]?.value || 0);
          const engagementRate = parseFloat(row.metricValues[1]?.value || 0);
          const totalUsers = parseInt(row.metricValues[2]?.value || 0);
          const conversions = parseInt(row.metricValues[3]?.value || 0);
          
          // Calculate bounce rate from engagement rate
          const bounceRate = 100 - (engagementRate * 100);
          
          console.log(`📍 Campaign: "${campaignName}"`);
          console.log(`   Sessions: ${sessions.toLocaleString()}`);
          console.log(`   Bounce Rate: ${bounceRate.toFixed(2)}%`);
          console.log(`   Engagement Rate: ${(engagementRate * 100).toFixed(2)}%`);
          console.log(`   Total Users: ${totalUsers.toLocaleString()}`);
          console.log(`   Conversions: ${conversions}`);
          console.log('');
        }
      });
      
      // Also show any other campaigns found
      console.log('📌 Other campaigns found in July 2025:');
      campaignData.rows.forEach(row => {
        const campaignName = row.dimensionValues[0]?.value;
        if (!mainCampaigns.includes(campaignName)) {
          const sessions = parseInt(row.metricValues[0]?.value || 0);
          console.log(`   - ${campaignName}: ${sessions} sessions`);
        }
      });
      
      console.log('\n' + '=' .repeat(80));
      console.log('✅ Data retrieved directly from GA4 API\n');
      
      // Summary table
      console.log('📊 SUMMARY TABLE - July 2025 Google Ads Campaigns:');
      console.log('┌─────────────────────────────┬──────────┬─────────────┐');
      console.log('│ Campaign                    │ Sessions │ Bounce Rate │');
      console.log('├─────────────────────────────┼──────────┼─────────────┤');
      
      campaignData.rows.forEach(row => {
        const campaignName = row.dimensionValues[0]?.value;
        if (mainCampaigns.includes(campaignName)) {
          const sessions = parseInt(row.metricValues[0]?.value || 0);
          const engagementRate = parseFloat(row.metricValues[1]?.value || 0);
          const bounceRate = 100 - (engagementRate * 100);
          
          const paddedName = campaignName.padEnd(27);
          const paddedSessions = sessions.toString().padStart(8);
          const paddedBounce = `${bounceRate.toFixed(2)}%`.padStart(11);
          
          console.log(`│ ${paddedName} │ ${paddedSessions} │ ${paddedBounce} │`);
        }
      });
      
      console.log('└─────────────────────────────┴──────────┴─────────────┘');
      
    } else {
      console.log('❌ No campaign data found for July 2025');
    }
    
  } catch (error) {
    console.error('❌ Error fetching GA4 data:', error);
    console.error('Error details:', error.message);
  }
}

// Run the script
getJuly2025CampaignData();