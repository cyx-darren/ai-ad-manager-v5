import { GoogleAdsCore } from '../src/core/ads-core.js';
import { supabaseAdmin } from '../src/db/supabase-client.js';
import dotenv from 'dotenv';

dotenv.config();

// Test the caching functionality
async function getCachedOrFetch(metricType, startDate, endDate, fetchFn) {
  const cacheKey = `${metricType}_${startDate}_${endDate}`;
  console.log(`🔍 Checking cache for: ${cacheKey}`);
  
  // Check cache first
  const { data: cached, error: cacheError } = await supabaseAdmin
    .from('google_ads_cache')
    .select('data, cached_at, expires_at')
    .eq('metric_type', metricType)
    .eq('date_range_start', startDate)
    .eq('date_range_end', endDate)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (cached && !cacheError) {
    console.log(`✅ CACHE HIT for ${metricType} - cached at ${cached.cached_at}`);
    return { data: cached.data, source: 'cache' };
  }

  console.log(`🔄 CACHE MISS for ${metricType} - fetching fresh data...`);
  
  // Measure fetch time
  const startTime = Date.now();
  const freshData = await fetchFn();
  const fetchTime = Date.now() - startTime;
  
  console.log(`📊 Fresh data fetched in ${fetchTime}ms`);
  
  // Store in cache
  const { error: insertError } = await supabaseAdmin
    .from('google_ads_cache')
    .upsert({
      metric_type: metricType,
      date_range_start: startDate,
      date_range_end: endDate,
      data: freshData,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    });

  if (insertError) {
    console.error('Cache insert error:', insertError);
  } else {
    console.log(`💾 Data cached successfully for ${metricType}`);
  }

  return { data: freshData, source: 'api' };
}

async function testCaching() {
  console.log('🧪 Testing Caching Functionality...\n');
  
  const startDate = '2025-08-08';  // Use different date to avoid existing cache
  const endDate = '2025-08-15';
  
  try {
    const adsCore = new GoogleAdsCore();
    
    console.log('=== FIRST CALL (should be cache miss) ===');
    const result1 = await getCachedOrFetch(
      'cache_test_spend',
      startDate,
      endDate,
      () => adsCore.getCampaignSpend(startDate, endDate)
    );
    
    console.log('First call result:', {
      totalSpend: result1.data.totalSpend,
      campaignCount: result1.data.campaigns.length,
      source: result1.source
    });
    
    console.log('\n=== SECOND CALL (should be cache hit) ===');
    const startTime = Date.now();
    const result2 = await getCachedOrFetch(
      'cache_test_spend',
      startDate,
      endDate,
      () => adsCore.getCampaignSpend(startDate, endDate)
    );
    const cacheTime = Date.now() - startTime;
    
    console.log('Second call result:', {
      totalSpend: result2.data.totalSpend,
      campaignCount: result2.data.campaigns.length,
      source: result2.source,
      responseTime: `${cacheTime}ms`
    });
    
    console.log('\n=== VERIFICATION ===');
    if (result1.source === 'api' && result2.source === 'cache') {
      console.log('✅ Caching working perfectly!');
      console.log(`✅ Cache response was ${cacheTime < 50 ? 'instant' : 'fast'} (${cacheTime}ms)`);
    } else {
      console.log('❌ Caching issue detected');
    }
    
    // Test cache expiry by checking database
    console.log('\n=== CACHE DATABASE CHECK ===');
    const { data: cacheEntries } = await supabaseAdmin
      .from('google_ads_cache')
      .select('metric_type, cached_at, expires_at')
      .eq('metric_type', 'cache_test_spend')
      .eq('date_range_start', startDate)
      .eq('date_range_end', endDate);
    
    if (cacheEntries && cacheEntries.length > 0) {
      const entry = cacheEntries[0];
      const expiresAt = new Date(entry.expires_at);
      const now = new Date();
      const ttlMinutes = Math.round((expiresAt - now) / 1000 / 60);
      
      console.log('✅ Cache entry found in database:');
      console.log(`   - Cached at: ${entry.cached_at}`);
      console.log(`   - Expires at: ${entry.expires_at}`);
      console.log(`   - TTL remaining: ~${ttlMinutes} minutes`);
    }
    
  } catch (error) {
    console.error('❌ Caching test failed:', error.message);
  }
}

testCaching();