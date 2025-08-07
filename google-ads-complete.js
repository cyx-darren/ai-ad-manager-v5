#!/usr/bin/env node

require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function getCompleteGoogleAdsData() {
  try {
    console.log('📊 Getting complete Google Ads data for June 2025...');
    console.log('🎯 Including: Paid Search + Display + Paid Video');
    console.log('Property ID:', process.env.GA_PROPERTY_ID);
    
    const analyticsDataClient = new BetaAnalyticsDataClient();

    // Query Google Ads channels (Paid Search + Display + Paid Video) for June 2025
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '2025-06-01',
          endDate: '2025-06-30',
        },
      ],
      metrics: [
        {
          name: 'sessions',
        },
        {
          name: 'totalUsers',
        },
        {
          name: 'bounceRate',
        },
        {
          name: 'conversions',
        },
      ],
      dimensions: [
        {
          name: 'sessionDefaultChannelGroup',
        },
      ],
      dimensionFilter: {
        orGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'sessionDefaultChannelGroup',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'Paid Search'
                }
              }
            },
            {
              filter: {
                fieldName: 'sessionDefaultChannelGroup',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'Display'
                }
              }
            },
            {
              filter: {
                fieldName: 'sessionDefaultChannelGroup',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'Paid Video'
                }
              }
            }
          ]
        }
      }
    });

    console.log('\n✅ Query successful!');
    
    let totalSessions = 0;
    let totalUsers = 0;
    let totalConversions = 0;
    let weightedBounceRate = 0; // Will calculate weighted average
    
    if (response.rows && response.rows.length > 0) {
      console.log('\n📈 Google Ads Traffic Breakdown - June 2025:');
      console.log('='.repeat(80));
      console.log('Channel'.padEnd(15) + 'Sessions'.padStart(10) + 'Users'.padStart(8) + 'Bounce Rate'.padStart(12) + 'Conversions'.padStart(12));
      console.log('='.repeat(80));
      
      response.rows.forEach((row) => {
        const channelGroup = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        const bounceRate = parseFloat(row.metricValues[2].value);
        const conversions = parseFloat(row.metricValues[3].value);
        
        // Add to totals
        totalSessions += sessions;
        totalUsers += users;
        totalConversions += conversions;
        
        // Calculate weighted bounce rate (sessions * bounce rate)
        weightedBounceRate += (sessions * bounceRate);
        
        const channel = channelGroup.padEnd(15);
        const sessionsStr = sessions.toLocaleString().padStart(10);
        const usersStr = users.toLocaleString().padStart(8);
        const bounceRateStr = (bounceRate * 100).toFixed(1) + '%';
        const bounceRateFormatted = bounceRateStr.padStart(12);
        const conversionsStr = conversions.toFixed(0).padStart(12);
        
        console.log(`${channel}${sessionsStr}${usersStr}${bounceRateFormatted}${conversionsStr}`);
      });
      
      // Calculate average bounce rate (weighted by sessions)
      const avgBounceRate = totalSessions > 0 ? (weightedBounceRate / totalSessions) : 0;
      
      console.log('='.repeat(80));
      const totalLine = 'TOTAL'.padEnd(15) + 
                       totalSessions.toLocaleString().padStart(10) + 
                       totalUsers.toLocaleString().padStart(8) + 
                       (avgBounceRate * 100).toFixed(1) + '%'.padStart(12) + 
                       totalConversions.toFixed(0).padStart(12);
      console.log(totalLine);
      console.log('='.repeat(80));
      
      console.log('\n🎯 Google Ads Summary - June 2025:');
      console.log(`📊 Total Sessions: ${totalSessions.toLocaleString()}`);
      console.log(`👥 Total Users: ${totalUsers.toLocaleString()}`);
      console.log(`📈 Average Bounce Rate: ${(avgBounceRate * 100).toFixed(1)}%`);
      console.log(`🏆 Total Conversions: ${totalConversions.toFixed(0)}`);
      
      // Additional calculations
      const conversionRate = totalSessions > 0 ? (totalConversions / totalSessions * 100) : 0;
      console.log(`💰 Conversion Rate: ${conversionRate.toFixed(2)}%`);
      
    } else {
      console.log('\n📊 No Google Ads traffic found for June 2025');
    }

  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.message.includes('bounceRate')) {
      console.log('\n💡 Note: bounceRate metric might not be available. Retrying without it...');
      
      // Retry without bounce rate
      try {
        const [retryResponse] = await analyticsDataClient.runReport({
          property: `properties/${process.env.GA_PROPERTY_ID}`,
          dateRanges: [{ startDate: '2025-06-01', endDate: '2025-06-30' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'conversions' },
          ],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          dimensionFilter: {
            orGroup: {
              expressions: [
                { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Paid Search' }}},
                { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Display' }}},
                { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { matchType: 'EXACT', value: 'Paid Video' }}}
              ]
            }
          }
        });
        
        let retryTotalSessions = 0;
        let retryTotalUsers = 0;
        let retryTotalConversions = 0;
        
        console.log('\n📈 Google Ads Traffic (without bounce rate):');
        retryResponse.rows?.forEach((row) => {
          const channelGroup = row.dimensionValues[0].value;
          const sessions = parseInt(row.metricValues[0].value);
          const users = parseInt(row.metricValues[1].value);
          const conversions = parseFloat(row.metricValues[2].value);
          
          retryTotalSessions += sessions;
          retryTotalUsers += users;
          retryTotalConversions += conversions;
          
          console.log(`${channelGroup}: ${sessions} sessions, ${users} users, ${conversions} conversions`);
        });
        
        console.log(`\n🎯 Total: ${retryTotalSessions} sessions, ${retryTotalUsers} users, ${retryTotalConversions} conversions`);
        
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError.message);
      }
    }
  }
}

getCompleteGoogleAdsData();