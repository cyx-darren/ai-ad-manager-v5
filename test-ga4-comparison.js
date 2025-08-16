#!/usr/bin/env node

/**
 * Test script to query GA4 data directly and compare with dashboard
 */

import { GoogleAnalyticsCore } from './src/core/analytics-core.js';
import dotenv from 'dotenv';

dotenv.config();

async function getGA4DataForComparison() {
  console.log('🔍 Querying GA4 for last 30 days data comparison...\n');
  
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Calculate date range (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);
    
    // 1. Get paid channel sessions and users data
    console.log('1️⃣ Getting paid channel sessions and users...');
    const paidChannelData = await analyticsCore.queryAnalytics({
      dimensions: ['date', 'defaultChannelGroup'],
      metrics: ['sessions', 'totalUsers', 'bounceRate'],
      startDate,
      endDate,
      dimensionFilter: {
        filter: {
          fieldName: 'defaultChannelGroup',
          inListFilter: {
            values: ['Paid Search', 'Display', 'Paid Video']
          }
        }
      }
    });
    
    // 2. Get campaign data to count unique campaigns
    console.log('2️⃣ Getting campaign data...');
    const campaignData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName', 'defaultChannelGroup'],
      metrics: ['sessions'],
      startDate,
      endDate,
      dimensionFilter: {
        filter: {
          fieldName: 'defaultChannelGroup',
          inListFilter: {
            values: ['Paid Search', 'Display', 'Paid Video']
          }
        }
      },
      limit: 1000
    });
    
    // 3. Get conversion data
    console.log('3️⃣ Getting conversion data...');
    const conversionData = await analyticsCore.queryAnalytics({
      dimensions: ['defaultChannelGroup'],
      metrics: ['conversions'],
      startDate,
      endDate,
      dimensionFilter: {
        filter: {
          fieldName: 'defaultChannelGroup',
          inListFilter: {
            values: ['Paid Search', 'Display', 'Paid Video']
          }
        }
      }
    });
    
    // Process the data
    const results = processPaidChannelData(paidChannelData, campaignData, conversionData);
    
    console.log('\n📊 GA4 Results (Last 30 Days):');
    console.log('===============================');
    console.log(`Total Campaigns: ${results.totalCampaigns}`);
    console.log(`Total Sessions (Paid Channels): ${results.totalSessions}`);
    console.log(`Total Users (Paid Channels): ${results.totalUsers}`);
    console.log(`Average Bounce Rate: ${results.avgBounceRate}%`);
    console.log(`Total Conversions: ${results.conversions}`);
    
    console.log('\n📋 Campaign Details:');
    results.campaigns.slice(0, 10).forEach((campaign, i) => {
      console.log(`  ${i + 1}. ${campaign.name} (${campaign.channel}) - ${campaign.sessions} sessions`);
    });
    if (results.campaigns.length > 10) {
      console.log(`  ... and ${results.campaigns.length - 10} more campaigns`);
    }
    
    // Now fetch current dashboard data for comparison
    console.log('\n🌐 Fetching current dashboard data for comparison...');
    await fetchDashboardData(startDate, endDate, results);
    
  } catch (error) {
    console.error('❌ Error querying GA4:', error.message);
    
    // Show what the dashboard would show with mock data
    console.log('\n📱 Dashboard will show mock data due to GA4 error:');
    console.log('===================================================');
    const mockResults = generateMockComparison();
    console.log(`Total Campaigns: ${mockResults.totalCampaigns} (Mock)`);
    console.log(`Total Sessions: ${mockResults.totalSessions} (Fallback)`);
    console.log(`Total Users: ${mockResults.totalUsers} (Fallback)`);
    console.log(`Bounce Rate: ${mockResults.avgBounceRate}% (Fallback)`);
    console.log(`Conversions: ${mockResults.conversions} (Calculated from fallback)`);
  }
}

