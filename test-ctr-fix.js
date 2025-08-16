#!/usr/bin/env node

/**
 * Test CTR calculation fix
 */

import { GoogleAdsCore } from './src/core/ads-core-enhanced.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCTRCalculation() {
  console.log('🔍 Testing CTR calculation fix...\n');
  
  try {
    const adsCore = new GoogleAdsCore();
    
    // Test with current date range (last 30 days)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Yesterday
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 29); // 30 days before yesterday
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Date Range: ${startDateStr} to ${endDateStr}\n`);
    
    // Get ads metrics (impressions, clicks, CTR from Google Ads API)
    console.log('🔍 Getting Google Ads metrics...');
    const adsMetrics = await adsCore.getAdsMetrics(startDateStr, endDateStr);
    
    console.log(`  Total Impressions: ${adsMetrics.impressions.toLocaleString()}`);
    console.log(`  Total Clicks (from API): ${adsMetrics.clicks.toLocaleString()}`);
    console.log(`  CTR (from API): ${adsMetrics.ctr}${adsMetrics.ctr < 1 ? ' (decimal)' : '%'}`);
    
    // Get campaign spend data to calculate total clicks from individual campaigns
    console.log('\n🔍 Getting campaign spend data...');
    const campaignData = await adsCore.getCampaignSpend(startDateStr, endDateStr, true);
    
    // Calculate total clicks from all campaigns (same logic as Campaign Performance Details)
    const totalClicks = campaignData.campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
    
    console.log(`  Total Clicks (from campaigns): ${totalClicks.toLocaleString()}`);
    console.log(`  Active Campaigns: ${campaignData.campaigns.length}`);
    
    // Calculate CTR using our formula: (Total Clicks / Total Impressions) * 100
    let calculatedCTR = 0;
    if (adsMetrics.impressions > 0) {
      calculatedCTR = (totalClicks / adsMetrics.impressions) * 100;
    }
    
    // Convert Google Ads CTR to percentage if it's in decimal format
    let googleAdsCTR = adsMetrics.ctr;
    if (googleAdsCTR < 1) {
      googleAdsCTR = googleAdsCTR * 100;
    }
    
    console.log('\n📊 CTR COMPARISON:');
    console.log('=' .repeat(50));
    console.log(`Google Ads API CTR:     ${googleAdsCTR.toFixed(3)}%`);
    console.log(`Calculated CTR:         ${calculatedCTR.toFixed(3)}%`);
    console.log(`Formula Used:           ${totalClicks} ÷ ${adsMetrics.impressions.toLocaleString()} × 100`);
    
    const difference = Math.abs(googleAdsCTR - calculatedCTR);
    console.log(`Difference:             ${difference.toFixed(3)}%`);
    
    if (difference < 0.1) {
      console.log('\n✅ CTR values match closely - calculation is accurate!');
    } else {
      console.log('\n⚠️ CTR values differ significantly - may indicate different data sources');
    }
    
    console.log(`\nRecommendation: Use calculated CTR (${calculatedCTR.toFixed(2)}%) for consistency with Campaign Performance Details table.`);
    
  } catch (error) {
    console.error('❌ Error testing CTR calculation:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testCTRCalculation().catch(console.error);