import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function getTrafficAcquisition() {
  try {
    console.log('🔍 Getting Traffic Acquisition Channel Groups (matching GA4 UI)\n');
    
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    console.log(`Date Range: ${startDateStr} to ${endDateStr}\n`);
    console.log('=' .repeat(60));
    
    // Query using sessionDefaultChannelGroup which corresponds to Traffic Acquisition
    console.log('📊 TRAFFIC ACQUISITION - SESSION DEFAULT CHANNEL GROUP:\n');
    const trafficData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionDefaultChannelGroup'],
      metrics: ['sessions', 'totalUsers'],
      startDate: startDateStr,
      endDate: endDateStr,
      orderBys: [
        {
          dimension: { 
            dimensionName: 'sessionDefaultChannelGroup'
          }
        }
      ]
    });
    
    let paidSearchSessions = 0;
    let displaySessions = 0;
    let paidVideoSessions = 0;
    let totalGoogleAdsSessions = 0;
    
    if (trafficData && trafficData.rows) {
      console.log('Channel Group                Sessions    Users');
      console.log('-'.repeat(60));
      
      trafficData.rows.forEach(row => {
        const channelGroup = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        // Format output to match GA4 UI
        const paddedChannel = channelGroup.padEnd(25);
        const paddedSessions = sessions.toString().padStart(8);
        const paddedUsers = users.toString().padStart(8);
        
        console.log(`${paddedChannel} ${paddedSessions} ${paddedUsers}`);
        
        // Calculate Google Ads total (Paid Search + Display + Paid Video)
        if (channelGroup === 'Paid Search') {
          paidSearchSessions = sessions;
          totalGoogleAdsSessions += sessions;
        } else if (channelGroup === 'Display') {
          displaySessions = sessions;
          totalGoogleAdsSessions += sessions;
        } else if (channelGroup === 'Paid Video') {
          paidVideoSessions = sessions;
          totalGoogleAdsSessions += sessions;
        }
      });
    }
    
    console.log('=' .repeat(60));
    console.log('\n📈 GOOGLE ADS TOTAL (Sum of Paid Channels):\n');
    console.log(`Paid Search:  ${paidSearchSessions} sessions`);
    console.log(`Display:      ${displaySessions} sessions`);
    console.log(`Paid Video:   ${paidVideoSessions} sessions`);
    console.log('-'.repeat(30));
    console.log(`TOTAL:        ${totalGoogleAdsSessions} sessions`);
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ This matches the Traffic Acquisition report in GA4 UI');
    console.log('   where you sum the checked boxes for:');
    console.log('   ☑️ Paid Search (row 2)');
    console.log('   ☑️ Display (row 3)');
    console.log('   ☑️ Paid Video (row 5)');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the query
getTrafficAcquisition();