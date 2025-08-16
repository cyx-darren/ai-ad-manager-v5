import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function testCampaignDimensions() {
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    const startDate = '2025-07-13';
    const endDate = '2025-08-12';
    
    console.log('🔍 Testing different campaign-related dimensions...\n');
    
    // Test different campaign dimensions
    const dimensionsToTest = [
      'sessionCampaignName',
      'sessionGoogleAdsCampaignName', 
      'sessionManualAdContent',
      'sessionSource',
      'sessionMedium',
      'sessionSourceMedium',
      'sessionCampaignId',
      'firstUserCampaignName'
    ];
    
    for (const dimension of dimensionsToTest) {
      try {
        console.log(`\n📊 Testing dimension: "${dimension}"`);
        console.log('─'.repeat(50));
        
        const data = await analyticsCore.queryAnalytics({
          dimensions: [dimension, 'sessionDefaultChannelGroup'],
          metrics: ['sessions'],
          startDate,
          endDate,
          dimensionFilter: {
            filter: {
              fieldName: 'sessionDefaultChannelGroup',
              inListFilter: {
                values: ['Paid Search', 'Display', 'Paid Video']
              }
            }
          },
          limit: 10
        });
        
        if (data && data.rows && data.rows.length > 0) {
          console.log(`✅ SUCCESS - Found ${data.rows.length} rows`);
          
          // Show first 5 results
          console.log('\nTop 5 results:');
          data.rows.slice(0, 5).forEach((row, i) => {
            const value = row.dimensionValues?.[0]?.value || '(not set)';
            const channel = row.dimensionValues?.[1]?.value || '(not set)';
            const sessions = row.metricValues?.[0]?.value || '0';
            console.log(`  ${i+1}. "${value}" | ${channel} | ${sessions} sessions`);
          });
        } else {
          console.log('⚠️  No data returned');
        }
      } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
      }
    }
    
    // Now try a simple query with just channel groups to see paid campaigns
    console.log('\n\n🎯 Getting paid traffic breakdown by channel:');
    console.log('═'.repeat(60));
    
    const channelData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionDefaultChannelGroup'],
      metrics: ['sessions', 'totalUsers'],
      startDate,
      endDate,
      dimensionFilter: {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          inListFilter: {
            values: ['Paid Search', 'Display', 'Paid Video']
          }
        }
      }
    });
    
    if (channelData && channelData.rows) {
      channelData.rows.forEach(row => {
        const channel = row.dimensionValues?.[0]?.value;
        const sessions = row.metricValues?.[0]?.value;
        const users = row.metricValues?.[1]?.value;
        console.log(`\n📈 ${channel}:`);
        console.log(`   • Sessions: ${parseInt(sessions).toLocaleString()}`);
        console.log(`   • Users: ${parseInt(users).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCampaignDimensions();