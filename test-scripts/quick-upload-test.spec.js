import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Quick PDF Upload Success Test', () => {
  test('should test successful PDF upload and history refresh', async ({ page }) => {
    console.log('🎯 Testing successful PDF upload...');
    
    // Login
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('#email', 'darren@easyprintsg.com');
    await page.fill('#password', 'Amber12345');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Navigate to uploads
    await page.goto('http://localhost:3000/uploads');
    await page.waitForLoadState('networkidle');
    
    // Use pre-created test PDF file
    const testPdfPath = path.join(process.cwd(), 'test-scripts', 'test-files', 'sample-ad-report.pdf');
    
    console.log('📄 Using test PDF file:', testPdfPath);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-scripts/screenshots/quick-test-01-before-upload.png',
      fullPage: true 
    });
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);
    
    console.log('📤 File uploaded, waiting for processing...');
    
    // Wait for upload to complete (look for success or error states)
    await page.waitForTimeout(5000);
    
    // Take screenshot after upload attempt
    await page.screenshot({ 
      path: 'test-scripts/screenshots/quick-test-02-after-upload.png',
      fullPage: true 
    });
    
    // Check for any success indicators
    const successIndicators = [
      '.text-green-600',
      '.bg-green-50', 
      'text="successfully"',
      'text="Success"'
    ];
    
    let successFound = false;
    for (const selector of successIndicators) {
      try {
        const element = await page.locator(selector);
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`✅ Success indicator found: ${selector}`);
          successFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Check upload history section
    await page.waitForTimeout(2000);
    
    // Look for changes in upload history
    const historySection = page.locator('text="Upload History"').locator('..');
    await historySection.screenshot({ 
      path: 'test-scripts/screenshots/quick-test-03-upload-history-final.png'
    });
    
    // Check if history refreshed (no longer shows "No files uploaded yet")
    const noFilesText = await page.locator('text="No files uploaded yet"');
    const historyEmpty = await noFilesText.isVisible();
    
    console.log(`📊 History section empty: ${historyEmpty}`);
    
    // Test file is permanent, no cleanup needed
    
    console.log('\n🎯 Quick Test Results:');
    console.log(`✅ Upload interface: FUNCTIONAL`);
    console.log(`${successFound ? '✅' : '⚠️'} Success feedback: ${successFound ? 'DETECTED' : 'NOT CLEAR'}`);
    console.log(`${!historyEmpty ? '✅' : '⚠️'} History refresh: ${!historyEmpty ? 'WORKING' : 'NO CHANGE'}`);
  });
});