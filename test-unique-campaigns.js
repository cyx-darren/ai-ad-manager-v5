import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function listUniqueCampaigns() {
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    const startDate = '2025-07-13';
    const endDate = '2025-08-12';
    
    console.log('🎯 Fetching UNIQUE CAMPAIGNS from GA4 Paid Traffic');
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    console.log('🔍 Channels: Paid Search, Display, Paid Video\n');
    console.log('═'.repeat(70));
    
    // Query using sessionCampaignName which worked
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
      console.log('❌ No campaign data found');
      return;
    }
    
    // Count unique campaigns
    const uniqueCampaigns = new Set();
    const campaignDetails = new Map();
    
    campaignData.rows.forEach(row => {
      const campaign = row.dimensionValues?.[0]?.value;
      const channel = row.dimensionValues?.[1]?.value;
      const sessions = parseInt(row.metricValues?.[0]?.value || 0);
      const users = parseInt(row.metricValues?.[1]?.value || 0);
      
      // Only count campaigns with actual sessions and exclude (not set)
      if (campaign && campaign !== '(not set)' && sessions > 0) {
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
    
    console.log(`\n✅ FOUND ${uniqueCampaigns.size} UNIQUE CAMPAIGNS:\n`);
    
    // Sort by total sessions and display
    const sortedCampaigns = Array.from(campaignDetails.values())
      .sort((a, b) => b.totalSessions - a.totalSessions);
    
    sortedCampaigns.forEach((campaign, index) => {
      console.log(`📊 Campaign #${index + 1}: "${campaign.name}"`);
      console.log(`   └─ Total Sessions: ${campaign.totalSessions.toLocaleString()}`);
      console.log(`   └─ Total Users: ${campaign.totalUsers.toLocaleString()}`);
      console.log(`   └─ Channels breakdown:`);
      
      campaign.channels.forEach(ch => {
        console.log(`      • ${ch.channel}: ${ch.sessions.toLocaleString()} sessions, ${ch.users.toLocaleString()} users`);
      });
      console.log('');
    });
    
    console.log('═'.repeat(70));
    console.log('\n📈 SUMMARY:');
    console.log(`   • Total Unique Campaigns: ${uniqueCampaigns.size}`);
    console.log(`   • Campaign Names: ${Array.from(uniqueCampaigns).map(c => `"${c}"`).join(', ')}`);
    console.log(`   • Total Sessions (all campaigns): ${sortedCampaigns.reduce((sum, c) => sum + c.totalSessions, 0).toLocaleString()}`);
    console.log(`   • Total Users (all campaigns): ${sortedCampaigns.reduce((sum, c) => sum + c.totalUsers, 0).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listUniqueCampaigns();