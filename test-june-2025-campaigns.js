import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function getJune2025Campaigns() {
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // June 2025 date range
    const startDate = '2025-06-01';
    const endDate = '2025-06-30';
    
    console.log('🎯 JUNE 2025 CAMPAIGN ANALYSIS');
    console.log('═'.repeat(70));
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    console.log('🔍 Channels: Paid Search, Display, Paid Video\n');
    
    // Query GA4 for campaign data from paid channels
    const campaignData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName', 'sessionDefaultChannelGroup'],
      metrics: ['sessions', 'totalUsers'],
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
      console.log('❌ No campaign data found for June 2025');
      return;
    }
    
    // Process campaign data
    const uniqueCampaigns = new Set();
    const campaignDetails = new Map();
    const excludedValues = ['(not set)', '(referral)', '(direct)', '(organic)', '(none)'];
    
    console.log('📊 RAW DATA FROM GA4:\n');
    
    campaignData.rows.forEach(row => {
      const campaign = row.dimensionValues?.[0]?.value;
      const channel = row.dimensionValues?.[1]?.value;
      const sessions = parseInt(row.metricValues?.[0]?.value || 0);
      const users = parseInt(row.metricValues?.[1]?.value || 0);
      
      const isExcluded = excludedValues.includes(campaign);
      const willCount = campaign && !isExcluded && sessions > 0;
      
      console.log(`   ${willCount ? '✅' : '❌'} "${campaign}" | ${channel} | ${sessions} sessions | ${users} users ${isExcluded ? '(EXCLUDED)' : ''}`);
      
      if (willCount) {
        uniqueCampaigns.add(campaign);
        
        if (!campaignDetails.has(campaign)) {
          campaignDetails.set(campaign, {
            name: campaign,
            channels: [],
            totalSessions: 0,
            totalUsers: 0
          });
        }
        
        const details = campaignDetails.get(campaign);
        details.channels.push({ channel, sessions, users });
        details.totalSessions += sessions;
        details.totalUsers += users;
      }
    });
    
    console.log('\n' + '═'.repeat(70));
    console.log('\n🎯 JUNE 2025 UNIQUE CAMPAIGNS (EXCLUDING PLACEHOLDERS):\n');
    
    // Sort by total sessions and display
    const sortedCampaigns = Array.from(campaignDetails.values())
      .sort((a, b) => b.totalSessions - a.totalSessions);
    
    sortedCampaigns.forEach((campaign, index) => {
      console.log(`📈 Campaign #${index + 1}: "${campaign.name}"`);
      console.log(`   └─ Total Sessions: ${campaign.totalSessions.toLocaleString()}`);
      console.log(`   └─ Total Users: ${campaign.totalUsers.toLocaleString()}`);
      console.log(`   └─ Channel Breakdown:`);
      
      campaign.channels.forEach(ch => {
        console.log(`      • ${ch.channel}: ${ch.sessions.toLocaleString()} sessions, ${ch.users.toLocaleString()} users`);
      });
      console.log('');
    });
    
    console.log('═'.repeat(70));
    console.log('\n✅ JUNE 2025 FINAL ANSWER:\n');
    console.log(`   📊 Total Campaigns: ${uniqueCampaigns.size}`);
    console.log(`   📝 Campaign Names:`);
    sortedCampaigns.forEach((campaign, index) => {
      console.log(`      ${index + 1}. "${campaign.name}"`);
    });
    console.log(`\n   📈 Total Paid Traffic:`);
    console.log(`      • Sessions: ${sortedCampaigns.reduce((sum, c) => sum + c.totalSessions, 0).toLocaleString()}`);
    console.log(`      • Users: ${sortedCampaigns.reduce((sum, c) => sum + c.totalUsers, 0).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getJune2025Campaigns();