import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function listCampaigns() {
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Same date range as shown in dashboard
    const startDate = '2025-07-13';
    const endDate = '2025-08-12';
    
    console.log('🔍 Fetching campaign data from GA4...');
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    console.log('🎯 Filtering for Paid Channels: Paid Search, Display, Paid Video\n');
    
    // Query GA4 for campaign data from paid channels
    const campaignData = await analyticsCore.queryAnalytics({
      dimensions: ['campaign', 'sessionDefaultChannelGroup'],
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
    
    // Process and group campaign data
    const campaignMap = new Map();
    
    campaignData.rows.forEach(row => {
      const campaign = row.dimensionValues?.[0]?.value;
      const channelGroup = row.dimensionValues?.[1]?.value;
      const sessions = parseInt(row.metricValues?.[0]?.value || 0);
      const users = parseInt(row.metricValues?.[1]?.value || 0);
      
      // Only count campaigns with actual sessions and exclude (not set)
      if (campaign && campaign !== '(not set)' && sessions > 0) {
        if (!campaignMap.has(campaign)) {
          campaignMap.set(campaign, {
            name: campaign,
            channels: new Set(),
            totalSessions: 0,
            totalUsers: 0
          });
        }
        
        const campaignInfo = campaignMap.get(campaign);
        campaignInfo.channels.add(channelGroup);
        campaignInfo.totalSessions += sessions;
        campaignInfo.totalUsers += users;
      }
    });
    
    // Convert to array and sort by sessions
    const campaigns = Array.from(campaignMap.values()).sort((a, b) => b.totalSessions - a.totalSessions);
    
    console.log(`✅ Found ${campaigns.length} active paid campaigns:\n`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    
    campaigns.forEach((campaign, index) => {
      console.log(`📊 Campaign #${index + 1}: "${campaign.name}"`);
      console.log(`   └─ Channels: ${Array.from(campaign.channels).join(', ')}`);
      console.log(`   └─ Sessions: ${campaign.totalSessions.toLocaleString()}`);
      console.log(`   └─ Users: ${campaign.totalUsers.toLocaleString()}`);
      console.log(`   └─ Avg Sessions/User: ${(campaign.totalSessions / campaign.totalUsers).toFixed(2)}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    console.log('📈 Summary Statistics:');
    console.log(`   • Total Campaigns: ${campaigns.length}`);
    console.log(`   • Total Sessions: ${campaigns.reduce((sum, c) => sum + c.totalSessions, 0).toLocaleString()}`);
    console.log(`   • Total Users: ${campaigns.reduce((sum, c) => sum + c.totalUsers, 0).toLocaleString()}`);
    
    // Also show all campaigns without filtering to see the full picture
    console.log('\n\n📋 ALL CAMPAIGNS (including non-paid channels):');
    console.log('───────────────────────────────────────────────\n');
    
    const allCampaigns = await analyticsCore.queryAnalytics({
      dimensions: ['campaign', 'sessionDefaultChannelGroup'],
      metrics: ['sessions'],
      startDate,
      endDate
    });
    
    if (allCampaigns && allCampaigns.rows) {
      const allCampaignMap = new Map();
      
      allCampaigns.rows.forEach(row => {
        const campaign = row.dimensionValues?.[0]?.value;
        const channel = row.dimensionValues?.[1]?.value;
        const sessions = parseInt(row.metricValues?.[0]?.value || 0);
        
        if (campaign && sessions > 0) {
          if (!allCampaignMap.has(campaign)) {
            allCampaignMap.set(campaign, { name: campaign, channels: new Map(), total: 0 });
          }
          const info = allCampaignMap.get(campaign);
          info.channels.set(channel, sessions);
          info.total += sessions;
        }
      });
      
      const allCampaignsList = Array.from(allCampaignMap.values()).sort((a, b) => b.total - a.total);
      
      allCampaignsList.forEach(campaign => {
        const isPaid = Array.from(campaign.channels.keys()).some(ch => 
          ['Paid Search', 'Display', 'Paid Video'].includes(ch)
        );
        
        console.log(`${isPaid ? '💰' : '  '} "${campaign.name}" (${campaign.total.toLocaleString()} sessions)`);
        campaign.channels.forEach((sessions, channel) => {
          const isPaidChannel = ['Paid Search', 'Display', 'Paid Video'].includes(channel);
          console.log(`     ${isPaidChannel ? '→' : '·'} ${channel}: ${sessions.toLocaleString()}`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching campaigns:', error);
  }
}

listCampaigns();