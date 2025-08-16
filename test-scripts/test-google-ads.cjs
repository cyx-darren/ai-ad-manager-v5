require('dotenv').config({ path: '../.env' });

async function testGoogleAds() {
  try {
    // Dynamic import for ES module
    const { GoogleAdsCore } = await import('../src/core/ads-core.js');
    
    const adsCore = new GoogleAdsCore();
    
    // Test date range (last 7 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    console.log('Testing Google Ads API...');
    console.log('Date range:', startDate, 'to', endDate);
    
    const spendData = await adsCore.getCampaignSpend(startDate, endDate);
    
    console.log('Total Spend: $', spendData.totalSpend.toFixed(2));
    console.log('Campaigns found:', spendData.campaigns.length);
    
    spendData.campaigns.forEach(campaign => {
      console.log(`- ${campaign.name}: $${campaign.spend.toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testGoogleAds();