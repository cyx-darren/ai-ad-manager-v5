#!/usr/bin/env node

require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

async function getChannelBreakdown() {
  try {
    console.log('📊 Getting all channel breakdown for June 2025...');
    console.log('Property ID:', process.env.GA_PROPERTY_ID);
    
    const analyticsDataClient = new BetaAnalyticsDataClient();

    // Query all traffic channels for June 2025
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
      orderBys: [
        {
          metric: {
            metricName: 'sessions'
          },
          desc: true
        }
      ]
    });

    console.log('\n✅ Query successful!');
    
    let totalSessions = 0;
    let totalUsers = 0;
    
    if (response.rows && response.rows.length > 0) {
      console.log('\n📈 All Traffic Channels - June 2025:');
      console.log('='.repeat(70));
      console.log('Rank | Channel                | Sessions  | Users     | % Sessions');
      console.log('='.repeat(70));
      
      response.rows.forEach((row, index) => {
        const channelGroup = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        totalSessions += sessions;
        totalUsers += users;
      });

      // Second pass to calculate percentages
      response.rows.forEach((row, index) => {
        const channelGroup = row.dimensionValues[0].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        const percentage = ((sessions / totalSessions) * 100).toFixed(1);
        
        const rank = (index + 1).toString().padStart(2, ' ');
        const channel = channelGroup.padEnd(20, ' ');
        const sessionsFormatted = sessions.toLocaleString().padStart(8, ' ');
        const usersFormatted = users.toLocaleString().padStart(8, ' ');
        
        console.log(`${rank}   | ${channel} | ${sessionsFormatted} | ${usersFormatted} | ${percentage}%`);
      });
    } else {
      console.log('\n📊 No traffic data found for June 2025');
    }

    console.log('='.repeat(70));
    console.log(`     | TOTAL              | ${totalSessions.toLocaleString().padStart(8, ' ')} | ${totalUsers.toLocaleString().padStart(8, ' ')} | 100.0%`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Error code:', error.code);
  }
}

getChannelBreakdown();