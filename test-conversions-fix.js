#!/usr/bin/env node

/**
 * Test script to verify that conversions values match between dashboard summary and Campaign Performance Details
 */

import { GoogleAnalyticsCore } from './src/core/analytics-core.js';
import dotenv from 'dotenv';

dotenv.config();

async function testConversionsMatch() {
  console.log('🔍 Testing conversions synchronization fix...\n');
  
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Test with current date range (last 30 days)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Yesterday
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 29); // 30 days before yesterday
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Date Range: ${startDateStr} to ${endDateStr}\n`);
    
    // Get conversions from dashboard summary (like main dashboard endpoint)
    console.log('📊 Getting dashboard summary conversions...');
    const conversionData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName', 'sessionDefaultChannelGroup'],
      metrics: ['conversions'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          inListFilter: {
            values: ['Paid Search', 'Display', 'Paid Video']
          }
        }
      }
    });
    
    let dashboardConversions = 0;
    if (conversionData && conversionData.rows) {
      conversionData.rows.forEach(row => {
        const campaignName = row.dimensionValues[0]?.value;
        const conversions = parseFloat(row.metricValues[0]?.value || 0);
        
        // Only count real campaigns - exclude GA4 placeholder values
        const excludedValues = ['(not set)', '(referral)', '(direct)', '(organic)', '(none)', '(cross-network)'];
        if (campaignName && !excludedValues.includes(campaignName) && conversions > 0) {
          console.log(`  Campaign: ${campaignName} - Conversions: ${conversions}`);
          dashboardConversions += conversions;
        }
      });
    }
    
    console.log(`📈 Dashboard Summary Total Conversions: ${Math.round(dashboardConversions)}\n`);
    
    // Get conversions from Campaign Performance Details (detailed campaign data)
    console.log('📋 Getting Campaign Performance Details conversions...');
    const campaignDetailsData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName'],
      metrics: ['sessions', 'engagementRate', 'totalUsers', 'eventCount', 'conversions'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        notExpression: {
          filter: {
            fieldName: 'sessionCampaignName',
            inListFilter: {
              values: ['(not set)', '(referral)', '(direct)', '(organic)', '(none)', '(cross-network)']
            }
          }
        }
      }
    });
    
    let campaignDetailsConversions = 0;
    const campaigns = [];
    
    if (campaignDetailsData && campaignDetailsData.rows) {
      campaignDetailsData.rows.forEach(row => {
        const campaignName = row.dimensionValues[0]?.value;
        const sessions = parseInt(row.metricValues[0]?.value || 0);
        const conversions = parseFloat(row.metricValues[4]?.value || 0);
        
        if (campaignName && sessions > 0) {
          console.log(`  Campaign: ${campaignName} - Sessions: ${sessions}, Conversions: ${conversions}`);
          campaigns.push({ name: campaignName, sessions, conversions });
          campaignDetailsConversions += conversions;
        }
      });
    }
    
    console.log(`📋 Campaign Performance Details Total Conversions: ${Math.round(campaignDetailsConversions)}\n`);
    
    // Compare the values
    const dashboardTotal = Math.round(dashboardConversions);
    const detailsTotal = Math.round(campaignDetailsConversions);
    
    console.log('🔍 COMPARISON RESULTS:');
    console.log('=' .repeat(50));
    console.log(`Dashboard Summary Conversions:     ${dashboardTotal}`);
    console.log(`Campaign Details Total:            ${detailsTotal}`);
    console.log(`Match Status:                      ${dashboardTotal === detailsTotal ? '✅ MATCH' : '❌ MISMATCH'}`);
    
    if (dashboardTotal === detailsTotal) {
      console.log('\n🎉 SUCCESS: Conversions values are now synchronized!');
      console.log('The fix has resolved the mismatch between dashboard summary and Campaign Performance Details.');
    } else {
      console.log(`\n❌ ISSUE: There is still a mismatch of ${Math.abs(dashboardTotal - detailsTotal)} conversions.`);
      console.log('Further investigation may be needed.');
    }
    
    console.log('\n📊 Individual Campaign Breakdown:');
    campaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.name}: ${campaign.conversions} conversions (${campaign.sessions} sessions)`);
    });
    
  } catch (error) {
    console.error('❌ Error testing conversions match:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testConversionsMatch().catch(console.error);