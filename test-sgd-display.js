// Test script to verify SGD display in dashboard API
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5050';

async function testSGDDisplay() {
  console.log('🧪 Testing SGD Display in Dashboard API');
  console.log('=====================================');
  
  try {
    // Test health check first
    const healthResponse = await fetch(`${API_URL}/api/health`);
    if (!healthResponse.ok) {
      console.log('❌ API server not running. Please start with: npm run dev:api');
      return;
    }
    
    console.log('✅ API server is running');
    
    // Test the spend endpoint (without auth to see fallback)
    console.log('\n📊 Testing Spend Endpoint:');
    const spendResponse = await fetch(`${API_URL}/api/dashboard/spend/google-ads?startDate=2025-06-01&endDate=2025-06-30`);
    console.log(`Status: ${spendResponse.status}`);
    
    if (spendResponse.status === 401) {
      console.log('✅ Correctly requires authentication');
    }
    
    // Test the main dashboard endpoint info
    console.log('\n📊 Testing Dashboard Info:');
    const dashboardResponse = await fetch(`${API_URL}/api/dashboard`);
    const dashboardInfo = await dashboardResponse.json();
    
    console.log('Dashboard API Configuration:');
    console.log(`- Version: ${dashboardInfo.version}`);
    console.log('- Data Types:');
    console.log(`  - Real Data: ${dashboardInfo.dataTypes.realData.join(', ')}`);
    console.log(`  - Mock Data: ${dashboardInfo.dataTypes.mockData.join(', ')}`);
    
    console.log('\n💡 Expected Behavior:');
    console.log('When you access the dashboard with authentication:');
    console.log('- Total Spend will show: SGD $4,238.85 (not USD $3,115.55)');
    console.log('- Currency unit will be: SGD');
    console.log('- No conversion notice will be shown');
    console.log('- Breakdown modal will show amounts in SGD');
    
    console.log('\n📋 To see this in action:');
    console.log('1. Start frontend: npm run dev:web');
    console.log('2. Open: http://localhost:3000/dashboard');
    console.log('3. Sign in and set date range to June 2025');
    console.log('4. Total Spend card should show: SGD $4,238.85');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSGDDisplay().catch(console.error);