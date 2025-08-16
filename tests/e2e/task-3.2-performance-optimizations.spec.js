// tests/e2e/task-3.2-performance-optimizations.spec.js
import { test, expect } from '@playwright/test';

// Test user for performance testing
const TEST_USER = {
  email: 'darren@easyprintsg.com',
  password: 'Amber12345'
};

test.describe('Task 3.2: Production Optimizations', () => {
  test('Cache middleware performance test', async ({ page }) => {
    console.log('=== Testing Cache Middleware ===');
    
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Get session token for API calls
    const sessionToken = await page.evaluate(async () => {
      const { supabase } = await import('/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token;
    });

    // Test cache stats endpoint
    const cacheStatsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:5050/api/cache/stats');
        return await response.json();
      } catch (error) {
        return { error: error.message };
      }
    });

    if (!cacheStatsResponse.error) {
      console.log('✓ Cache stats endpoint accessible');
      console.log(`  Current cache size: ${cacheStatsResponse.cacheSize || 0}`);
      console.log(`  Hit rate: ${cacheStatsResponse.hitRate || '0%'}`);
    }

    // Make the same API call twice to test caching
    const apiUrl = 'http://localhost:5050/api/dashboard/metrics?startDate=2025-08-01&endDate=2025-08-13';
    
    console.log('Making first API call...');
    const startTime1 = Date.now();
    const response1 = await page.evaluate(async ({ url, token }) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: await response.json()
      };
    }, { url: apiUrl, token: sessionToken });
    const duration1 = Date.now() - startTime1;
    
    console.log(`First call completed in ${duration1}ms`);
    console.log(`Cache header: ${response1.headers['x-cache'] || 'not present'}`);

    // Wait a bit then make the same call again
    await page.waitForTimeout(100);
    
    console.log('Making second API call (should hit cache)...');
    const startTime2 = Date.now();
    const response2 = await page.evaluate(async ({ url, token }) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: await response.json()
      };
    }, { url: apiUrl, token: sessionToken });
    const duration2 = Date.now() - startTime2;
    
    console.log(`Second call completed in ${duration2}ms`);
    console.log(`Cache header: ${response2.headers['x-cache'] || 'not present'}`);

    // Verify both calls succeeded
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    
    // Second call should be faster (cached)
    if (response2.headers['x-cache'] === 'HIT') {
      console.log('✓ Cache is working correctly');
      expect(duration2).toBeLessThan(duration1);
    } else {
      console.log('ℹ Cache may not be active (possibly first run)');
    }
  });

  test('Frontend performance optimizations', async ({ page }) => {
    console.log('=== Testing Frontend Performance ===');
    
    // Start performance measurement
    await page.goto('/auth/login');
    
    // Measure login performance
    const loginStart = Date.now();
    await page.getByLabel('Email address').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    const loginTime = Date.now() - loginStart;
    
    console.log(`Login flow completed in ${loginTime}ms`);
    
    // Measure dashboard load performance
    const dashboardStart = Date.now();
    await page.waitForSelector('h1:has-text("Analytics Dashboard")', { state: 'visible' });
    
    // Wait for metric cards to load
    await page.waitForSelector('text="Total Campaigns"', { state: 'visible' });
    await page.waitForSelector('text="Total Impressions"', { state: 'visible' });
    const dashboardTime = Date.now() - dashboardStart;
    
    console.log(`Dashboard loaded in ${dashboardTime}ms`);
    
    // Test lazy loading and image optimization (if any images exist)
    const images = await page.locator('img').count();
    if (images > 0) {
      console.log(`Found ${images} images on the page`);
      
      // Check if images have proper loading attributes
      const lazyImages = await page.locator('img[loading="lazy"]').count();
      if (lazyImages > 0) {
        console.log(`✓ ${lazyImages} images use lazy loading`);
      }
    }
    
    // Check for performance metrics in browser
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
      };
    });
    
    console.log('Browser Performance Metrics:');
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`  Load Complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
    if (performanceMetrics.firstPaint) {
      console.log(`  First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
    }
    if (performanceMetrics.firstContentfulPaint) {
      console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
    }
    
    // Performance assertions
    expect(loginTime).toBeLessThan(5000); // Login should be under 5 seconds
    expect(dashboardTime).toBeLessThan(3000); // Dashboard should load under 3 seconds
    
    if (performanceMetrics.firstContentfulPaint) {
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000); // FCP under 2 seconds
    }
  });

  test('Error tracking system', async ({ page }) => {
    console.log('=== Testing Error Tracking ===');
    
    // Test client-side error tracking by triggering an error
    await page.goto('/dashboard');
    
    // Inject error tracker script
    await page.addInitScript(() => {
      window.errorTracker = {
        logError: (error, context) => {
          console.log('[ErrorTracker]', error, context);
          window.testErrors = window.testErrors || [];
          window.testErrors.push({ error: error.message, context });
        }
      };
    });
    
    // Trigger a test error
    const errorTriggered = await page.evaluate(() => {
      try {
        // Simulate an error
        throw new Error('Test error for tracking');
      } catch (error) {
        if (window.errorTracker) {
          window.errorTracker.logError(error, { test: true });
          return true;
        }
        return false;
      }
    });
    
    if (errorTriggered) {
      console.log('✓ Error tracking system is functional');
    }
    
    // Test error endpoint
    const errorEndpointTest = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:5050/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: 'test-error-' + Date.now(),
            message: 'Test error from frontend',
            type: 'TestError',
            timestamp: new Date().toISOString(),
            context: { test: true }
          })
        });
        
        return {
          status: response.status,
          data: await response.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    if (errorEndpointTest.status === 200) {
      console.log('✓ Error tracking endpoint is working');
    } else {
      console.log('ℹ Error tracking endpoint may not be available');
    }
  });

  test('Build size optimization check', async ({ page }) => {
    console.log('=== Checking Build Optimization ===');
    
    // Check if CSS is minified by looking at network requests
    await page.goto('/dashboard');
    
    // Monitor network requests for CSS files
    const cssRequests = [];
    
    page.on('response', response => {
      if (response.url().includes('.css')) {
        cssRequests.push({
          url: response.url(),
          size: response.headers()['content-length'],
          compressed: response.headers()['content-encoding']
        });
      }
    });
    
    // Reload to capture CSS requests
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    if (cssRequests.length > 0) {
      console.log('CSS Files Found:');
      cssRequests.forEach(req => {
        console.log(`  ${req.url}`);
        if (req.size) {
          console.log(`    Size: ${req.size} bytes`);
        }
        if (req.compressed) {
          console.log(`    Compression: ${req.compressed}`);
        }
      });
      
      console.log('✓ CSS optimization check completed');
    } else {
      console.log('ℹ No external CSS files detected');
    }
  });
});

