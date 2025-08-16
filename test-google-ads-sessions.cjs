const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the dashboard to load
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 30000 });
    console.log('Dashboard loaded successfully');

    // Wait a moment for data to populate
    await page.waitForTimeout(3000);

    // Get the Google Ads card data
    const googleAdsCard = await page.locator('.grid > div').filter({ hasText: 'Google Ads' }).first();
    
    if (await googleAdsCard.count() > 0) {
      // Extract the sessions value
      const sessionsText = await googleAdsCard.locator('text=/^\\d+(?:,\\d+)*$/').first().textContent();
      console.log('\n=================================');
      console.log('Google Ads - Last 7 Days (Aug 4-10, 2025)');
      console.log('=================================');
      console.log(`Total Sessions: ${sessionsText}`);
      console.log('=================================\n');

      // Also try to get more details from the card
      const allText = await googleAdsCard.textContent();
      console.log('Full card content:', allText);
    } else {
      console.log('Google Ads card not found on dashboard');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();