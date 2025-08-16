import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function testMediums() {
  try {
    console.log('🔍 Testing GA4 Mediums for Last 7 Days\n');
    
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    console.log(`Date Range: ${startDateStr} to ${endDateStr}\n`);
    
    // Test 1: Get all unique mediums
    console.log('1️⃣ ALL UNIQUE MEDIUMS:\n');
    const allMediums = await analyticsCore.queryAnalytics({
      dimensions: ['sessionMedium'],
      metrics: ['sessions'],
      startDate: startDateStr,
      endDate: endDateStr,
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ]
    });
    
    if (allMediums && allMediums.rows) {
      allMediums.rows.forEach(row => {
        const medium = row.dimensionValues[0].value;
        const sessions = row.metricValues[0].value;
        console.log(`  "${medium}": ${sessions} sessions`);
      });
    }
    
    // Test 2: Test regex filter for cpc
    console.log('\n2️⃣ TEST REGEX FILTER (cpc only):\n');
    const cpcTest = await analyticsCore.queryAnalytics({
      dimensions: ['sessionMedium'],
      metrics: ['sessions'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        filter: {
          fieldName: 'sessionMedium',
          stringFilter: {
            matchType: 'EXACT',
            value: 'cpc'
          }
        }
      }
    });
    
    if (cpcTest && cpcTest.rows) {
      let total = 0;
      cpcTest.rows.forEach(row => {
        const medium = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        console.log(`  "${medium}": ${sessions} sessions`);
        total += sessions;
      });
      console.log(`  TOTAL: ${total} sessions`);
    } else {
      console.log('  No data matched');
    }
    
    // Test 3: Test contains filter
    console.log('\n3️⃣ TEST CONTAINS FILTER (contains "cp"):\n');
    const containsTest = await analyticsCore.queryAnalytics({
      dimensions: ['sessionMedium'],
      metrics: ['sessions'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        filter: {
          fieldName: 'sessionMedium',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'cp'
          }
        }
      }
    });
    
    if (containsTest && containsTest.rows) {
      let total = 0;
      containsTest.rows.forEach(row => {
        const medium = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        console.log(`  "${medium}": ${sessions} sessions`);
        total += sessions;
      });
      console.log(`  TOTAL: ${total} sessions`);
    } else {
      console.log('  No data matched');
    }
    
  } catch (error) {
    console.error('Error testing mediums:', error);
  }
}

// Run the test
testMediums();