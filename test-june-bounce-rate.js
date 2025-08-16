import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function getJuneBounceRateByCampaign() {
  try {
    console.log('🔍 Querying Google Analytics API for June 2025 bounce rate by campaign...\n');
    
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Query GA4 for Traffic Acquisition data filtered by Session Campaigns for June 2025
    const campaignBounceData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName', 'sessionDefaultChannelGroup'],
      metrics: ['sessions', 'bounceRate'],
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'sessionDefaultChannelGroup',
                inListFilter: {
                  values: ['Paid Search', 'Display', 'Paid Video']
                }
              }
            },
            {
              notExpression: {
                filter: {
                  fieldName: 'sessionCampaignName',
                  inListFilter: {
                    values: ['(not set)', '(direct)', '(referral)', '(organic)', '(none)']
                  }
                }
              }
            }
          ]
        }
      }
    });
    
    if (!campaignBounceData || !campaignBounceData.rows || campaignBounceData.rows.length === 0) {
      console.log('❌ No campaign bounce rate data found for June 2025');
      return;
    }
    
    console.log(`📊 Found ${campaignBounceData.rows.length} campaigns with bounce rate data for June 2025:\n`);
    
    // Process and display results
    let totalWeightedBounceRate = 0;
    let totalSessions = 0;
    const campaigns = [];
    
    campaignBounceData.rows.forEach(row => {
      const sessionsIndex = campaignBounceData.metricHeaders?.findIndex(
        header => header.name === 'sessions'
      );
      const bounceRateIndex = campaignBounceData.metricHeaders?.findIndex(
        header => header.name === 'bounceRate'
      );
      
      if (sessionsIndex >= 0 && bounceRateIndex >= 0 && row.metricValues) {
        const sessions = parseInt(row.metricValues[sessionsIndex].value || 0);
        const bounceRate = parseFloat(row.metricValues[bounceRateIndex].value || 0);
        const campaignName = row.dimensionValues?.[0]?.value;
        const channelGroup = row.dimensionValues?.[1]?.value;
        
        if (sessions > 0 && campaignName && !['(not set)', '(direct)', '(referral)', '(organic)', '(none)'].includes(campaignName)) {
          totalWeightedBounceRate += (bounceRate * sessions);
          totalSessions += sessions;
          
          campaigns.push({
            name: campaignName,
            channel: channelGroup,
            sessions,
            bounceRate
          });
          
          console.log(`📈 ${campaignName} (${channelGroup})`);
          console.log(`   Sessions: ${sessions.toLocaleString()}`);
          console.log(`   Bounce Rate: ${bounceRate.toFixed(2)}%\n`);
        }
      }
    });
    
    // Sort campaigns by sessions (highest first)
    campaigns.sort((a, b) => b.sessions - a.sessions);
    
    console.log('═'.repeat(60));
    console.log(`📊 JUNE 2025 CAMPAIGN BOUNCE RATE SUMMARY:`);
    console.log('═'.repeat(60));
    console.log(`Total Campaigns: ${campaigns.length}`);
    console.log(`Total Sessions: ${totalSessions.toLocaleString()}`);
    
    const overallBounceRate = totalSessions > 0 ? (totalWeightedBounceRate / totalSessions) : 0;
    console.log(`Weighted Average Bounce Rate: ${overallBounceRate.toFixed(2)}%`);
    
    console.log('\n📈 TOP CAMPAIGNS BY SESSIONS:');
    campaigns.slice(0, 10).forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.name} (${campaign.channel})`);
      console.log(`   Sessions: ${campaign.sessions.toLocaleString()} | Bounce Rate: ${campaign.bounceRate.toFixed(2)}%`);
    });
    
    console.log('\n🎯 BEST BOUNCE RATES (lowest first):');
    const bestBounceRates = [...campaigns].sort((a, b) => a.bounceRate - b.bounceRate).slice(0, 5);
    bestBounceRates.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.name} (${campaign.channel})`);
      console.log(`   Bounce Rate: ${campaign.bounceRate.toFixed(2)}% | Sessions: ${campaign.sessions.toLocaleString()}`);
    });
    
    console.log('\n⚠️  HIGHEST BOUNCE RATES (action needed):');
    const worstBounceRates = [...campaigns].sort((a, b) => b.bounceRate - a.bounceRate).slice(0, 5);
    worstBounceRates.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.name} (${campaign.channel})`);
      console.log(`   Bounce Rate: ${campaign.bounceRate.toFixed(2)}% | Sessions: ${campaign.sessions.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error querying Google Analytics API:', error);
    if (error.message.includes('credentials')) {
      console.log('\n💡 Make sure your Google Analytics credentials are properly configured.');
    }
  }
}

// Run the query
getJuneBounceRateByCampaign();