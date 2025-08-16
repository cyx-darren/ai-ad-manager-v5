#!/usr/bin/env node

/**
 * Test script to directly query the dashboard API and check values
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testDashboardAPI() {
  try {
    console.log('🔍 Testing Dashboard API directly...\n');
    
    // Calculate date range (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);
    console.log('🌐 Calling API endpoint...');
    
    const response = await fetch(
      `http://localhost:5050/api/dashboard/metrics?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer fake-token-for-testing` // This won't work but helps us see the flow
        }
      }
    );
    
    console.log('📊 Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n📈 Dashboard API Results:');
    console.log('========================');
    console.log(`Total Campaigns: ${data.totalCampaigns} ${data.mockDataFields?.includes('totalCampaigns') ? '(Mock)' : '(Real)'}`);
    console.log(`Total Sessions: ${data.totalSessions} ${data.metadata?.dataSource?.ga4 === 'success' ? '(GA4)' : '(Fallback)'}`);
    console.log(`Total Users: ${data.totalUsers} ${data.metadata?.dataSource?.ga4 === 'success' ? '(GA4)' : '(Fallback)'}`);
    console.log(`Bounce Rate: ${data.avgBounceRate}% ${data.metadata?.dataSource?.ga4 === 'success' ? '(GA4)' : '(Fallback)'}`);
    console.log(`Conversions: ${data.conversions} ${data.metadata?.dataSource?.ga4 === 'success' ? '(Calculated from GA4)' : '(Fallback)'}`);
    console.log(`Total Impressions: ${data.totalImpressions} ${data.mockDataFields?.includes('totalImpressions') ? '(Mock)' : '(Real)'}`);
    console.log(`Click Rate: ${data.clickRate}% ${data.mockDataFields?.includes('clickRate') ? '(Mock)' : '(Real)'}`);
    console.log(`Total Spend: $${data.totalSpend} (Database)`);
    
    console.log('\n🔍 Data Source Details:');
    console.log('=====================');
    console.log('GA4 Status:', data.metadata?.dataSource?.ga4);
    console.log('GA4 Error:', data.metadata?.dataSource?.ga4Error || 'None');
    console.log('Spend Status:', data.metadata?.dataSource?.spend);
    console.log('Mock Data Fields:', data.mockDataFields?.join(', ') || 'None');
    
    if (data.warnings && data.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      data.warnings.forEach(warning => console.log(`- ${warning}`));
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard API:', error.message);
  }
}

// Run the test
testDashboardAPI().catch(console.error);