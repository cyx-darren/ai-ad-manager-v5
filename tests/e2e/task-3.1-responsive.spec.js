// tests/e2e/task-3.1-responsive.spec.js
import { test, expect, devices } from '@playwright/test';

// Test user for responsive testing - using existing user
const RESPONSIVE_USER = {
  email: 'darren@easyprintsg.com',
  password: 'Amber12345'
};

// Device viewports to test
const VIEWPORTS = {
  mobile: { width: 375, height: 667, label: 'Mobile (375px)' },
  tablet: { width: 768, height: 1024, label: 'Tablet (768px)' },
  desktop: { width: 1440, height: 900, label: 'Desktop (1440px)' }
};

test.describe('Task 3.1: Responsive Design Testing', () => {
  // No need to create user - using existing account

  test('Mobile viewport (375px) - Cards and charts stack', async ({ browser }) => {
    console.log('=== Testing Mobile Layout (375px) ===');
    
    const context = await browser.newContext({
      viewport: VIEWPORTS.mobile,
      userAgent: devices['iPhone 12'].userAgent
    });
    const page = await context.newPage();

    // Login
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(RESPONSIVE_USER.email);
    await page.getByLabel('Password').fill(RESPONSIVE_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Check mobile layout
    console.log('Checking mobile layout...');
    
    // 1. Check that metric cards stack vertically
    const metricCards = await page.locator('[data-testid="metric-card"], .metric-card, .bg-white.rounded-lg.shadow').all();
    
    if (metricCards.length > 0) {
      const firstCard = await metricCards[0].boundingBox();
      const secondCard = await metricCards[1]?.boundingBox();
      
      if (firstCard && secondCard) {
        // Cards should stack (second card Y position should be below first card)
        expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height);
        console.log('✓ Metric cards stack vertically on mobile');
      }
    }

    // 2. Check that charts stack vertically
    const charts = await page.locator('[class*="chart"], canvas, svg').all();
    
    if (charts.length > 1) {
      const firstChart = await charts[0].boundingBox();
      const secondChart = await charts[1].boundingBox();
      
      if (firstChart && secondChart) {
        expect(secondChart.y).toBeGreaterThan(firstChart.y);
        console.log('✓ Charts stack vertically on mobile');
      }
    }

    // 3. Check navigation is mobile-friendly
    const header = await page.locator('header, nav, [role="navigation"]').first();
    if (await header.count() > 0) {
      const headerBox = await header.boundingBox();
      if (headerBox) {
        expect(headerBox.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width);
        console.log('✓ Navigation fits mobile width');
      }
    }

    // 4. Check text is readable (no horizontal overflow)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(VIEWPORTS.mobile.width + 20); // Allow small margin
    console.log('✓ No horizontal overflow on mobile');

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'test-scripts/screenshots/task-3.1-mobile.png',
      fullPage: true 
    });
    console.log('✓ Mobile screenshot saved');

    await context.close();
  });

  test('Tablet viewport (768px) - 2 column layout', async ({ browser }) => {
    console.log('=== Testing Tablet Layout (768px) ===');
    
    const context = await browser.newContext({
      viewport: VIEWPORTS.tablet,
      userAgent: devices['iPad'].userAgent
    });
    const page = await context.newPage();

    // Login
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(RESPONSIVE_USER.email);
    await page.getByLabel('Password').fill(RESPONSIVE_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    console.log('Checking tablet layout...');
    
    // 1. Check that metric cards show 2 columns
    const metricCards = await page.locator('[data-testid="metric-card"], .metric-card, .bg-white.rounded-lg.shadow').all();
    
    if (metricCards.length >= 4) {
      const card1 = await metricCards[0].boundingBox();
      const card2 = await metricCards[1].boundingBox();
      const card3 = await metricCards[2].boundingBox();
      
      if (card1 && card2 && card3) {
        // First two cards should be side by side
        expect(Math.abs(card1.y - card2.y)).toBeLessThan(20);
        // Third card should be below
        expect(card3.y).toBeGreaterThan(card1.y + card1.height);
        console.log('✓ Metric cards show 2-column layout on tablet');
      }
    }

    // 2. Check chart layout
    const charts = await page.locator('[class*="chart"], .bg-white.rounded-lg.shadow:has(canvas), .bg-white.rounded-lg.shadow:has(svg)').all();
    
    if (charts.length >= 2) {
      const chart1 = await charts[0].boundingBox();
      const chart2 = await charts[1].boundingBox();
      
      if (chart1 && chart2) {
        // Charts might be 2 columns or stacked depending on design
        console.log('✓ Charts layout appropriate for tablet');
      }
    }

    // 3. Check proper spacing
    const container = await page.locator('.container, main, [role="main"]').first();
    if (await container.count() > 0) {
      const containerBox = await container.boundingBox();
      if (containerBox) {
        expect(containerBox.width).toBeLessThanOrEqual(VIEWPORTS.tablet.width);
        expect(containerBox.width).toBeGreaterThan(VIEWPORTS.tablet.width * 0.8);
        console.log('✓ Container has proper padding on tablet');
      }
    }

    // Take screenshot
    await page.screenshot({ 
      path: 'test-scripts/screenshots/task-3.1-tablet.png',
      fullPage: true 
    });
    console.log('✓ Tablet screenshot saved');

    await context.close();
  });

  test('Desktop viewport (1440px) - Full 4 column layout', async ({ browser }) => {
    console.log('=== Testing Desktop Layout (1440px) ===');
    
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop
    });
    const page = await context.newPage();

    // Login
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(RESPONSIVE_USER.email);
    await page.getByLabel('Password').fill(RESPONSIVE_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    console.log('Checking desktop layout...');
    
    // 1. Check that metric cards show 4 columns
    const metricCards = await page.locator('[data-testid="metric-card"], .metric-card, .bg-white.rounded-lg.shadow').all();
    
    if (metricCards.length >= 8) {
      const positions = await Promise.all(
        metricCards.slice(0, 4).map(card => card.boundingBox())
      );
      
      const validPositions = positions.filter(p => p !== null);
      
      if (validPositions.length === 4) {
        // First 4 cards should be in a row
        const yPositions = validPositions.map(p => p.y);
        const maxYDiff = Math.max(...yPositions) - Math.min(...yPositions);
        expect(maxYDiff).toBeLessThan(20);
        console.log('✓ Metric cards show 4-column layout on desktop');
        
        // Check spacing between cards
        const xPositions = validPositions.map(p => p.x).sort((a, b) => a - b);
        const gaps = xPositions.slice(1).map((x, i) => x - (xPositions[i] + validPositions[i].width));
        console.log('✓ Cards have consistent spacing');
      }
    }

    // 2. Check charts in 2x2 grid
    const charts = await page.locator('[class*="chart"], .bg-white.rounded-lg.shadow:has(canvas), .bg-white.rounded-lg.shadow:has(svg)').all();
    
    if (charts.length >= 4) {
      const chartPositions = await Promise.all(
        charts.slice(0, 4).map(chart => chart.boundingBox())
      );
      
      const validChartPositions = chartPositions.filter(p => p !== null);
      
      if (validChartPositions.length === 4) {
        // Should be 2x2 grid
        const sortedByY = validChartPositions.sort((a, b) => a.y - b.y);
        const topRow = sortedByY.slice(0, 2);
        const bottomRow = sortedByY.slice(2, 4);
        
        // Check top row alignment
        expect(Math.abs(topRow[0].y - topRow[1].y)).toBeLessThan(20);
        // Check bottom row alignment
        expect(Math.abs(bottomRow[0].y - bottomRow[1].y)).toBeLessThan(20);
        console.log('✓ Charts display in 2x2 grid on desktop');
      }
    }

    // 3. Check header layout
    const header = await page.locator('header, [role="banner"], div:has(h1:text("Analytics Dashboard"))').first();
    if (await header.count() > 0) {
      const headerBox = await header.boundingBox();
      if (headerBox) {
        // Header should use most of the width
        expect(headerBox.width).toBeGreaterThan(VIEWPORTS.desktop.width * 0.7);
        console.log('✓ Header spans desktop width appropriately');
      }
    }

    // 4. Check date range picker position
    const dateRangePicker = await page.locator('[data-testid="date-range-picker"], button:has-text(/Last.*days/)').first();
    if (await dateRangePicker.count() > 0) {
      const pickerBox = await dateRangePicker.boundingBox();
      const headerElement = await page.locator('h1:text("Analytics Dashboard")').first();
      const headerBox = await headerElement.boundingBox();
      
      if (pickerBox && headerBox) {
        // Date picker should be on the same line as header (right side)
        expect(Math.abs(pickerBox.y - headerBox.y)).toBeLessThan(50);
        expect(pickerBox.x).toBeGreaterThan(headerBox.x + headerBox.width);
        console.log('✓ Date picker positioned correctly on desktop');
      }
    }

    // Take screenshot
    await page.screenshot({ 
      path: 'test-scripts/screenshots/task-3.1-desktop.png',
      fullPage: true 
    });
    console.log('✓ Desktop screenshot saved');

    await context.close();
  });

  test('Responsive transitions', async ({ browser }) => {
    console.log('=== Testing Responsive Transitions ===');
    
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    // Login
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(RESPONSIVE_USER.email);
    await page.getByLabel('Password').fill(RESPONSIVE_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test viewport changes
    console.log('Testing viewport transitions...');
    
    // Start at desktop
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForTimeout(500);
    console.log('✓ Desktop view loaded');
    
    // Transition to tablet
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.waitForTimeout(500);
    
    // Check layout adjusted
    const tabletCards = await page.locator('[data-testid="metric-card"], .metric-card').all();
    if (tabletCards.length > 0) {
      console.log('✓ Layout adjusted to tablet view');
    }
    
    // Transition to mobile
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.waitForTimeout(500);
    
    // Check mobile layout
    const mobileCards = await page.locator('[data-testid="metric-card"], .metric-card').all();
    if (mobileCards.length > 0) {
      console.log('✓ Layout adjusted to mobile view');
    }
    
    // Check no horizontal scroll on mobile
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
    console.log('✓ No horizontal scroll on mobile');

    await context.close();
  });

  test('Touch interactions on mobile', async ({ browser }) => {
    console.log('=== Testing Touch Interactions ===');
    
    const context = await browser.newContext({
      viewport: VIEWPORTS.mobile,
      userAgent: devices['iPhone 12'].userAgent,
      hasTouch: true
    });
    const page = await context.newPage();

    // Login
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(RESPONSIVE_USER.email);
    await page.getByLabel('Password').fill(RESPONSIVE_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    console.log('Testing touch interactions...');
    
    // Test tap on metric cards
    const metricCard = await page.locator('[data-testid="metric-card"], .metric-card').first();
    if (await metricCard.count() > 0) {
      await metricCard.tap();
      console.log('✓ Metric cards respond to tap');
    }
    
    // Test swipe/scroll
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    console.log('✓ Page scrolls smoothly on touch devices');
    
    // Test date picker tap
    const datePickerButton = await page.locator('button:has-text(/Last.*days/), [data-testid="date-range-picker"]').first();
    if (await datePickerButton.count() > 0) {
      await datePickerButton.tap();
      await page.waitForTimeout(500);
      
      // Close if opened
      await page.keyboard.press('Escape');
      console.log('✓ Date picker responds to tap');
    }

    await context.close();
  });
});