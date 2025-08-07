#!/usr/bin/env node

require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function testGoogleAnalyticsConnection() {
  try {
    console.log('Testing Google Analytics connection...');
    console.log('Property ID:', process.env.GA_PROPERTY_ID);
    console.log('Credentials file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

    // Initialize the GA4 client
    const analyticsDataClient = new BetaAnalyticsDataClient();

    console.log(`\nFetching data from last 7 days`);

    // Request basic metrics for the last 7 days using GA4 date format
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
        {
          name: 'sessions',
        },
      ],
    });

    console.log('\n✅ Connection successful!');
    console.log('\n📊 Analytics Data (Last 7 Days):');
    console.log('='.repeat(50));

    if (response.rows && response.rows.length > 0) {
      const activeUsers = parseInt(response.rows[0].metricValues[0].value);
      const sessions = parseInt(response.rows[0].metricValues[1].value);
      
      console.log(`Active Users: ${activeUsers}`);
      console.log(`Sessions: ${sessions}`);
    } else {
      console.log('No data returned');
    }

    // Display property metadata
    console.log('\n🔍 Property Information:');
    console.log(`Property ID: ${process.env.GA_PROPERTY_ID}`);
    console.log(`Data retrieved: ${response.rows?.length || 0} days`);

  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error details:', error.message);
    
    if (error.code === 'ENOENT') {
      console.error('\n💡 Make sure your credentials file exists at:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    } else if (error.code === 7) {
      console.error('\n💡 Permission denied. Check that:');
      console.error('   1. Your service account has Google Analytics Viewer permissions');
      console.error('   2. Your GA_PROPERTY_ID is correct');
      console.error('   3. The property exists and is accessible');
    } else if (error.code === 3) {
      console.error('\n💡 Invalid argument. Check that:');
      console.error('   1. Your GA_PROPERTY_ID format is correct (should be numbers only)');
      console.error('   2. The property ID exists');
    }
    
    process.exit(1);
  }
}

// Validate required environment variables
if (!process.env.GA_PROPERTY_ID) {
  console.error('❌ GA_PROPERTY_ID environment variable is required');
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable is required');
  process.exit(1);
}

// Run the test
testGoogleAnalyticsConnection();