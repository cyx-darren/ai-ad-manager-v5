#!/usr/bin/env node

require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function debugAuthentication() {
  try {
    console.log('🔍 Debug Authentication');
    console.log('='.repeat(40));
    console.log('Property ID:', process.env.GA_PROPERTY_ID);
    console.log('Credentials file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    
    // Test 1: Initialize client
    console.log('\n1️⃣ Testing client initialization...');
    const analyticsDataClient = new BetaAnalyticsDataClient();
    console.log('✅ Client initialized successfully');

    // Test 2: Try to get property metadata (simpler request)
    console.log('\n2️⃣ Testing basic property access...');
    try {
      const [response] = await analyticsDataClient.getMetadata({
        name: `properties/${process.env.GA_PROPERTY_ID}/metadata`,
      });
      console.log('✅ Property metadata retrieved');
      console.log('Available dimensions:', response.dimensions?.length || 0);
      console.log('Available metrics:', response.metrics?.length || 0);
    } catch (metadataError) {
      console.log('❌ Metadata request failed:', metadataError.message);
      console.log('Error code:', metadataError.code);
      console.log('Error details:', metadataError.details);
    }

    // Test 3: Try a minimal report request
    console.log('\n3️⃣ Testing minimal report request...');
    try {
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${process.env.GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }],
      });
      console.log('✅ Basic report successful');
      console.log('Rows returned:', response.rows?.length || 0);
      if (response.rows?.length > 0) {
        console.log('Sample data:', response.rows[0].metricValues[0].value);
      }
    } catch (reportError) {
      console.log('❌ Report request failed:', reportError.message);
      console.log('Error code:', reportError.code);
      console.log('Full error:', JSON.stringify(reportError, null, 2));
    }

  } catch (error) {
    console.error('❌ Authentication debug failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

debugAuthentication();