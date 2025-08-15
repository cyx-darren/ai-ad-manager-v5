// Test script to verify spending reconciliation for June 2025
import { GoogleAdsCore } from './src/core/ads-core-enhanced.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSpendReconciliation() {
  console.log('🔍 Testing Google Ads Spend Reconciliation for June 2025');
  console.log('==================================================');
  
  const adsCore = new GoogleAdsCore();
  
  // June 2025 date range from the invoice
  const startDate = '2025-06-01';
  const endDate = '2025-06-30';
  
  try {
    console.log(`📅 Analyzing spend for ${startDate} to ${endDate}`);
    console.log('');
    
    // Get account information first
    console.log('🏢 Account Information:');
    const accountInfo = await adsCore.getAccountInfo();
    if (accountInfo) {
      console.log(`   Account: ${accountInfo.name}`);
      console.log(`   ID: ${accountInfo.id}`);
      console.log(`   Currency: ${accountInfo.currency}`);
      console.log(`   Time Zone: ${accountInfo.timeZone}`);
    } else {
      console.log('   Using fallback settings from environment');
    }
    console.log('');
    
    // Get detailed reconciliation
    console.log('💰 Spend Reconciliation:');
    const reconciliation = await adsCore.getSpendReconciliation(startDate, endDate);
    
    console.log(`   Gross Spend: SGD $${reconciliation.spend.gross.sgd.toFixed(2)} → USD $${reconciliation.spend.gross.usd.toFixed(2)}`);
    console.log(`   Invalid Activity Credits: SGD $${reconciliation.spend.credits.sgd.toFixed(2)} → USD $${reconciliation.spend.credits.usd.toFixed(2)}`);
    console.log(`   Net Spend: SGD $${reconciliation.spend.net.sgd.toFixed(2)} → USD $${reconciliation.spend.net.usd.toFixed(2)}`);
    console.log(`   Exchange Rate: 1 SGD = ${reconciliation.exchangeRate.toFixed(3)} USD`);
    console.log('');
    
    // Show reconciliation status
    console.log('📋 Invoice Reconciliation:');
    console.log(`   Expected Invoice Amount: SGD $${reconciliation.reconciliation.expectedInvoiceAmount.toFixed(2)}`);
    console.log(`   Actual Net Spend: SGD $${reconciliation.reconciliation.actualNetSpend.toFixed(2)}`);
    console.log(`   Difference: SGD $${reconciliation.reconciliation.difference.toFixed(2)}`);
    console.log(`   Matches Invoice: ${reconciliation.reconciliation.matchesInvoice ? '✅ Yes' : '❌ No'}`);
    console.log('');
    
    // Show campaign breakdown
    if (reconciliation.campaigns && reconciliation.campaigns.length > 0) {
      console.log('📊 Campaign Breakdown:');
      reconciliation.campaigns
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5)
        .forEach(campaign => {
          const spendUSD = campaign.spend * reconciliation.exchangeRate;
          console.log(`   ${campaign.name}: SGD $${campaign.spend.toFixed(2)} (USD $${spendUSD.toFixed(2)})`);
        });
      
      if (reconciliation.campaigns.length > 5) {
        console.log(`   ... and ${reconciliation.campaigns.length - 5} more campaigns`);
      }
      console.log('');
    }
    
    // Analysis
    console.log('🔍 Analysis:');
    
    if (reconciliation.reconciliation.matchesInvoice) {
      console.log('   ✅ SUCCESS: Spend data matches the expected invoice amount!');
      console.log('   The discrepancy has been resolved with proper currency conversion and credits.');
    } else {
      console.log('   ⚠️  DISCREPANCY: There is still a difference between API data and invoice.');
      
      const absDifference = Math.abs(reconciliation.reconciliation.difference);
      if (absDifference < 10) {
        console.log('   This small difference might be due to:');
        console.log('   - Rounding differences in currency conversion');
        console.log('   - Timing of when data was processed');
        console.log('   - Minor adjustments not captured in the API');
      } else {
        console.log('   This larger difference might be due to:');
        console.log('   - Missing invalid activity credits');
        console.log('   - Different date ranges or time zones');
        console.log('   - Additional fees or taxes not shown in spend metrics');
      }
    }
    console.log('');
    
    // Original vs Enhanced comparison
    console.log('📈 Before vs After Enhancement:');
    console.log(`   Original Dashboard Showed: USD $4,385.387 (gross spend in wrong currency)`);
    console.log(`   Invoice Amount: SGD $4,237.29`);
    console.log(`   Enhanced Dashboard Shows: USD $${reconciliation.spend.net.usd.toFixed(2)} (net spend, converted)`);
    console.log(`   Equivalent SGD Amount: SGD $${reconciliation.spend.net.sgd.toFixed(2)}`);
    
    const originalDiscrepancyUSD = 4385.387 - (4237.29 * reconciliation.exchangeRate);
    const newDiscrepancyUSD = reconciliation.spend.net.usd - (4237.29 * reconciliation.exchangeRate);
    
    console.log('');
    console.log(`   Original Discrepancy: USD $${originalDiscrepancyUSD.toFixed(2)}`);
    console.log(`   New Discrepancy: USD $${newDiscrepancyUSD.toFixed(2)}`);
    console.log(`   Improvement: USD $${(Math.abs(originalDiscrepancyUSD) - Math.abs(newDiscrepancyUSD)).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error during reconciliation:', error.message);
    console.log('');
    console.log('This might be due to:');
    console.log('- Google Ads API credentials issues');
    console.log('- Network connectivity problems');
    console.log('- API rate limits or quotas');
    console.log('- Date range outside available data');
  }
}

// Helper function to test individual components
async function testComponents() {
  console.log('\n🧪 Component Testing:');
  console.log('====================');
  
  const adsCore = new GoogleAdsCore();
  
  try {
    // Test basic spend data
    console.log('Testing basic spend data...');
    const spendData = await adsCore.getCampaignSpend('2025-06-01', '2025-06-30', false);
    console.log(`✅ Basic spend data: ${spendData.campaigns.length} campaigns, total: ${spendData.grossSpend.original.toFixed(2)} ${spendData.currency}`);
    
    // Test with credits
    console.log('Testing spend data with credits...');
    const spendWithCredits = await adsCore.getCampaignSpend('2025-06-01', '2025-06-30', true);
    console.log(`✅ With credits: Credits of ${spendWithCredits.invalidActivityCredits.original.toFixed(2)} ${spendData.currency} applied`);
    
  } catch (error) {
    console.log(`❌ Component test failed: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  await testSpendReconciliation();
  await testComponents();
  
  console.log('\n📋 Next Steps:');
  console.log('==============');
  console.log('1. Start the servers: npm run dev');
  console.log('2. Open http://localhost:3000/dashboard');
  console.log('3. Set date range to June 2025 (2025-06-01 to 2025-06-30)');
  console.log('4. Check the Total Spend card - it should now show the correct amount');
  console.log('5. Click "View breakdown & reconciliation" to see detailed analysis');
}

runAllTests().catch(console.error);