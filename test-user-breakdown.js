import dotenv from 'dotenv';
import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

dotenv.config();

async function getUserBreakdown() {
  const analyticsCore = new GoogleAnalyticsCore();
  
  try {
    console.log('🔍 Fetching Total Users breakdown by paid channel...\n');
    
    await analyticsCore.initialize();
    
    // June 2025 date range
    const startDate = '2025-06-01';
    const endDate = '2025-06-30';
    
    // Query GA4 for each paid channel
    const result = await analyticsCore.queryAnalytics({
      dimensions: ['sessionDefaultChannelGroup'],
      metrics: ['totalUsers', 'sessions'],
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
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);
    console.log('📊 BREAKDOWN OF TOTAL USERS BY PAID CHANNEL:');
    console.log('=' .repeat(50));
    
    let grandTotalUsers = 0;
    let grandTotalSessions = 0;
    const breakdown = [];
    
    if (result && result.rows) {
      result.rows.forEach(row => {
        const channel = row.dimensionValues[0].value;
        const users = parseInt(row.metricValues[0].value);
        const sessions = parseInt(row.metricValues[1].value);
        
        grandTotalUsers += users;
        grandTotalSessions += sessions;
        
        breakdown.push({ channel, users, sessions });
      });
      
      // Sort by users descending
      breakdown.sort((a, b) => b.users - a.users);
      
      // Display breakdown
      breakdown.forEach(item => {
        const percentage = ((item.users / grandTotalUsers) * 100).toFixed(1);
        console.log(`\n📍 ${item.channel}:`);
        console.log(`   Users: ${item.users.toLocaleString()} (${percentage}%)`);
        console.log(`   Sessions: ${item.sessions.toLocaleString()}`);
      });
      
      console.log('\n' + '=' .repeat(50));
      console.log(`\n🎯 TOTAL USERS (All Paid Channels): ${grandTotalUsers.toLocaleString()}`);
      console.log(`📈 TOTAL SESSIONS (All Paid Channels): ${grandTotalSessions.toLocaleString()}`);
      
      // Show what the dashboard would display
      console.log('\n' + '=' .repeat(50));
      console.log('ℹ️  This is the "Total Users" value shown in the dashboard metric card');
      
    } else {
      console.log('No data found for the specified date range and channels.');
    }
    
  } catch (error) {
    console.error('❌ Error fetching user breakdown:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

getUserBreakdown();