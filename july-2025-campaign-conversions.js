#!/usr/bin/env node

/**
 * Use Google Analytics MCP to get July 2025 campaign conversion data
 */

import { GoogleAnalyticsCore } from './src/core/analytics-core.js';
import dotenv from 'dotenv';

dotenv.config();

async function getJuly2025CampaignConversions() {
  console.log('🎯 Getting July 2025 campaign conversion data using Google Analytics MCP...\n');
  
  try {
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // July 2025 date range
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    
    console.log(`📅 Date Range: ${startDate} to ${endDate} (July 2025)\n`);
    
    // Use getConversionData MCP method
    console.log('💰 Using MCP getConversionData for July 2025...');
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
      console.log(`Note: getConversionData failed: ${error.message}\n`);
    }
    
    // Use query_analytics to get campaign conversions
    console.log('🔍 Using MCP query_analytics for campaign conversion data...');
    
    const campaigns = [];
    
    try {
      const campaignConversions = await analyticsCore.queryAnalytics({
        dimensions: ['sessionCampaignName', 'sessionDefaultChannelGroup'],
        metrics: ['sessions', 'conversions', 'bounceRate'],
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
      
      if (campaignConversions.rows) {
        campaignConversions.rows.forEach(row => {
          if (row.dimensionValues && row.metricValues) {
            const campaignName = row.dimensionValues[0]?.value;
            const channel = row.dimensionValues[1]?.value;
            const sessions = parseInt(row.metricValues[0]?.value || 0);
            const conversions = parseFloat(row.metricValues[1]?.value || 0);
            const bounceRate = parseFloat(row.metricValues[2]?.value || 0);
            
            if (campaignName && campaignName !== '(not set)' && sessions > 0) {
              const conversionRate = sessions > 0 ? ((conversions / sessions) * 100).toFixed(2) : '0.00';
              
              campaigns.push({
                campaign: campaignName,
                channel,
                sessions,
                conversions: conversions.toFixed(0),
                conversionRate,
                bounceRate: (bounceRate * 100).toFixed(2)
              });
            }
          }
        });
      }
    } catch (queryError) {
      console.log(`Campaign conversion query failed: ${queryError.message}\n`);
    }
    
    // Try alternative approach with source/medium/campaign
    console.log('🔄 Trying alternative approach with source/medium/campaign...');
    try {
      const sourceMediumConversions = await analyticsCore.queryAnalytics({
        dimensions: ['sessionSource', 'sessionMedium', 'sessionCampaignName'],
        metrics: ['sessions', 'conversions'],
        startDate,
        endDate,
        dimensionFilter: {
          filter: {
            fieldName: 'sessionMedium',
            inListFilter: {
              values: ['cpc', 'CPC']
            }
          }
        },
        limit: 50
      });
      
      if (sourceMediumConversions.rows) {
        sourceMediumConversions.rows.forEach(row => {
          if (row.dimensionValues && row.metricValues) {
            const source = row.dimensionValues[0]?.value;
            const medium = row.dimensionValues[1]?.value;
            const campaignName = row.dimensionValues[2]?.value;
            const sessions = parseInt(row.metricValues[0]?.value || 0);
            const conversions = parseFloat(row.metricValues[1]?.value || 0);
            
            if (campaignName && campaignName !== '(not set)' && sessions > 0) {
              // Check if this campaign is already in our list
              const existingCampaign = campaigns.find(c => c.campaign === campaignName);
              if (!existingCampaign) {
                const conversionRate = sessions > 0 ? ((conversions / sessions) * 100).toFixed(2) : '0.00';
                
                campaigns.push({
                  campaign: campaignName,
                  channel: `${source}/${medium}`,
                  sessions,
                  conversions: conversions.toFixed(0),
                  conversionRate,
                  bounceRate: '-'
                });
              }
            }
          }
        });
      }
    } catch (altQueryError) {
      console.log(`Alternative conversion query failed: ${altQueryError.message}\n`);
    }
    
    if (campaigns.length === 0) {
      console.log('❌ No campaign conversion data found for July 2025');
      console.log('\n💡 Possible reasons:');
      console.log('   - No conversions recorded in July 2025');
      console.log('   - Conversion events not properly configured');
      console.log('   - Different campaign naming conventions');
      return;
    }
    
    // Sort by conversions (highest first)
    campaigns.sort((a, b) => parseFloat(b.conversions) - parseFloat(a.conversions));
    
    console.log('\n🎯 Campaign Conversions for July 2025:');
    console.log('=' .repeat(90));
    console.log('Campaign Name'.padEnd(30) + 'Channel'.padEnd(15) + 'Sessions'.padStart(10) + 'Conversions'.padStart(12) + 'Conv Rate'.padStart(12) + 'Bounce Rate'.padStart(11));
    console.log('-'.repeat(90));
    
    let totalSessions = 0;
    let totalConversions = 0;
    
    campaigns.forEach((campaign) => {
      const campaignNameTruncated = campaign.campaign.length > 27 ? 
        campaign.campaign.substring(0, 24) + '...' : 
        campaign.campaign;
      
      console.log(
        `${campaignNameTruncated.padEnd(30)}${campaign.channel.padEnd(15)}${campaign.sessions.toString().padStart(10)}${campaign.conversions.padStart(12)}${(campaign.conversionRate + '%').padStart(12)}${(campaign.bounceRate + '%').padStart(11)}`
      );
      
      totalSessions += campaign.sessions;
      totalConversions += parseFloat(campaign.conversions);
    });
    
    console.log('-'.repeat(90));
    console.log(`Total Sessions: ${totalSessions}`);
    console.log(`Total Conversions: ${totalConversions.toFixed(0)}`);
    console.log(`Total Campaigns: ${campaigns.length}`);
    
    const overallConversionRate = totalSessions > 0 ? ((totalConversions / totalSessions) * 100).toFixed(2) : '0.00';
    console.log(`Overall Conversion Rate: ${overallConversionRate}%`);
    
    console.log('\n📋 July 2025 Campaign Conversion Summary:');
    campaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.campaign}: ${campaign.conversions} conversions (${campaign.conversionRate}% rate)`);
    });
    
  } catch (error) {
    console.error('❌ Error getting July 2025 campaign conversions:', error.message);
    console.log('\n💡 Troubleshooting suggestions:');
    console.log('   - Verify conversion events are properly set up in GA4');
    console.log('   - Check if July 2025 data is fully processed');
    console.log('   - Ensure proper authentication and permissions');
  }
}

// Run the July 2025 conversion analysis
getJuly2025CampaignConversions().catch(console.error);