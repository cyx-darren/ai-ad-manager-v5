import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function testGoogleFilter() {
  try {
    console.log('🔍 Testing filters to get exactly 820 sessions\n');
    
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
    console.log('Target: 820 sessions (398 Paid Search + 217 Display + 205 Paid Video)\n');
    console.log('=' .repeat(60));
    
    // Test 1: Group by source and channel
    console.log('\n📊 BREAKDOWN BY SOURCE AND CHANNEL:\n');
    const sourceChannelData = await analyticsCore.queryAnalytics({
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
    
    const breakdown = {
      'Paid Search': {},
      'Display': {},
      'Paid Video': {}
    };
    
    let totalGoogle = 0;
    let totalNonGoogle = 0;
    
    if (sourceChannelData && sourceChannelData.rows) {
      sourceChannelData.rows.forEach(row => {
        const source = row.dimensionValues[0].value;
        const channel = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);
        
        if (!breakdown[channel][source]) {
          breakdown[channel][source] = 0;
        }
        breakdown[channel][source] += sessions;
        
        if (source.toLowerCase() === 'google') {
          totalGoogle += sessions;
        } else {
          totalNonGoogle += sessions;
        }
      });
    }
    
    // Display results
    Object.entries(breakdown).forEach(([channel, sources]) => {
      console.log(`\n${channel}:`);
      let channelTotal = 0;
      Object.entries(sources)
        .sort((a, b) => b[1] - a[1])
        .forEach(([source, sessions]) => {
          console.log(`  ${source}: ${sessions} sessions`);
          channelTotal += sessions;
        });
      console.log(`  TOTAL: ${channelTotal} sessions`);
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log(`\nGoogle traffic: ${totalGoogle} sessions`);
    console.log(`Non-Google traffic: ${totalNonGoogle} sessions`);
    console.log(`TOTAL: ${totalGoogle + totalNonGoogle} sessions`);
    
    if (totalGoogle === 820) {
      console.log('\n✅ MATCH FOUND: Filter by source="google" gives exactly 820 sessions!');
    }
    
    // Test 2: Check campaign names
    console.log('\n\n📊 NON-GOOGLE PAID TRAFFIC DETAILS:\n');
    const nonGoogleData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionSource', 'sessionMedium', 'sessionCampaignName', 'sessionDefaultChannelGroup'],
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
      ],
      limit: 100
    });
    
    if (nonGoogleData && nonGoogleData.rows) {
      nonGoogleData.rows.forEach(row => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const campaign = row.dimensionValues[2].value || '(not set)';
        const channel = row.dimensionValues[3].value;
        const sessions = parseInt(row.metricValues[0].value);
        
        if (source.toLowerCase() !== 'google' && sessions > 0) {
          console.log(`${source}/${medium} - ${campaign}`);
          console.log(`  Channel: ${channel}, Sessions: ${sessions}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testGoogleFilter();