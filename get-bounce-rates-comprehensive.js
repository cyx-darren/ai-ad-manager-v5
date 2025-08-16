#!/usr/bin/env node

/**
 * Comprehensive script to get bounce rates using all available Google Analytics MCP tools
 */

import { GoogleAnalyticsCore } from './src/core/analytics-core.js';
import dotenv from 'dotenv';

dotenv.config();

async function getComprehensiveBounceRates() {
  console.log('🎯 Getting comprehensive bounce rate data using all available MCP tools...\n');
  
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Calculate date range (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);
    
    // 1. Get Traffic Sources Data
    console.log('🔍 1. Getting traffic sources data...');
    try {
      const trafficSources = await analyticsCore.getTrafficSources({
        startDate,
        endDate,
        limit: 100
      });
      
      console.log('Traffic Sources Response:');
      console.log(JSON.stringify(trafficSources, null, 2));
      console.log('\n');
    } catch (error) {
      console.log(`❌ Traffic sources error: ${error.message}\n`);
    }
    
    // 2. Get Page Performance Data
    console.log('📊 2. Getting page performance data...');
    try {
      const pagePerformance = await analyticsCore.getPagePerformance({
        startDate,
        endDate,
        limit: 100
      });
      
      console.log('Page Performance Response:');
      console.log(JSON.stringify(pagePerformance, null, 2));
      console.log('\n');
    } catch (error) {
      console.log(`❌ Page performance error: ${error.message}\n`);
    }
    
    // 3. Get Conversion Data
    console.log('💰 3. Getting conversion data...');
    try {
      const conversionData = await analyticsCore.getConversionData({
        startDate,
        endDate,
        limit: 100
      });
      
      console.log('Conversion Data Response:');
      console.log(JSON.stringify(conversionData, null, 2));
      console.log('\n');
    } catch (error) {
      console.log(`❌ Conversion data error: ${error.message}\n`);
    }
    
    // 4. Try different query_analytics approaches
    console.log('🔧 4. Trying different query_analytics approaches...\n');
    
    // 4a. Campaign and channel with bounce rate
    console.log('4a. Campaign + Channel + Bounce Rate:');
    try {
      const campaignBounce = await analyticsCore.queryAnalytics({
        dimensions: ['sessionCampaignName', 'sessionDefaultChannelGroup'],
        metrics: ['sessions', 'bounceRate', 'engagementRate'],
        startDate,
        endDate,
        limit: 50
      });
      
      console.log('Campaign Bounce Response:');
      console.log(JSON.stringify(campaignBounce, null, 2));
      console.log('\n');
    } catch (error) {
      console.log(`❌ Campaign bounce error: ${error.message}\n`);
    }
    
    // 4b. Source/Medium with bounce rate
    console.log('4b. Source/Medium + Bounce Rate:');
    try {
      const sourceMediumBounce = await analyticsCore.queryAnalytics({
        dimensions: ['sessionSource', 'sessionMedium'],
        metrics: ['sessions', 'bounceRate', 'engagementRate'],
        startDate,
        endDate,
        limit: 50
      });
      
      console.log('Source/Medium Bounce Response:');
      console.log(JSON.stringify(sourceMediumBounce, null, 2));
      console.log('\n');
    } catch (error) {
      console.log(`❌ Source/Medium bounce error: ${error.message}\n`);
    }
    
    // 4c. Just channel group with bounce rate
    console.log('4c. Channel Group + Bounce Rate:');
    try {
      const channelBounce = await analyticsCore.queryAnalytics({
        dimensions: ['sessionDefaultChannelGroup'],
        metrics: ['sessions', 'bounceRate', 'engagementRate', 'averageSessionDuration'],
        startDate,
        endDate,
        limit: 20
      });
      
      console.log('Channel Group Bounce Response:');
      console.log(JSON.stringify(channelBounce, null, 2));
      console.log('\n');
    } catch (error) {
      console.log(`❌ Channel group bounce error: ${error.message}\n`);
    }
    
    // 4d. Try with firstUserDefaultChannelGroup
    console.log('4d. First User Channel Group + Bounce Rate:');
    try {
      const firstUserChannelBounce = await analyticsCore.queryAnalytics({
        dimensions: ['firstUserDefaultChannelGroup'],
        metrics: ['sessions', 'bounceRate', 'engagementRate'],
        startDate,
        endDate,
        limit: 20
      });
      
      console.log('First User Channel Group Bounce Response:');
      console.log(JSON.stringify(firstUserChannelBounce, null, 2));
      console.log('\n');
    } catch (error) {
      console.log(`❌ First user channel group bounce error: ${error.message}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error in comprehensive bounce rate analysis:', error.message);
    console.log('\n💡 This might be due to:');
    console.log('   - Google Analytics API credentials not configured');
    console.log('   - Insufficient permissions');
    console.log('   - bounceRate metric not available for your property');
    console.log('   - Property might be using GA4 engagement metrics instead');
  }
}

// Run the comprehensive analysis
getComprehensiveBounceRates().catch(console.error);