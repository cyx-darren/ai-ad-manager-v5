const { GoogleAnalyticsCore } = require('./src/core/analytics-core.js');

async function getGoogleAdsSessionsByChannel() {
  try {
    // Initialize GA4 client
    const analytics = new GoogleAnalyticsCore();
    await analytics.initialize();
    
    console.log('Fetching Google Ads sessions using Channel Grouping from GA4...\n');
    
    // Query using sessionDefaultChannelGroup dimension
    const result = await analytics.queryAnalytics({
      dimensions: ['sessionDefaultChannelGroup'],
      metrics: ['sessions', 'totalUsers', 'newUsers', 'bounceRate', 'screenPageViews'],
      startDate: '2025-08-04',
      endDate: '2025-08-10',
      limit: 100
    });

    console.log('=================================');
    console.log('Traffic Acquisition by Channel Group');
    console.log('Date Range: Aug 4-10, 2025 (Last 7 Days)');
    console.log('=================================\n');
    
    let googleAdsSessions = 0;
    let googleAdsUsers = 0;
    let googleAdsNewUsers = 0;
    let googleAdsBounceRate = 0;
    let googleAdsPageViews = 0;
    let totalSessions = 0;
    
    if (result.rows && result.rows.length > 0) {
      console.log('All Channels:');
      console.log('---------------------------------');
      
      result.rows.forEach(row => {
        const channelGroup = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        const newUsers = parseInt(row.metricValues[2].value);
        const bounceRate = (parseFloat(row.metricValues[3].value) * 100).toFixed(2);
        const pageViews = parseInt(row.metricValues[4].value);
        
        console.log(`Channel: ${channelGroup}`);
        console.log(`  Sessions: ${sessions.toLocaleString()}`);
        console.log(`  Users: ${users.toLocaleString()}`);
        console.log(`  New Users: ${newUsers.toLocaleString()}`);
        console.log(`  Bounce Rate: ${bounceRate}%`);
        console.log(`  Page Views: ${pageViews.toLocaleString()}`);
        console.log('---------------------------------');
        
        totalSessions += sessions;
        
        // Check for Paid Search channel (which includes Google Ads)
        if (channelGroup.toLowerCase() === 'paid search') {
          googleAdsSessions = sessions;
          googleAdsUsers = users;
          googleAdsNewUsers = newUsers;
          googleAdsBounceRate = bounceRate;
          googleAdsPageViews = pageViews;
        }
      });
    }
    
    console.log('\n=================================');
    console.log('GOOGLE ADS (PAID SEARCH) METRICS');
    console.log('=================================');
    console.log(`Total Sessions: ${googleAdsSessions.toLocaleString()}`);
    console.log(`Total Users: ${googleAdsUsers.toLocaleString()}`);
    console.log(`Total New Users: ${googleAdsNewUsers.toLocaleString()}`);
    console.log(`Bounce Rate: ${googleAdsBounceRate}%`);
    console.log(`Page Views: ${googleAdsPageViews.toLocaleString()}`);
    console.log('=================================\n');
    
    if (totalSessions > 0) {
      const googleAdsPercentage = ((googleAdsSessions / totalSessions) * 100).toFixed(2);
      console.log('Context:');
      console.log(`Total Sessions (All Channels): ${totalSessions.toLocaleString()}`);
      console.log(`Google Ads Contribution: ${googleAdsPercentage}% of total traffic`);
    }
    
    // Also get breakdown by source/medium for Paid Search
    console.log('\n\nDetailed Paid Search Breakdown:');
    console.log('=================================');
    
    const detailedResult = await analytics.queryAnalytics({
      dimensions: ['sessionSource', 'sessionMedium', 'sessionCampaignName'],
      metrics: ['sessions'],
      startDate: '2025-08-04',
      endDate: '2025-08-10',
      limit: 100,
      dimensionFilter: {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          stringFilter: {
            matchType: 'EXACT',
            value: 'Paid Search',
            caseSensitive: false
          }
        }
      }
    });
    
    if (detailedResult.rows && detailedResult.rows.length > 0) {
      detailedResult.rows.forEach(row => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const campaign = row.dimensionValues[2].value || '(not set)';
        const sessions = parseInt(row.metricValues[0].value);
        
        console.log(`${source}/${medium} - ${campaign}: ${sessions.toLocaleString()} sessions`);
      });
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
getGoogleAdsSessionsByChannel();