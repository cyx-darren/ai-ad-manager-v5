#!/usr/bin/env node

/**
 * Get July 2025 campaign impressions data using Google Analytics MCP
 */

import { GoogleAnalyticsCore } from './src/core/analytics-core.js';
import dotenv from 'dotenv';

dotenv.config();

async function getJuly2025Impressions() {
  console.log('👁️ Getting impressions data for July 2025 campaigns...\n');
  
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // July 2025 date range
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    
    console.log(`📅 Date Range: ${startDate} to ${endDate} (July 2025)\n`);
    
    // Use the advertiser metrics approach that worked for June
    console.log('📊 Getting advertiser impressions data for July 2025...');
    
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
      console.log('✅ Found July 2025 impressions data!\n');
      
      const campaigns = [];
      advertiserData.rows.forEach(row => {
        if (row.dimensionValues && row.metricValues) {
          const campaign = row.dimensionValues[0]?.value;
          const source = row.dimensionValues[1]?.value;
          const sessions = parseInt(row.metricValues[0]?.value || 0);
          const impressions = parseInt(row.metricValues[1]?.value || 0);
          const clicks = parseInt(row.metricValues[2]?.value || 0);
          const cost = parseFloat(row.metricValues[3]?.value || 0);
          
          // Only include campaigns with actual impressions data
          if (campaign && campaign !== '(not set)' && campaign !== '(organic)' && impressions > 0) {
            const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
            campaigns.push({
              campaign,
              source,
              sessions,
              impressions,
              clicks,
              cost,
              ctr
            });
          }
        }
      });
      
      if (campaigns.length > 0) {
        // Sort by impressions (highest first)
        campaigns.sort((a, b) => b.impressions - a.impressions);
        
        console.log('📋 Campaign Impressions for July 2025:');
        console.log('=' .repeat(90));
        console.log('Campaign Name'.padEnd(30) + 'Source'.padEnd(8) + 'Sessions'.padStart(10) + 'Impressions'.padStart(12) + 'Clicks'.padStart(8) + 'CTR'.padStart(8) + 'Cost (SGD)'.padStart(12));
        console.log('-'.repeat(90));
        
        let totalSessions = 0;
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalCost = 0;
        
        campaigns.forEach(campaign => {
          const campaignNameTruncated = campaign.campaign.length > 27 ? 
            campaign.campaign.substring(0, 24) + '...' : 
            campaign.campaign;
          
          console.log(
            `${campaignNameTruncated.padEnd(30)}${campaign.source.padEnd(8)}${campaign.sessions.toString().padStart(10)}${campaign.impressions.toLocaleString().padStart(12)}${campaign.clicks.toString().padStart(8)}${(campaign.ctr + '%').padStart(8)}$${campaign.cost.toFixed(2).padStart(11)}`
          );
          
          totalSessions += campaign.sessions;
          totalImpressions += campaign.impressions;
          totalClicks += campaign.clicks;
          totalCost += campaign.cost;
        });
        
        const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
        
        console.log('-'.repeat(90));
        console.log(`Total Sessions: ${totalSessions.toLocaleString()}`);
        console.log(`Total Impressions: ${totalImpressions.toLocaleString()}`);
        console.log(`Total Clicks: ${totalClicks.toLocaleString()}`);
        console.log(`Overall CTR: ${overallCTR}%`);
        console.log(`Total Cost: $${totalCost.toFixed(2)} SGD`);
        
        console.log('\n📊 July 2025 Campaign Summary:');
        campaigns.forEach((campaign, index) => {
          console.log(`${index + 1}. ${campaign.campaign}: ${campaign.impressions.toLocaleString()} impressions (${campaign.ctr}% CTR)`);
        });
        
        console.log('\n📈 Performance Insights:');
        const bestCTR = campaigns.reduce((prev, current) => (parseFloat(current.ctr) > parseFloat(prev.ctr)) ? current : prev);
        const mostImpressions = campaigns.reduce((prev, current) => (current.impressions > prev.impressions) ? current : prev);
        const mostEfficient = campaigns.reduce((prev, current) => (current.sessions / current.cost > prev.sessions / prev.cost) ? current : prev);
        
        console.log(`🎯 Best CTR: ${bestCTR.campaign} (${bestCTR.ctr}%)`);
        console.log(`👁️ Most Impressions: ${mostImpressions.campaign} (${mostImpressions.impressions.toLocaleString()})`);
        console.log(`💰 Most Cost Efficient: ${mostEfficient.campaign} (${(mostEfficient.sessions / mostEfficient.cost).toFixed(2)} sessions per $)`);
        
      } else {
        console.log('❌ No campaigns with impressions data found for July 2025');
      }
    } else {
      console.log('❌ No impressions data found for July 2025');
    }
    
  } catch (error) {
    console.error('❌ Error getting July 2025 impressions:', error.message);
  }
}

// Run the July 2025 impressions analysis
getJuly2025Impressions().catch(console.error);