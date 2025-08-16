#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function getAllGoogleAdsChannels() {
  try {
    console.log('📊 Querying all Google Ads channels (Paid Search, Display, Paid Video) for June 2025...');
    console.log('Property ID:', process.env.GA_PROPERTY_ID);
    
    const analyticsDataClient = new BetaAnalyticsDataClient();

    // Query sessions from all Google Ads channels for June 2025
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
    let channelBreakdown = {
      'Paid Search': { sessions: 0, users: 0 },
      'Display': { sessions: 0, users: 0 },
      'Paid Video': { sessions: 0, users: 0 }
    };
    
    if (response.rows && response.rows.length > 0) {
      console.log('\n📈 Google Ads Sessions by Channel - June 2025:');
      console.log('='.repeat(60));
      
      response.rows.forEach((row) => {
        const channelGroup = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        totalSessions += sessions;
        totalUsers += users;
        
        if (channelBreakdown[channelGroup]) {
          channelBreakdown[channelGroup].sessions = sessions;
          channelBreakdown[channelGroup].users = users;
        }
        
        console.log(`${channelGroup}: ${sessions.toLocaleString()} sessions, ${users.toLocaleString()} users`);
      });
    } else {
      console.log('\n📊 No Google Ads traffic found for June 2025');
    }

    console.log('='.repeat(60));
    console.log(`🎯 Total Google Ads Sessions (All Channels - June 2025): ${totalSessions.toLocaleString()}`);
    console.log(`👥 Total Google Ads Users (All Channels - June 2025): ${totalUsers.toLocaleString()}`);
    
    // Show breakdown
    console.log('\n📊 Channel Breakdown:');
    Object.entries(channelBreakdown).forEach(([channel, data]) => {
      if (data.sessions > 0) {
        console.log(`   ✓ ${channel}: ${data.sessions.toLocaleString()} sessions (${data.users.toLocaleString()} users)`);
      } else {
        console.log(`   - ${channel}: No traffic found`);
      }
    });

  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 3) {
      console.error('\n💡 Possible issues:');
      console.error('   1. Date range might be in the future');
      console.error('   2. No data available for June 2025');
      console.error('   3. Channel groups might not have data');
    }
  }
}

getAllGoogleAdsChannels();