const { GoogleAnalyticsCore } = require('./src/core/analytics-core.js');

async function getGoogleAdsSessions() {
  try {
    // Initialize GA4 client
    const analytics = new GoogleAnalyticsCore();
    await analytics.initialize();
    
    console.log('Fetching Google Ads sessions data from GA4...\n');
    
    // Query for Google Ads sessions with source/medium filter
    const result = await analytics.queryAnalytics({
      dimensions: ['sessionSource', 'sessionMedium', 'sessionCampaignName'],
      metrics: ['sessions', 'totalUsers', 'newUsers'],
      startDate: '2025-08-04',
      endDate: '2025-08-10',
      limit: 100,
      dimensionFilter: {
        andGroup: {
          expressions: [
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
                fieldName: 'sessionMedium',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'cpc',
                  caseSensitive: false
                }
              }
            }
          ]
        }
      }
    });

    console.log('=================================');
    console.log('Google Ads Sessions Report');
    console.log('Date Range: Aug 4-10, 2025 (Last 7 Days)');
    console.log('=================================\n');
    
    let totalSessions = 0;
    let totalUsers = 0;
    let totalNewUsers = 0;
    
    if (result.rows && result.rows.length > 0) {
      console.log('Campaign Breakdown:');
      console.log('---------------------------------');
      
      result.rows.forEach(row => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const campaign = row.dimensionValues[2].value || '(not set)';
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        const newUsers = parseInt(row.metricValues[2].value);
        
        console.log(`Campaign: ${campaign}`);
        console.log(`  Source/Medium: ${source}/${medium}`);
        console.log(`  Sessions: ${sessions.toLocaleString()}`);
        console.log(`  Users: ${users.toLocaleString()}`);
        console.log(`  New Users: ${newUsers.toLocaleString()}`);
        console.log('---------------------------------');
        
        totalSessions += sessions;
        totalUsers += users;
        totalNewUsers += newUsers;
      });
    }
    
    console.log('\n=================================');
    console.log('TOTAL GOOGLE ADS METRICS');
    console.log('=================================');
    console.log(`Total Sessions: ${totalSessions.toLocaleString()}`);
    console.log(`Total Users: ${totalUsers.toLocaleString()}`);
    console.log(`Total New Users: ${totalNewUsers.toLocaleString()}`);
    console.log('=================================\n');
    
    // Also get overall traffic for comparison
    const overallResult = await analytics.queryAnalytics({
      dimensions: [],
      metrics: ['sessions'],
      startDate: '2025-08-04',
      endDate: '2025-08-10'
    });
    
    if (overallResult.rows && overallResult.rows.length > 0) {
      const totalAllSessions = parseInt(overallResult.rows[0].metricValues[0].value);
      const googleAdsPercentage = ((totalSessions / totalAllSessions) * 100).toFixed(2);
      
      console.log('Context:');
      console.log(`Total Sessions (All Sources): ${totalAllSessions.toLocaleString()}`);
      console.log(`Google Ads Contribution: ${googleAdsPercentage}% of total traffic`);
    }
    
  } catch (error) {
    console.error('Error fetching Google Ads data:', error.message);
    console.error('\nMake sure you have:');
    console.error('1. GA_PROPERTY_ID set in your .env file');
    console.error('2. GOOGLE_APPLICATION_CREDENTIALS pointing to your service account JSON file');
    console.error('3. Proper permissions for the service account to access GA4 data');
  }
}

// Run the function
getGoogleAdsSessions();