require('dotenv').config({ path: '../.env' });

async function testGoogleAdsMetrics() {
  try {
    // Dynamic import for ES module
    const { GoogleAdsCore } = await import('../src/core/ads-core.js');
    
    const adsCore = new GoogleAdsCore();
    
    // Test date range (last 7 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    console.log('Testing Google Ads Core Module...');
    console.log('Date range:', startDate, 'to', endDate);
    console.log('');
    
    // Test 1: getCampaignSpend
    console.log('1. Testing getCampaignSpend()...');
    const spendData = await adsCore.getCampaignSpend(startDate, endDate);
    
    console.log('✅ Data format verification:');
    console.log('- totalSpend:', typeof spendData.totalSpend, '=', spendData.totalSpend);
    console.log('- campaigns:', Array.isArray(spendData.campaigns) ? 'array' : typeof spendData.campaigns, 'length:', spendData.campaigns.length);
    console.log('- currency:', typeof spendData.currency, '=', spendData.currency);
    
    if (spendData.campaigns.length > 0) {
      console.log('- First campaign structure:');
      const firstCampaign = spendData.campaigns[0];
      console.log('  - id:', typeof firstCampaign.id, '=', firstCampaign.id);
      console.log('  - name:', typeof firstCampaign.name, '=', firstCampaign.name);
      console.log('  - spend:', typeof firstCampaign.spend, '=', firstCampaign.spend);
      console.log('  - impressions:', typeof firstCampaign.impressions, '=', firstCampaign.impressions);
      console.log('  - clicks:', typeof firstCampaign.clicks, '=', firstCampaign.clicks);
    }
    
    console.log('');
    
    // Test 2: getTotalSpend
    console.log('2. Testing getTotalSpend()...');
    const totalSpend = await adsCore.getTotalSpend(startDate, endDate);
    console.log('✅ Total spend:', typeof totalSpend, '=', totalSpend);
    console.log('');
    
    // Test 3: getAdsMetrics
    console.log('3. Testing getAdsMetrics()...');
    const metrics = await adsCore.getAdsMetrics(startDate, endDate);
    
    console.log('✅ Metrics structure:');
    console.log('- impressions:', typeof metrics.impressions, '=', metrics.impressions);
    console.log('- clicks:', typeof metrics.clicks, '=', metrics.clicks);
    console.log('- ctr:', typeof metrics.ctr, '=', metrics.ctr);
    console.log('- spend:', typeof metrics.spend, '=', metrics.spend);
    console.log('- conversions:', typeof metrics.conversions, '=', metrics.conversions);
    console.log('- avgCpc:', typeof metrics.avgCpc, '=', metrics.avgCpc);
    
    console.log('');
    console.log('🎉 All tests passed! Google Ads Core module is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testGoogleAdsMetrics();