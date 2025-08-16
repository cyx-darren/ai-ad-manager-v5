import { GoogleAnalyticsCore } from './src/core/analytics-core.js';

async function findExactMatch() {
  try {
    console.log('🔍 Finding exact match for 820 sessions\n');
    
    const analyticsCore = new GoogleAnalyticsCore();
    await analyticsCore.initialize();
    
    // Last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    console.log(`Date Range: ${startDateStr} to ${endDateStr}\n`);
    console.log('Target: 820 sessions (398 Paid Search + 217 Display + 205 Paid Video)\n');
    console.log('=' .repeat(60));
    
    // Test 1: Get detailed breakdown by source AND medium
    console.log('\n📊 DETAILED SOURCE/MEDIUM BREAKDOWN:\n');
    const detailedData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionSource', 'sessionMedium', 'sessionDefaultChannelGroup'],
      metrics: ['sessions', 'totalUsers'],
      startDate: startDateStr,
      endDate: endDateStr,
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ],
      limit: 50
    });
    
    let paidSearchTotal = 0;
    let displayTotal = 0;
    let videoTotal = 0;
    let otherPaidTotal = 0;
    
    const paidSources = [];
    
    if (detailedData && detailedData.rows) {
      detailedData.rows.forEach(row => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const channelGroup = row.dimensionValues[2].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        // Check if this is paid traffic
        const isPaid = medium && (
          medium.toLowerCase().includes('cp') || 
          medium.toLowerCase() === 'display' || 
          medium.toLowerCase() === 'video' ||
          medium.toLowerCase() === 'paid'
        );
        
        if (isPaid) {
          console.log(`${source} / ${medium}`);
          console.log(`  Channel Group: ${channelGroup}`);
          console.log(`  Sessions: ${sessions}, Users: ${users}`);
          
          paidSources.push({
            source,
            medium,
            channelGroup,
            sessions,
            users
          });
          
          // Categorize based on channel group or medium
          if (channelGroup === 'Paid Search' || medium.toLowerCase().includes('cpc')) {
            paidSearchTotal += sessions;
            console.log(`  → Counted as Paid Search`);
          } else if (channelGroup === 'Display' || medium.toLowerCase() === 'display' || medium.toLowerCase().includes('cpm')) {
            displayTotal += sessions;
            console.log(`  → Counted as Display`);
          } else if (channelGroup === 'Paid Video' || medium.toLowerCase() === 'video' || medium.toLowerCase().includes('cpv')) {
            videoTotal += sessions;
            console.log(`  → Counted as Paid Video`);
          } else {
            otherPaidTotal += sessions;
            console.log(`  → Counted as Other Paid`);
          }
          console.log('');
        }
      });
    }
    
    console.log('=' .repeat(60));
    console.log('\n📈 TOTALS BY CATEGORY:\n');
    console.log(`Paid Search: ${paidSearchTotal} sessions (Expected: 398)`);
    console.log(`Display: ${displayTotal} sessions (Expected: 217)`);
    console.log(`Paid Video: ${videoTotal} sessions (Expected: 205)`);
    console.log(`Other Paid: ${otherPaidTotal} sessions`);
    console.log(`TOTAL: ${paidSearchTotal + displayTotal + videoTotal + otherPaidTotal} sessions (Expected: 820)`);
    
    // Test 2: Try filtering by campaign name (Google Ads campaigns usually have names)
    console.log('\n\n🎯 GOOGLE ADS CAMPAIGNS ONLY:\n');
    console.log('=' .repeat(60));
    
    const campaignData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionCampaignName', 'sessionSource', 'sessionMedium'],
      metrics: ['sessions', 'totalUsers'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        andGroup: {
          filters: [
            {
              filter: {
                fieldName: 'sessionSource',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'google',
                  caseSensitive: false
                }
              }
            },
            {
              filter: {
                fieldName: 'sessionMedium',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value: 'cp',
                  caseSensitive: false
                }
              }
            }
          ]
        }
      },
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ]
    });
    
    let googleAdsTotal = 0;
    if (campaignData && campaignData.rows) {
      campaignData.rows.forEach(row => {
        const campaign = row.dimensionValues[0].value || '(not set)';
        const source = row.dimensionValues[1].value;
        const medium = row.dimensionValues[2].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        if (campaign !== '(not set)' && campaign !== '(direct)' && campaign !== '(organic)') {
          console.log(`Campaign: ${campaign}`);
          console.log(`  Source/Medium: ${source}/${medium}`);
          console.log(`  Sessions: ${sessions}, Users: ${users}`);
          googleAdsTotal += sessions;
        }
      });
    }
    
    console.log(`\nGoogle Ads Campaign Total: ${googleAdsTotal} sessions`);
    
    // Test 3: Check what happens if we only look at google/cpc
    console.log('\n\n🔍 GOOGLE/CPC ONLY:\n');
    console.log('=' .repeat(60));
    
    const googleCpcData = await analyticsCore.queryAnalytics({
      dimensions: ['sessionSource', 'sessionMedium'],
      metrics: ['sessions', 'totalUsers'],
      startDate: startDateStr,
      endDate: endDateStr,
      dimensionFilter: {
        andGroup: {
          filters: [
            {
              filter: {
                fieldName: 'sessionSource',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'google',
                  caseSensitive: false
                }
              }
            },
            {
              filter: {
                fieldName: 'sessionMedium',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'cpc',
                  caseSensitive: false
                }
              }
            }
          ]
        }
      }
    });
    
    if (googleCpcData && googleCpcData.rows) {
      googleCpcData.rows.forEach(row => {
        const source = row.dimensionValues[0].value;
        const medium = row.dimensionValues[1].value;
        const sessions = parseInt(row.metricValues[0].value);
        const users = parseInt(row.metricValues[1].value);
        
        console.log(`${source}/${medium}: ${sessions} sessions, ${users} users`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the analysis
findExactMatch();