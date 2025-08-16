import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function testGoogleAdsOnly() {
  try {
    console.log('🔍 Testing Google Ads traffic only (source=google)\n');
    
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
    
    // Test 1: Google source with channel groups
    console.log('📊 GOOGLE SOURCE BY CHANNEL GROUP:\n');
    const googleData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionSource', 'sessionDefaultChannelGroup'],
      metrics: ['sessions', 'totalUsers'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        andGroup: {
          filters: [
            {
              filter: {
                fieldName: 'sessionSource',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'google',
                  caseSensitive: false
                }
              }
            },
            {
              filter: {
                fieldName: 'sessionDefaultChannelGroup',
                inListFilter: {
                  values: ['Paid Search', 'Display', 'Paid Video']
                }
              }
            }
          ]
        }
      },
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ]
    });
    
    let googlePaidSearch = 0;
    let googleDisplay = 0;
    let googlePaidVideo = 0;
    
    if (googleData && googleData.rows) {
      googleData.rows.forEach(row => {
        const source = row.dimensionValues[0].value;
        const channelGroup = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        console.log(`${source} - ${channelGroup}: ${sessions} sessions, ${users} users`);
        
        if (channelGroup === 'Paid Search') googlePaidSearch += sessions;
        if (channelGroup === 'Display') googleDisplay += sessions;
        if (channelGroup === 'Paid Video') googlePaidVideo += sessions;
      });
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('GOOGLE ADS TOTALS:');
    console.log(`Paid Search: ${googlePaidSearch} sessions (Expected: 398)`);
    console.log(`Display: ${googleDisplay} sessions (Expected: 217)`);
    console.log(`Paid Video: ${googlePaidVideo} sessions (Expected: 205)`);
    console.log(`TOTAL: ${googlePaidSearch + googleDisplay + googlePaidVideo} sessions (Expected: 820)`);
    
    // Test 2: All sources with channel groups
    console.log('\n\n📊 ALL SOURCES BY CHANNEL GROUP:\n');
    const allData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionSource', 'sessionDefaultChannelGroup'],
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
          metric: { metricName: 'sessions' },
          desc: true
        }
      ]
    });
    
    if (allData && allData.rows) {
      const sourceBreakdown = {};
      allData.rows.forEach(row => {
        const source = row.dimensionValues[0].value;
        const channelGroup = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);
        
        if (!sourceBreakdown[channelGroup]) {
          sourceBreakdown[channelGroup] = {};
        }
        if (!sourceBreakdown[channelGroup][source]) {
          sourceBreakdown[channelGroup][source] = 0;
        }
        sourceBreakdown[channelGroup][source] += sessions;
      });
      
      Object.entries(sourceBreakdown).forEach(([channel, sources]) => {
        console.log(`\n${channel}:`);
        Object.entries(sources).forEach(([source, sessions]) => {
          console.log(`  ${source}: ${sessions} sessions`);
        });
        const total = Object.values(sources).reduce((sum, val) => sum + val, 0);
        console.log(`  TOTAL: ${total} sessions`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testGoogleAdsOnly();