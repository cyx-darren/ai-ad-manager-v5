import { GoogleAnalyticsCore } from './analytics-core.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('='.repeat(60));
console.log('Testing GoogleAnalyticsCore Module');
console.log('='.repeat(60));

async function testCore() {
  try {
    // Initialize the core class
    console.log('\n1. Initializing GoogleAnalyticsCore...');
    const analyticsCore = new GoogleAnalyticsCore();
    console.log('   ✓ Core class initialized');
    console.log(`   Property ID: ${analyticsCore.propertyId}`);
    console.log(`   Credentials: ${analyticsCore.credentialsPath}`);

    // Initialize the GA client
    console.log('\n2. Initializing Google Analytics client...');
    await analyticsCore.initialize();
    console.log('   ✓ GA client initialized successfully');

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    console.log('\n3. Running basic query (last 7 days)...');
    console.log(`   Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`);

    // Test 1: Basic metrics query
    console.log('\n4. Testing basic metrics query...');
    const basicMetrics = await analyticsCore.queryAnalytics({
      dimensions: ['date'],
      metrics: ['sessions', 'totalUsers', 'screenPageViews'],
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      limit: 10
    });

    console.log('   ✓ Basic query successful');
    console.log(`   Rows returned: ${basicMetrics.rowCount}`);
    console.log(`   Dimensions: ${basicMetrics.dimensionHeaders.map(h => h.name).join(', ')}`);
    console.log(`   Metrics: ${basicMetrics.metricHeaders.map(h => h.name).join(', ')}`);
    
    if (basicMetrics.rows && basicMetrics.rows.length > 0) {
      console.log('\n   Sample data (first 3 rows):');
      basicMetrics.rows.slice(0, 3).forEach((row, idx) => {
        const date = row.dimensionValues[0].value;
        const sessions = row.metricValues[0].value;
        const users = row.metricValues[1].value;
        const pageViews = row.metricValues[2].value;
        console.log(`   ${idx + 1}. ${date}: Sessions=${sessions}, Users=${users}, PageViews=${pageViews}`);
      });
    }

    // Test 2: Traffic sources
    console.log('\n5. Testing traffic sources query...');
    const trafficSources = await analyticsCore.getTrafficSources({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      limit: 5
    });

    console.log('   ✓ Traffic sources query successful');
    console.log(`   Top traffic sources: ${trafficSources.rowCount} found`);
    
    if (trafficSources.rows && trafficSources.rows.length > 0) {
      console.log('\n   Top 3 traffic sources:');
      trafficSources.rows.slice(0, 3).forEach((row, idx) => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const sessions = row.metricValues[0].value;
        console.log(`   ${idx + 1}. ${source} / ${medium}: ${sessions} sessions`);
      });
    }

    // Test 3: Real-time data
    console.log('\n6. Testing real-time data query...');
    const realtimeData = await analyticsCore.getRealtimeData({
      metrics: ['activeUsers'],
      dimensions: ['country']
    });

    console.log('   ✓ Real-time query successful');
    console.log(`   Active users right now: ${realtimeData.rowCount || 0}`);
    
    if (realtimeData.rows && realtimeData.rows.length > 0) {
      console.log('\n   Active users by country:');
      realtimeData.rows.slice(0, 3).forEach((row, idx) => {
        const country = row.dimensionValues[0].value;
        const activeUsers = row.metricValues[0].value;
        console.log(`   ${idx + 1}. ${country}: ${activeUsers} active users`);
      });
    }

    // Test 4: Campaign performance
    console.log('\n7. Testing campaign performance query...');
    const campaigns = await analyticsCore.getCampaignPerformance({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      limit: 5
    });

    console.log('   ✓ Campaign query successful');
    console.log(`   Campaigns found: ${campaigns.rowCount}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('The GoogleAnalyticsCore module is working correctly.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(`   Error: ${error.message}`);
    console.error('\nFull error details:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
console.log('Starting tests...\n');
testCore().then(() => {
  console.log('\nTest completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('\nTest failed:', error);
  process.exit(1);
});