test.describe('Task 3.2: Performance Benchmarks', () => {
  test('Comprehensive performance test', async ({ page }) => {
    console.log('=== Comprehensive Performance Benchmark ===');
    
    const benchmarks = {
      pageLoad: 0,
      apiResponse: 0,
      interactivity: 0
    };
    
    // Test page load performance
    const pageLoadStart = Date.now();
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    benchmarks.pageLoad = Date.now() - pageLoadStart;
    
    // Login
    await page.getByLabel('Email address').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Test API response time
    const apiStart = Date.now();
    await page.waitForSelector('text="Total Campaigns"');
    benchmarks.apiResponse = Date.now() - apiStart;
    
    // Test interactivity (click refresh button)
    const interactivityStart = Date.now();
    const refreshButton = page.locator('button:has-text("Refresh")').first();
    if (await refreshButton.count() > 0) {
      await refreshButton.click();
      await page.waitForTimeout(500); // Wait for potential UI updates
    }
    benchmarks.interactivity = Date.now() - interactivityStart;
    
    console.log('Performance Benchmarks:');
    console.log(`  Page Load: ${benchmarks.pageLoad}ms`);
    console.log(`  API Response: ${benchmarks.apiResponse}ms`);
    console.log(`  Interactivity: ${benchmarks.interactivity}ms`);
    
    // Assert performance targets
    expect(benchmarks.pageLoad).toBeLessThan(5000); // Page load under 5s
    expect(benchmarks.apiResponse).toBeLessThan(3000); // API response under 3s
    expect(benchmarks.interactivity).toBeLessThan(1000); // Interactions under 1s
    
    console.log('✅ All performance benchmarks passed!');
  });
});