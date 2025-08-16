import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function debugGA4Query() {
  try {
    console.log('🔍 Debugging GA4 Query for Last 7 Days\n');
    
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Calculate last 7 days date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // 7 days including today
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    console.log(`Date Range: ${startDateStr} to ${endDateStr}\n`);
    
    // Query 1: Get all traffic without filtering
    console.log('1️⃣ ALL TRAFFIC (No filters):\n');
    const allTraffic = await analyticsCore.queryAnalytics({
      dimensions: ['defaultChannelGroup'],
      metrics: ['sessions', 'totalUsers'],
      startDate: startDateStr,
      endDate: endDateStr,
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ]
    });
    
    if (allTraffic && allTraffic.rows) {
      let totalAllSessions = 0;
      allTraffic.rows.forEach(row => {
        const channel = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        console.log(`  ${channel}: ${sessions} sessions, ${users} users`);
        totalAllSessions += sessions;
      });
      console.log(`  TOTAL: ${totalAllSessions} sessions\n`);
    }
    
    // Query 2: With the current filter (as used in dashboard)
    console.log('2️⃣ FILTERED TRAFFIC (Current dashboard filter):\n');
    const filteredTraffic = await analyticsCore.queryAnalytics({
      dimensions: ['date', 'defaultChannelGroup'],
      metrics: ['sessions', 'totalUsers', 'bounceRate'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        filter: {
          fieldName: 'defaultChannelGroup',
          inListFilter: {
            values: ['Paid Search', 'Display', 'Paid Video']
          }
        }
      }
    });
    
    if (filteredTraffic && filteredTraffic.rows) {
      let totalFilteredSessions = 0;
      let totalFilteredUsers = 0;
      const channelTotals = {};
      
      filteredTraffic.rows.forEach(row => {
        const date = row.dimensionValues[0].value;
        const channel = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        if (!channelTotals[channel]) {
          channelTotals[channel] = { sessions: 0, users: 0 };
        }
        channelTotals[channel].sessions += sessions;
        channelTotals[channel].users += users;
        
        totalFilteredSessions += sessions;
        totalFilteredUsers += users;
      });
      
      Object.entries(channelTotals).forEach(([channel, data]) => {
        console.log(`  ${channel}: ${data.sessions} sessions, ${data.users} users`);
      });
      console.log(`  TOTAL: ${totalFilteredSessions} sessions, ${totalFilteredUsers} users\n`);
    }
    
    // Query 3: Check sessionSource to see actual Google Ads traffic
    console.log('3️⃣ GOOGLE ADS TRAFFIC (by source):\n');
    const googleAdsTraffic = await analyticsCore.queryAnalytics({
      dimensions: ['sessionSource', 'sessionMedium', 'sessionCampaignName'],
      metrics: ['sessions', 'totalUsers'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        filter: {
          fieldName: 'sessionSource',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'google'
          }
        }
      },
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ],
      limit: 20
    });
    
    if (googleAdsTraffic && googleAdsTraffic.rows) {
      let googleAdsSessions = 0;
      googleAdsTraffic.rows.forEach(row => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const campaign = row.dimensionValues[2].value || '(not set)';
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        // Only count paid traffic (cpc, cpm, cpv, etc.)
        if (medium && (medium.includes('cpc') || medium.includes('cpm') || medium.includes('cpv') || medium === 'display' || medium === 'video')) {
          console.log(`  ${source}/${medium} - ${campaign}`);
          console.log(`    Sessions: ${sessions}, Users: ${users}`);
          googleAdsSessions += sessions;
        }
      });
      console.log(`  Google Ads Total: ${googleAdsSessions} sessions\n`);
    }
    
    // Query 4: Check by sessionCampaignName for Google Ads campaigns
    console.log('4️⃣ CAMPAIGN-BASED TRAFFIC:\n');
    const campaignTraffic = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName', 'defaultChannelGroup'],
      metrics: ['sessions', 'totalUsers'],
      startDate: startDateStr,
      endDate: endDateStr,
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ],
      limit: 20
    });
    
    if (campaignTraffic && campaignTraffic.rows) {
      campaignTraffic.rows.forEach(row => {
        const campaign = row.dimensionValues[0].value || '(not set)';
        const channel = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        if (campaign !== '(not set)' && campaign !== '(data not available)') {
          console.log(`  Campaign: ${campaign}`);
          console.log(`    Channel: ${channel}, Sessions: ${sessions}, Users: ${users}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('EXPECTED vs ACTUAL:');
    console.log('Expected: 820 sessions (398 Paid Search + 217 Display + 205 Paid Video)');
    console.log('Actual: Check the numbers above');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error debugging GA4:', error);
  }
}

// Run the debug script
debugGA4Query();