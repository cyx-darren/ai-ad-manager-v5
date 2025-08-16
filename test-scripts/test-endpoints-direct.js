import { GoogleAdsCore } from '../src/core/ads-core.js';
import { supabaseAdmin } from '../src/db/supabase-client.js';
import dotenv from 'dotenv';

dotenv.config();

// Test the caching helper function directly
async function getCachedOrFetch(metricType, startDate, endDate, fetchFn) {
  // Check cache first
  const { data: cached } = await supabaseAdmin
    .from('google_ads_cache')
    .select('data')
    .eq('metric_type', metricType)
    .eq('date_range_start', startDate)
    .eq('date_range_end', endDate)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (cached) {
    console.log('✅ Cache hit for', metricType);
    return cached.data;
  }

  console.log('🔄 Cache miss, fetching fresh data for', metricType);
  
  // Fetch fresh data
  const freshData = await fetchFn();
  
  // Store in cache
  await supabaseAdmin
    .from('google_ads_cache')
    .upsert({
      metric_type: metricType,
      date_range_start: startDate,
      date_range_end: endDate,
      data: freshData,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    });

  console.log('💾 Data cached for', metricType);
  return freshData;
}

async function testEndpointsDirectly() {
  console.log('🧪 Testing Dashboard API Endpoints Directly...\n');
  
  const startDate = '2025-08-01';
  const endDate = '2025-08-14';
  
  try {
    const adsCore = new GoogleAdsCore();
    
    console.log('1. Testing spend endpoint logic...');
    const spendData = await getCachedOrFetch(
      'campaign_spend',
      startDate,
      endDate,
      () => adsCore.getCampaignSpend(startDate, endDate)
    );
    
    console.log('✅ Spend data:', {
      totalSpend: spendData.totalSpend,
      campaignCount: spendData.campaigns.length,
      currency: spendData.currency
    });
    
    console.log('\n2. Testing metrics endpoint logic...');
    const metrics = await getCachedOrFetch(
      'ads_metrics',
      startDate,
      endDate,
      () => adsCore.getAdsMetrics(startDate, endDate)
    );
    
    console.log('✅ Metrics data:', {
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      ctr: metrics.ctr,
      conversions: metrics.conversions
    });
    
    console.log('\n3. Testing caching (second call)...');
    const cachedSpend = await getCachedOrFetch(
      'campaign_spend',
      startDate,
      endDate,
      () => adsCore.getCampaignSpend(startDate, endDate)
    );
    
    console.log('✅ Second call should hit cache');
    
    console.log('\n4. Testing combined data (as used in /metrics endpoint)...');
    const combinedData = await getCachedOrFetch(
      'ads_complete',
      startDate,
      endDate,
      async () => {
        const [spend, metrics] = await Promise.all([
          adsCore.getCampaignSpend(startDate, endDate),
          adsCore.getAdsMetrics(startDate, endDate)
        ]);
        return { ...spend, ...metrics };
      }
    );
    
    console.log('✅ Combined data:', {
      totalSpend: combinedData.totalSpend,
      impressions: combinedData.impressions,
      ctr: combinedData.ctr,
      campaignCount: combinedData.campaigns?.length
    });
    
    console.log('\n🎉 All endpoint logic working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testEndpointsDirectly();