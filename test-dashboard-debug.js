import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function testDashboardAPI() {
  console.log('🔍 Testing Dashboard API vs Direct GA4 Query\n');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Sign in to get auth token
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'darren@easyprintsg.com',
    password: 'darren123'
  });
  
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  const token = authData.session.access_token;
  console.log('✅ Authenticated successfully\n');
  
  // Test June 2025 date range
  const startDate = '2025-06-01';
  const endDate = '2025-06-30';
  
  try {
    // Call dashboard API
    const response = await fetch(
      `http://localhost:5050/api/dashboard/metrics?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const dashboardData = await response.json();
    
    console.log('📊 Dashboard API Response:');
    console.log(`   Total Users: ${dashboardData.totalUsers}`);
    console.log(`   Total Sessions: ${dashboardData.totalSessions}`);
    console.log(`   Date Range: ${dashboardData.metadata.dateRange.startDate} to ${dashboardData.metadata.dateRange.endDate}`);
    console.log(`   GA4 Status: ${dashboardData.metadata.dataSource.ga4}`);
    
    if (dashboardData.metadata.dataSource.ga4Error) {
      console.log(`   GA4 Error: ${dashboardData.metadata.dataSource.ga4Error}`);
    }
    
    // Now run direct GA4 query for comparison
    console.log('\n📈 Direct GA4 Query:');
    const { GoogleAnalyticsCore } = await import('./src/core/analytics-core.js');
    const analyticsCore = new GoogleAnalyticsCore();
    
    await analyticsCore.initialize();
    
    const ga4Data = await analyticsCore.queryAnalytics({
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
    
    let directTotalUsers = 0;
    let directTotalSessions = 0;
    
    if (ga4Data && ga4Data.rows) {
      ga4Data.rows.forEach(row => {
        const channel = row.dimensionValues[0].value;
        const users = parseInt(row.metricValues[0].value);
        const sessions = parseInt(row.metricValues[1].value);
        
        directTotalUsers += users;
        directTotalSessions += sessions;
        
        console.log(`   ${channel}: ${users} users, ${sessions} sessions`);
      });
    }
    
    console.log(`   Total Users: ${directTotalUsers}`);
    console.log(`   Total Sessions: ${directTotalSessions}`);
    
    // Compare results
    console.log('\n⚠️  COMPARISON:');
    console.log(`   Dashboard Total Users: ${dashboardData.totalUsers}`);
    console.log(`   Direct GA4 Total Users: ${directTotalUsers}`);
    console.log(`   Discrepancy: ${dashboardData.totalUsers - directTotalUsers} users`);
    
    console.log(`\n   Dashboard Total Sessions: ${dashboardData.totalSessions}`);
    console.log(`   Direct GA4 Total Sessions: ${directTotalSessions}`);
    console.log(`   Discrepancy: ${dashboardData.totalSessions - directTotalSessions} sessions`);
    
    if (dashboardData.totalUsers !== directTotalUsers) {
      console.log('\n❌ ISSUE FOUND: Dashboard is not returning correct GA4 data!');
    } else {
      console.log('\n✅ Values match correctly!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Sign out
  await supabase.auth.signOut();
}

testDashboardAPI();