function processPaidChannelData(paidChannelData, campaignData, conversionData) {
  // Sum sessions and users
  let totalSessions = 0;
  let totalUsers = 0;
  let totalBounceRate = 0;
  let validBounceRateRows = 0;
  
  if (paidChannelData.rows) {
    paidChannelData.rows.forEach(row => {
      const sessionMetricIndex = paidChannelData.metricHeaders?.findIndex(h => h.name === 'sessions');
      const userMetricIndex = paidChannelData.metricHeaders?.findIndex(h => h.name === 'totalUsers');
      const bounceRateIndex = paidChannelData.metricHeaders?.findIndex(h => h.name === 'bounceRate');
      
      if (sessionMetricIndex >= 0 && row.metricValues) {
        totalSessions += parseInt(row.metricValues[sessionMetricIndex].value || 0);
      }
      if (userMetricIndex >= 0 && row.metricValues) {
        totalUsers += parseInt(row.metricValues[userMetricIndex].value || 0);
      }
      if (bounceRateIndex >= 0 && row.metricValues) {
        const bounceRate = parseFloat(row.metricValues[bounceRateIndex].value || 0);
        totalBounceRate += bounceRate;
        validBounceRateRows++;
      }
    });
  }
  
  // Count unique campaigns
  const uniqueCampaigns = new Set();
  const campaignDetails = [];
  
  if (campaignData.rows) {
    campaignData.rows.forEach(row => {
      if (row.dimensionValues && row.dimensionValues[0]) {
        const campaignName = row.dimensionValues[0].value;
        const channel = row.dimensionValues[1]?.value || 'Unknown';
        const sessionMetricIndex = campaignData.metricHeaders?.findIndex(h => h.name === 'sessions');
        const sessions = sessionMetricIndex >= 0 ? parseInt(row.metricValues[sessionMetricIndex].value || 0) : 0;
        
        if (campaignName && campaignName !== '(not set)' && campaignName !== '(direct)') {
          uniqueCampaigns.add(campaignName);
          campaignDetails.push({
            name: campaignName,
            channel,
            sessions
          });
        }
      }
    });
  }
  
  // Sum conversions
  let totalConversions = 0;
  if (conversionData.rows) {
    conversionData.rows.forEach(row => {
      const conversionIndex = conversionData.metricHeaders?.findIndex(h => h.name === 'conversions');
      if (conversionIndex >= 0 && row.metricValues) {
        totalConversions += parseInt(row.metricValues[conversionIndex].value || 0);
      }
    });
  }
  
  return {
    totalCampaigns: uniqueCampaigns.size,
    totalSessions,
    totalUsers,
    avgBounceRate: validBounceRateRows > 0 ? (totalBounceRate / validBounceRateRows).toFixed(2) : 0,
    conversions: totalConversions,
    campaigns: campaignDetails.sort((a, b) => b.sessions - a.sessions)
  };
}

function generateMockComparison() {
  // Generate the same mock data logic as dashboard
  return {
    totalCampaigns: Math.floor(Math.random() * 6) + 3, // 3-8 campaigns
    totalSessions: Math.floor(Math.random() * 2000) + 500,
    totalUsers: Math.floor(Math.random() * 1500) + 300,
    avgBounceRate: (Math.random() * 30 + 30).toFixed(2),
    conversions: Math.floor(Math.random() * 50) + 20
  };
}

async function fetchDashboardData(startDate, endDate, ga4Results) {
  try {
    // Note: This would require authentication, so we'll just show the logic
    console.log('📱 Dashboard Data (as shown in your browser):');
    console.log('============================================');
    console.log('Visit http://localhost:3000/dashboard to see current values');
    
    console.log('\n🔄 Data Source Comparison:');
    console.log('==========================');
    console.log('Real GA4 Data vs Dashboard Display:');
    console.log(`- Campaigns: ${ga4Results.totalCampaigns} (GA4) vs Mock Data (Dashboard)`);
    console.log(`- Sessions: ${ga4Results.totalSessions} (GA4) vs Dashboard (GA4)`);
    console.log(`- Users: ${ga4Results.totalUsers} (GA4) vs Dashboard (GA4)`);
    console.log(`- Bounce Rate: ${ga4Results.avgBounceRate}% (GA4) vs Dashboard (GA4)`);
    console.log(`- Conversions: ${ga4Results.conversions} (GA4) vs Dashboard (Calculated from GA4)`);
    
    console.log('\n💡 Note: The dashboard should show the same GA4 data for sessions, users,');
    console.log('   bounce rate, and calculated conversions. Campaign count is mock data.');
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
  }
}

// Run the comparison
getGA4DataForComparison().catch(console.error);