#!/usr/bin/env node

/**
 * Use Google Analytics MCP infrastructure to get July 2025 campaign bounce rates
 */

import { GoogleAnalyticsCore } from './src/core/analytics-core.js';
import dotenv from 'dotenv';

dotenv.config();

async function getJuly2025CampaignBounceRates() {
  console.log('📅 Using Google Analytics MCP to get July 2025 campaign bounce rates...\n');
  
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // July 2025 date range
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    
    console.log(`📅 Date Range: ${startDate} to ${endDate} (July 2025)\n`);
    
    // Use getTrafficSources MCP method
    console.log('🔍 Using MCP getTrafficSources for July 2025...');
    const trafficData = await analyticsCore.getTrafficSources({
      startDate,
      endDate,
      limit: 100
    });
    
    console.log('📊 Processing July 2025 campaign data...\n');
    
    // Extract paid campaigns with bounce rates
    const campaigns = [];
    
    if (trafficData.rows) {
      trafficData.rows.forEach(row => {
        if (row.dimensionValues && row.metricValues) {
          const source = row.dimensionValues[0]?.value || 'Unknown';
          const medium = row.dimensionValues[1]?.value || 'Unknown';
          const campaign = row.dimensionValues[2]?.value || 'Unknown';
          
          // Look for paid campaigns (google/cpc, GAds/CPC, etc.)
          if ((medium.toLowerCase() === 'cpc' || medium.toLowerCase() === 'CPC') && 
              (source.toLowerCase() === 'google' || source.toLowerCase() === 'gads')) {
            
            const sessions = parseInt(row.metricValues[0]?.value || 0);
            const users = parseInt(row.metricValues[1]?.value || 0);
            const bounceRate = parseFloat(row.metricValues[2]?.value || 0);
            const avgSessionDuration = parseFloat(row.metricValues[3]?.value || 0);
            
            if (campaign !== '(not set)' && campaign !== '(direct)' && sessions > 0) {
              campaigns.push({
                campaign,
                source,
                medium,
                sessions,
                users,
                bounceRate: (bounceRate * 100).toFixed(2),
                avgSessionDuration: avgSessionDuration.toFixed(1)
              });
            }
          }
        }
      });
    }
    
    // Also try direct campaign query
    console.log('🎯 Using MCP query_analytics for campaign-specific data...');
    try {
      const campaignData = await analyticsCore.queryAnalytics({
        dimensions: ['sessionCampaignName', 'sessionDefaultChannelGroup'],
        metrics: ['sessions', 'bounceRate', 'engagementRate'],
        startDate,
        endDate,
        dimensionFilter: {
          filter: {
            fieldName: 'sessionDefaultChannelGroup',
            inListFilter: {
              values: ['Paid Search', 'Display', 'Paid Video']
            }
          }
        },
        limit: 50
      });
      
      console.log('Direct campaign query results for July 2025:');
      if (campaignData.rows) {
        campaignData.rows.forEach(row => {
          if (row.dimensionValues && row.metricValues) {
            const campaignName = row.dimensionValues[0]?.value;
            const channel = row.dimensionValues[1]?.value;
            const sessions = parseInt(row.metricValues[0]?.value || 0);
            const bounceRate = parseFloat(row.metricValues[1]?.value || 0);
            const engagementRate = parseFloat(row.metricValues[2]?.value || 0);
            
            if (campaignName && campaignName !== '(not set)' && sessions > 0) {
              // Check if this campaign is already in our list
              const existingCampaign = campaigns.find(c => c.campaign === campaignName);
              if (!existingCampaign) {
                campaigns.push({
                  campaign: campaignName,
                  source: 'Google',
                  medium: 'CPC',
                  channel,
                  sessions,
                  users: '-',
                  bounceRate: (bounceRate * 100).toFixed(2),
                  engagementRate: (engagementRate * 100).toFixed(2),
                  avgSessionDuration: '-'
                });
              }
            }
          }
        });
      }
    } catch (queryError) {
      console.log(`Note: Direct campaign query failed: ${queryError.message}`);
    }
    
    if (campaigns.length === 0) {
      console.log('❌ No campaign data found for July 2025');
      console.log('\n💡 Possible reasons:');
      console.log('   - No paid campaigns were running in July 2025');
      console.log('   - Data may not be fully processed yet');
      console.log('   - Different campaign naming conventions were used');
      return;
    }
    
    // Sort by sessions
    campaigns.sort((a, b) => b.sessions - a.sessions);
    
    console.log('\n🎯 Campaign Bounce Rates for July 2025:');
    console.log('=' .repeat(85));
    console.log('Campaign Name'.padEnd(30) + 'Channel'.padEnd(15) + 'Sessions'.padStart(10) + 'Bounce Rate'.padStart(15) + 'Engagement'.padStart(15));
    console.log('-'.repeat(85));
    
    let totalSessions = 0;
    let weightedBounceRate = 0;
    
    campaigns.forEach((campaign) => {
      const campaignNameTruncated = campaign.campaign.length > 27 ? 
        campaign.campaign.substring(0, 24) + '...' : 
        campaign.campaign;
      
      const channel = campaign.channel || `${campaign.source}/${campaign.medium}`;
      const engagement = campaign.engagementRate ? `${campaign.engagementRate}%` : '-';
      
      console.log(
        `${campaignNameTruncated.padEnd(30)}${channel.padEnd(15)}${campaign.sessions.toString().padStart(10)}${(campaign.bounceRate + '%').padStart(15)}${engagement.padStart(15)}`
      );
      
      totalSessions += campaign.sessions;
      weightedBounceRate += (parseFloat(campaign.bounceRate) * campaign.sessions);
    });
    
    console.log('-'.repeat(85));
    console.log(`Total Sessions: ${totalSessions}`);
    console.log(`Total Campaigns: ${campaigns.length}`);
    
    const overallBounceRate = totalSessions > 0 ? (weightedBounceRate / totalSessions).toFixed(2) : 0;
    console.log(`Overall Bounce Rate (weighted): ${overallBounceRate}%`);
    
    console.log('\n📋 Summary of July 2025 Campaign Performance:');
    campaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.campaign}: ${campaign.bounceRate}% bounce rate (${campaign.sessions} sessions)`);
    });
    
  } catch (error) {
    console.error('❌ Error using Google Analytics MCP for July 2025:', error.message);
    console.log('\n💡 Troubleshooting suggestions:');
    console.log('   - Verify GA4 property access and permissions');
    console.log('   - Check if July 2025 data is fully processed');
    console.log('   - Ensure proper authentication setup');
  }
}

// Run the MCP-based July 2025 analysis
getJuly2025CampaignBounceRates().catch(console.error);