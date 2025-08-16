import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function getAllTrafficSources() {
  try {
    console.log('🔍 Fetching all traffic sources from GA4...\n');
    
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Query for all channel groups (traffic sources)
    const result = await analyticsCore.queryAnalytics({
      dimensions: ['defaultChannelGroup'],
      metrics: ['sessions', 'totalUsers'],
      startDate: '2025-07-01',
      endDate: '2025-08-10',
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ]
    });
    
    if (!result || !result.rows) {
      console.log('No data found');
      return;
    }
    
    console.log('📊 TRAFFIC SOURCES (Channel Groups) - Last 40 days\n');
    console.log('=' .repeat(60));
    
    let totalSessions = 0;
    let totalUsers = 0;
    const sources = [];
    
    result.rows.forEach((row, index) => {
      const channelGroup = row.dimensionValues[0].value;
      const sessions = parseInt(row.metricValues[0].value);
      const users = parseInt(row.metricValues[1].value);
      
      sources.push({ channelGroup, sessions, users });
      totalSessions += sessions;
      totalUsers += users;
    });
    
    // Display sources sorted by sessions
    sources.forEach((source, index) => {
      const sessionPercent = ((source.sessions / totalSessions) * 100).toFixed(1);
      console.log(`${index + 1}. ${source.channelGroup}`);
      console.log(`   Sessions: ${source.sessions} (${sessionPercent}%)`);
      console.log(`   Users: ${source.users}`);
      console.log('');
    });
    
    console.log('=' .repeat(60));
    console.log(`TOTAL TRAFFIC SOURCES: ${sources.length}`);
    console.log(`TOTAL SESSIONS: ${totalSessions}`);
    console.log(`TOTAL USERS: ${totalUsers}`);
    console.log('=' .repeat(60));
    
    // Now let's see which ones are paid
    console.log('\n💰 PAID CHANNELS (Currently tracked in dashboard):');
    console.log('- Paid Search');
    console.log('- Display');
    console.log('- Paid Video');
    
    const paidSources = sources.filter(s => 
      ['Paid Search', 'Display', 'Paid Video'].includes(s.channelGroup)
    );
    
    const paidSessions = paidSources.reduce((sum, s) => sum + s.sessions, 0);
    const paidPercent = ((paidSessions / totalSessions) * 100).toFixed(1);
    
    console.log(`\nPaid traffic represents ${paidPercent}% of total sessions`);
    
    // Query for more detailed source/medium breakdown
    console.log('\n\n📈 DETAILED SOURCE/MEDIUM BREAKDOWN (Top 10)\n');
    console.log('=' .repeat(60));
    
    const detailedResult = await analyticsCore.queryAnalytics({
      dimensions: ['sessionSource', 'sessionMedium'],
      metrics: ['sessions'],
      startDate: '2025-07-01',
      endDate: '2025-08-10',
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ],
      limit: 10
    });
    
    if (detailedResult && detailedResult.rows) {
      detailedResult.rows.forEach((row, index) => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const sessions = row.metricValues[0].value;
        
        console.log(`${index + 1}. ${source} / ${medium}`);
        console.log(`   Sessions: ${sessions}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error fetching traffic sources:', error);
  }
}

// Run the script
getAllTrafficSources();