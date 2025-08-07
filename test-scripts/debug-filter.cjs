#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function debugFilter() {
  try {
    console.log('🔍 Debugging the source/medium filter...');
    
    const analyticsDataClient = new BetaAnalyticsDataClient();

    // Same query as Method 2 but show ALL results
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
      ],
      dimensions: [
        {
          name: 'sessionSource',
        },
        {
          name: 'sessionMedium',
        },
        {
          name: 'sessionDefaultChannelGroup',
        },
      ],
      dimensionFilter: {
        orGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'sessionSource',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value: 'google'
                }
              }
            },
            {
              filter: {
                fieldName: 'sessionMedium',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'cpc'
                }
              }
            }
          ]
        }
      }
    });

    console.log('\n📊 All source/medium combinations with "google" or "cpc":');
    console.log('='.repeat(85));
    console.log('Source/Medium'.padEnd(35) + 'Channel Group'.padEnd(20) + 'Sessions'.padStart(10) + 'Users'.padStart(8));
    console.log('='.repeat(85));

    let actualAdsSessions = 0;
    let actualAdsUsers = 0;
    let organicSessions = 0;
    let otherSessions = 0;

    response.rows?.forEach((row) => {
      const source = row.dimensionValues[0].value;
      const medium = row.dimensionValues[1].value;
      const channelGroup = row.dimensionValues[2].value;
      const sessions = parseInt(row.metricValues[0].value);
      const users = parseInt(row.metricValues[1].value);
      
      const sourcemedium = `${source}/${medium}`.padEnd(35);
      const channel = channelGroup.padEnd(20);
      const sessionsStr = sessions.toString().padStart(10);
      const usersStr = users.toString().padStart(8);
      
      console.log(`${sourcemedium}${channel}${sessionsStr}${usersStr}`);
      
      // Categorize
      if (channelGroup === 'Paid Search') {
        actualAdsSessions += sessions;
        actualAdsUsers += users;
      } else if (channelGroup === 'Organic Search') {
        organicSessions += sessions;
      } else {
        otherSessions += sessions;
      }
    });

    console.log('='.repeat(85));
    console.log('\n📈 Summary:');
    console.log(`Actual Google Ads (Paid Search channel): ${actualAdsSessions} sessions, ${actualAdsUsers} users`);
    console.log(`Organic Search: ${organicSessions} sessions`);
    console.log(`Other channels: ${otherSessions} sessions`);
    console.log(`Total captured by filter: ${actualAdsSessions + organicSessions + otherSessions} sessions`);
    
    console.log('\n💡 The issue: My filter caught ALL Google traffic, not just ads!');

  } catch (error) {
    console.error('❌ Query failed:', error.message);
  }
}

debugFilter();