#!/usr/bin/env node

/**
 * Check for impressions data in June 2025 campaigns using Google Analytics MCP
 */

import { GoogleAnalyticsCore } from './src/core/analytics-core.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkJune2025Impressions() {
  console.log('👁️ Checking for impressions data in June 2025 campaigns...\n');
  
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // June 2025 date range
    const startDate = '2025-06-01';
    const endDate = '2025-06-30';
    
    console.log(`📅 Date Range: ${startDate} to ${endDate} (June 2025)\n`);
    
    // Try multiple approaches to find impressions data
    
    // 1. Try with Google Ads impressions metrics
    console.log('📊 1. Checking for Google Ads impressions metrics...');
    try {
      const impressionsData = await analyticsCore.queryAnalytics({
        dimensions: ['sessionCampaignName'],
        metrics: ['sessions', 'googleAdsImpressions', 'googleAdsClicks', 'googleAdsCost'],
        startDate,
        endDate,
        limit: 20
      });
      
      if (impressionsData.rows && impressionsData.rows.length > 0) {
        console.log('✅ Found Google Ads impressions data!');
        console.log('Impressions data:');
        
        const campaigns = [];
        impressionsData.rows.forEach(row => {
          if (row.dimensionValues && row.metricValues) {
            const campaign = row.dimensionValues[0]?.value;
            const sessions = row.metricValues[0]?.value;
            const impressions = row.metricValues[1]?.value;
            const clicks = row.metricValues[2]?.value;
            const cost = row.metricValues[3]?.value;
            
            if (campaign && campaign !== '(not set)') {
              campaigns.push({
                campaign,
                sessions: parseInt(sessions || 0),
                impressions: parseInt(impressions || 0),
                clicks: parseInt(clicks || 0),
                cost: parseFloat(cost || 0)
              });
            }
          }
        });
        
        if (campaigns.length > 0) {
          console.log('\n📋 Campaign Impressions for June 2025:');
          console.log('=' .repeat(80));
          console.log('Campaign Name'.padEnd(30) + 'Sessions'.padStart(10) + 'Impressions'.padStart(12) + 'Clicks'.padStart(8) + 'Cost'.padStart(10));
          console.log('-'.repeat(80));
          
          campaigns.forEach(campaign => {
            const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0.00';
            console.log(
              `${campaign.campaign.substring(0, 27).padEnd(30)}${campaign.sessions.toString().padStart(10)}${campaign.impressions.toString().padStart(12)}${campaign.clicks.toString().padStart(8)}$${campaign.cost.toFixed(2).padStart(9)}`
            );
          });
          
          const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
          const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
          const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0);
          const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
          
          console.log('-'.repeat(80));
          console.log(`Total Impressions: ${totalImpressions.toLocaleString()}`);
          console.log(`Total Clicks: ${totalClicks.toLocaleString()}`);
          console.log(`Overall CTR: ${overallCTR}%`);
          console.log(`Total Cost: $${totalCost.toFixed(2)}`);
          
          return; // Success! Exit here
        }
      }
      console.log('❌ No Google Ads impressions data found\n');
    } catch (error) {
      console.log(`❌ Google Ads impressions query failed: ${error.message}\n`);
    }
    
    // 2. Try with advertiser metrics
    console.log('📊 2. Checking for advertiser impressions metrics...');
    try {
      const advertiserData = await analyticsCore.queryAnalytics({
        dimensions: ['sessionCampaignName', 'sessionSource'],
        metrics: ['sessions', 'advertiserAdImpressions', 'advertiserAdClicks', 'advertiserAdCost'],
        startDate,
        endDate,
        dimensionFilter: {
          filter: {
            fieldName: 'sessionSource',
            inListFilter: {
              values: ['google', 'GAds']
            }
          }
        },
        limit: 20
      });
      
      if (advertiserData.rows && advertiserData.rows.length > 0) {
        console.log('✅ Found advertiser impressions data!');
        console.log(JSON.stringify(advertiserData, null, 2));
        return;
      }
      console.log('❌ No advertiser impressions data found\n');
    } catch (error) {
      console.log(`❌ Advertiser impressions query failed: ${error.message}\n`);
    }
    
    // 3. Try with paid search specific metrics
    console.log('📊 3. Checking for paid search specific metrics...');
    try {
      const paidSearchData = await analyticsCore.queryAnalytics({
        dimensions: ['sessionCampaignName', 'sessionDefaultChannelGroup'],
        metrics: ['sessions', 'totalUsers'],
        startDate,
        endDate,
        dimensionFilter: {
          filter: {
            fieldName: 'sessionDefaultChannelGroup',
            stringFilter: {
              matchType: 'EXACT',
              value: 'Paid Search'
            }
          }
        },
        limit: 20
      });
      
      console.log('Paid Search campaigns (sessions only):');
      if (paidSearchData.rows && paidSearchData.rows.length > 0) {
        paidSearchData.rows.forEach((row, index) => {
          if (index < 5) {
            const campaign = row.dimensionValues[0]?.value;
            const sessions = row.metricValues[0]?.value;
            console.log(`  ${campaign}: ${sessions} sessions`);
          }
        });
      }
      console.log('❌ No impressions metrics available in this data\n');
    } catch (error) {
      console.log(`❌ Paid search query failed: ${error.message}\n`);
    }
    
    console.log('\n🔍 Impressions Data Analysis Results:');
    console.log('=' .repeat(60));
    console.log('❌ Impressions data is NOT available through Google Analytics');
    console.log('');
    console.log('💡 Why impressions data is not available:');
    console.log('   - Impressions are recorded in Google Ads, not GA4');
    console.log('   - GA4 only tracks users who actually click ads');
    console.log('   - Google Ads API integration would be needed');
    console.log('   - GA4 focuses on post-click behavior');
    console.log('');
    console.log('📊 Available GA4 Metrics for June 2025:');
    console.log('   ✅ Sessions (clicks that resulted in site visits)');
    console.log('   ✅ Users');
    console.log('   ✅ Bounce rate');
    console.log('   ✅ Conversions');
    console.log('   ❌ Impressions (ad views)');
    console.log('   ❌ CTR (click-through rate)');
    console.log('');
    console.log('🔧 To get impressions data, you need:');
    console.log('   1. Google Ads API integration');
    console.log('   2. Google Ads campaign reports');
    console.log('   3. Access to Google Ads account data');
    
  } catch (error) {
    console.error('❌ Error checking for impressions data:', error.message);
  }
}

// Run the impressions check
checkJune2025Impressions().catch(console.error);