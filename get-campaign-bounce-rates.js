#!/usr/bin/env node

/**
 * Script to get bounce rates for all 3 campaigns using Google Analytics MCP infrastructure
 */

import { GoogleAnalyticsCore } from './src/core/analytics-core.js';
import dotenv from 'dotenv';

dotenv.config();

async function getCampaignBounceRates() {
  console.log('🎯 Getting bounce rates for all campaigns...\n');
  
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Calculate date range (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    
    console.log(`📅 Date Range: ${startDate} to ${endDate}\n`);
    
    // Get campaign data with bounce rates
    console.log('📊 Querying campaign bounce rates...');
    const campaignData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName', 'defaultChannelGroup'],
      metrics: ['sessions', 'bounceRate'],
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
      limit: 100
    });
    
    // Process and display the results
    const campaigns = [];
    
    if (campaignData.rows) {
      campaignData.rows.forEach(row => {
        if (row.dimensionValues && row.dimensionValues[0]) {
          const campaignName = row.dimensionValues[0].value;
          const channel = row.dimensionValues[1]?.value || 'Unknown';
          
          if (campaignName && campaignName !== '(not set)' && campaignName !== '(direct)') {
            const sessionMetricIndex = campaignData.metricHeaders?.findIndex(h => h.name === 'sessions');
            const bounceRateIndex = campaignData.metricHeaders?.findIndex(h => h.name === 'bounceRate');
            
            const sessions = sessionMetricIndex >= 0 ? parseInt(row.metricValues[sessionMetricIndex].value || 0) : 0;
            const bounceRate = bounceRateIndex >= 0 ? parseFloat(row.metricValues[bounceRateIndex].value || 0) : 0;
            
            campaigns.push({
              name: campaignName,
              channel,
              sessions,
              bounceRate: (bounceRate * 100).toFixed(2) // Convert to percentage
            });
          }
        }
      });
    }
    
    // Sort by sessions (highest first)
    campaigns.sort((a, b) => b.sessions - a.sessions);
    
    console.log('\n🎯 Campaign Bounce Rates:');
    console.log('=' .repeat(80));
    console.log('Campaign Name'.padEnd(40) + 'Channel'.padEnd(15) + 'Sessions'.padStart(10) + 'Bounce Rate'.padStart(15));
    console.log('-'.repeat(80));
    
    campaigns.forEach((campaign, index) => {
      const campaignNameTruncated = campaign.name.length > 37 ? 
        campaign.name.substring(0, 34) + '...' : 
        campaign.name;
      
      console.log(
        `${campaignNameTruncated.padEnd(40)}${campaign.channel.padEnd(15)}${campaign.sessions.toString().padStart(10)}${(campaign.bounceRate + '%').padStart(15)}`
      );
    });
    
    console.log('-'.repeat(80));
    console.log(`Total Campaigns: ${campaigns.length}`);
    
    // Calculate overall bounce rate (weighted by sessions)
    const totalSessions = campaigns.reduce((sum, campaign) => sum + campaign.sessions, 0);
    const weightedBounceRate = campaigns.reduce((sum, campaign) => 
      sum + (parseFloat(campaign.bounceRate) * campaign.sessions), 0
    );
    const overallBounceRate = totalSessions > 0 ? (weightedBounceRate / totalSessions).toFixed(2) : 0;
    
    console.log(`Overall Bounce Rate (weighted): ${overallBounceRate}%`);
    
    // Show top 3 campaigns specifically
    console.log('\n🏆 Top 3 Campaigns by Sessions:');
    console.log('=' .repeat(50));
    campaigns.slice(0, 3).forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.name}`);
      console.log(`   Channel: ${campaign.channel}`);
      console.log(`   Sessions: ${campaign.sessions}`);
      console.log(`   Bounce Rate: ${campaign.bounceRate}%\n`);
    });
    
  } catch (error) {
    console.error('❌ Error querying bounce rates:', error.message);
    console.log('\n💡 This might be due to:');
    console.log('   - Google Analytics API credentials not configured');
    console.log('   - Insufficient permissions');
    console.log('   - bounceRate metric not available for your property');
    console.log('\n🔧 Try running one of the existing test scripts first to verify GA4 connection');
  }
}

// Run the script
getCampaignBounceRates().catch(console.error);