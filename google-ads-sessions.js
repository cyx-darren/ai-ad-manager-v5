#!/usr/bin/env node

require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function getGoogleAdsSessions() {
  try {
    console.log('📊 Querying Google Ads sessions for June 2025...');
    console.log('Property ID:', process.env.GA_PROPERTY_ID);
    
    const analyticsDataClient = new BetaAnalyticsDataClient();

    // Query sessions from Google Ads traffic for June 2025
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
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          stringFilter: {
            matchType: 'EXACT',
            value: 'Paid Search'
          }
        }
      }
    });

    console.log('\n✅ Query successful!');
    
    let totalSessions = 0;
    let totalUsers = 0;
    
    if (response.rows && response.rows.length > 0) {
      console.log('\n📈 Google Ads Sessions - June 2025:');
      console.log('='.repeat(50));
      
      response.rows.forEach((row) => {
        const channelGroup = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        totalSessions += sessions;
        totalUsers += users;
        console.log(`${channelGroup}: ${sessions} sessions, ${users} users`);
      });
    } else {
      console.log('\n📊 No Google Ads traffic found for June 2025');
    }

    console.log('='.repeat(50));
    console.log(`🎯 Total Google Ads Sessions (June 2025): ${totalSessions}`);
    console.log(`👥 Total Google Ads Users (June 2025): ${totalUsers}`);

    // Also try with more specific source/medium filter
    console.log('\n🔍 Trying alternative query with source/medium filter...');
    
    const [altResponse] = await analyticsDataClient.runReport({
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

    let altTotalSessions = 0;
    let altTotalUsers = 0;
    
    if (altResponse.rows && altResponse.rows.length > 0) {
      console.log('\n📈 Alternative query results (source/medium):');
      console.log('='.repeat(50));
      
      console.log('\n📋 All source/medium combinations found:');
      altResponse.rows.forEach((row) => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        console.log(`   ${source}/${medium}: ${sessions} sessions, ${users} users`);
        
        // Filter for Google Ads traffic (google/cpc or googleads)
        if ((source.toLowerCase().includes('google') && medium === 'cpc') || 
            source.toLowerCase().includes('googleads')) {
          altTotalSessions += sessions;
          altTotalUsers += users;
        }
      });
      
      console.log('\n📈 Google Ads traffic breakdown:');
      altResponse.rows.forEach((row) => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        // Show only Google Ads traffic
        if ((source.toLowerCase().includes('google') && medium === 'cpc') || 
            source.toLowerCase().includes('googleads')) {
          console.log(`   ✓ ${source}/${medium}: ${sessions} sessions, ${users} users`);
        }
      });
    }

    console.log('='.repeat(50));
    console.log(`🎯 Alternative Total Google Ads Sessions (June 2025): ${altTotalSessions}`);
    console.log(`👥 Alternative Total Google Ads Users (June 2025): ${altTotalUsers}`);

  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 3) {
      console.error('\n💡 Possible issues:');
      console.error('   1. Date range might be in the future');
      console.error('   2. No data available for June 2025');
      console.error('   3. Dimension filter syntax might be incorrect');
    }
  }
}

getGoogleAdsSessions();