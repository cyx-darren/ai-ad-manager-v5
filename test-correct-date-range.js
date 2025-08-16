import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function testCorrectDateRange() {
  try {
    console.log('🔍 Testing CORRECT Last 7 Days: Aug 3 to Aug 9\n');
    
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Correct last 7 days: Aug 3 to Aug 9
    const startDateStr = '2025-08-03';
    const endDateStr = '2025-08-09';
    
    console.log(`Date Range: ${startDateStr} to ${endDateStr}`);
    console.log('Expected: 820 sessions (398 Paid Search + 217 Display + 205 Paid Video)\n');
    console.log('=' .repeat(60));
    
    // Query Traffic Acquisition channel groups
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
      console.log('📊 TRAFFIC ACQUISITION - CORRECT DATE RANGE:\n');
      console.log('Channel Group                Sessions    Users');
      console.log('-'.repeat(60));
      
      trafficData.rows.forEach(row => {
        const channelGroup = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        // Format output
        const paddedChannel = channelGroup.padEnd(25);
        const paddedSessions = sessions.toString().padStart(8);
        const paddedUsers = users.toString().padStart(8);
        
        console.log(`${paddedChannel} ${paddedSessions} ${paddedUsers}`);
        
        // Calculate Google Ads total
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
    console.log('\n📈 GOOGLE ADS BREAKDOWN:\n');
    console.log(`Paid Search:  ${paidSearchSessions} sessions (Expected: 398)`);
    console.log(`Display:      ${displaySessions} sessions (Expected: 217)`);
    console.log(`Paid Video:   ${paidVideoSessions} sessions (Expected: 205)`);
    console.log('-'.repeat(40));
    console.log(`ACTUAL TOTAL: ${totalGoogleAdsSessions} sessions`);
    console.log(`EXPECTED:     820 sessions`);
    console.log(`DIFFERENCE:   ${totalGoogleAdsSessions - 820} sessions`);
    
    if (totalGoogleAdsSessions === 820) {
      console.log('\n🎯 PERFECT MATCH! ✅');
    } else {
      console.log(`\n❌ Still ${Math.abs(totalGoogleAdsSessions - 820)} sessions ${totalGoogleAdsSessions > 820 ? 'over' : 'under'}`);
    }
    
    // Also check daily breakdown for this period
    console.log('\n📅 DAILY BREAKDOWN (Aug 3-9):\n');
    
    const dailyData = await analyticsCore.queryAnalytics({
      dimensions: ['date', 'sessionDefaultChannelGroup'],
      metrics: ['sessions'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          inListFilter: {
            values: ['Paid Search', 'Display', 'Paid Video']
          }
        }
      },
      orderBys: [
        {
          dimension: { dimensionName: 'date' }
        }
      ]
    });
    
    const dailyBreakdown = {};
    
    if (dailyData && dailyData.rows) {
      dailyData.rows.forEach(row => {
        const date = row.dimensionValues[0].value;
        const channel = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);
        
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = { 'Paid Search': 0, 'Display': 0, 'Paid Video': 0 };
        }
        dailyBreakdown[date][channel] = sessions;
      });
    }
    
    console.log('Date     | Paid Search | Display | Paid Video | Daily Total');
    console.log('-'.repeat(65));
    
    const sortedDates = Object.keys(dailyBreakdown).sort();
    let weekTotal = 0;
    
    sortedDates.forEach(date => {
      const ps = dailyBreakdown[date]['Paid Search'] || 0;
      const display = dailyBreakdown[date]['Display'] || 0;
      const video = dailyBreakdown[date]['Paid Video'] || 0;
      const dailyTotal = ps + display + video;
      weekTotal += dailyTotal;
      
      const formattedDate = `${date.substr(4,2)}/${date.substr(6,2)}`;
      console.log(`${formattedDate}      |      ${ps.toString().padStart(6)} |  ${display.toString().padStart(6)} |     ${video.toString().padStart(6)} |      ${dailyTotal.toString().padStart(6)}`);
    });
    
    console.log('-'.repeat(65));
    console.log(`TOTAL    |      ${paidSearchSessions.toString().padStart(6)} |  ${displaySessions.toString().padStart(6)} |     ${paidVideoSessions.toString().padStart(6)} |      ${weekTotal.toString().padStart(6)}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testCorrectDateRange();