import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function testFixedCampaignCount() {
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    const startDate = '2025-07-13';
    const endDate = '2025-08-12';
    
    console.log('🔍 Testing FIXED campaign count logic');
    console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);
    
    // Same query as in the fixed extractCampaignCount function
    const campaignData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName', 'sessionDefaultChannelGroup'],
      metrics: ['sessions'],
      startDate,
      endDate,
      dimensionFilter: {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          inListFilter: {
            values: ['Paid Search', 'Display', 'Paid Video']
          }
        }
      }
    });
    
    if (!campaignData || !campaignData.rows) {
      console.log('❌ No campaign data found');
      return;
    }
    
    // Count unique campaigns with the FIXED logic
    const uniqueCampaigns = new Set();
    const excludedValues = ['(not set)', '(referral)', '(direct)', '(organic)', '(none)'];
    
    console.log('📋 Processing campaign data:\n');
    
    campaignData.rows.forEach(row => {
      const campaign = row.dimensionValues?.[0]?.value;
      const channel = row.dimensionValues?.[1]?.value;
      const sessions = parseInt(row.metricValues?.[0]?.value || 0);
      
      const isExcluded = excludedValues.includes(campaign);
      const willCount = campaign && !isExcluded && sessions > 0;
      
      console.log(`   ${willCount ? '✅' : '❌'} "${campaign}" | ${channel} | ${sessions} sessions ${isExcluded ? '(EXCLUDED - placeholder)' : ''}`);
      
      if (willCount) {
        uniqueCampaigns.add(campaign);
      }
    });
    
    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ RESULT WITH FIX:');
    console.log(`   • Total REAL Campaigns: ${uniqueCampaigns.size}`);
    console.log(`   • Campaign Names: ${Array.from(uniqueCampaigns).map(c => `"${c}"`).join(', ')}`);
    
    console.log('\n📊 This is what will show in the dashboard:');
    console.log(`   "Total Campaigns" metric card: ${uniqueCampaigns.size}`);
    console.log(`   (No longer counting "(referral)" as a campaign)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFixedCampaignCount();