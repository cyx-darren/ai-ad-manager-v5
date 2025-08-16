import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testSimpleConnection() {
  console.log('🔍 Testing Google Ads API Simple Connection...\n');
  
  try {
    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    });

    // First, try with just the Manager account
    console.log('Testing with Manager Account only (MCC)...');
    const managerCustomer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID, // Manager account
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
    });

    // Query to list accessible customers
    const listQuery = `
      SELECT 
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.level,
        customer_client.manager,
        customer_client.status
      FROM customer_client
      WHERE customer_client.level <= 1
    `;

    console.log('Fetching accessible accounts...\n');
    const accounts = await managerCustomer.query(listQuery);
    
    if (accounts && accounts.length > 0) {
      console.log('✅ SUCCESS! Connected to Manager Account\n');
      console.log('📊 Accessible Accounts:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      accounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.customer_client.descriptive_name || 'Unnamed'}`);
        console.log(`   ID: ${account.customer_client.id}`);
        console.log(`   Type: ${account.customer_client.manager ? 'Manager' : 'Client'}`);
        console.log(`   Status: ${account.customer_client.status}`);
        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Now try to access the specific client account
      if (process.env.GOOGLE_ADS_CUSTOMER_ID) {
        console.log(`\nAttempting to access client account: ${process.env.GOOGLE_ADS_CUSTOMER_ID}`);
        
        const clientCustomer = client.Customer({
          customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
          login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
          refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
        });

        const clientQuery = `
          SELECT 
            customer.id,
            customer.descriptive_name
          FROM customer
          LIMIT 1
        `;

        try {
          const clientData = await clientCustomer.query(clientQuery);
          if (clientData && clientData.length > 0) {
            console.log('✅ Successfully accessed client account!');
            console.log(`Account: ${clientData[0].customer.descriptive_name}`);
          }
        } catch (clientError) {
          console.error('❌ Failed to access client account');
          console.error('Error:', clientError.errors?.[0]?.message || clientError.message);
        }
      }
    } else {
      console.log('⚠️  No accessible accounts found');
    }

  } catch (error) {
    console.error('❌ ERROR: Failed to connect\n');
    
    if (error.errors && error.errors.length > 0) {
      console.error('Google Ads API Error:');
      error.errors.forEach((e) => {
        console.error(`- ${e.message}`);
        if (e.error_code) {
          console.error(`  Error Code: ${JSON.stringify(e.error_code)}`);
        }
      });
    } else {
      console.error('Error:', error.message || error);
    }
    
    console.error('\nPossible issues:');
    console.error('1. Check that your refresh token was generated with the correct Google account');
    console.error('2. Verify the account has access to the Manager Account (609-232-3456)');
    console.error('3. Ensure the developer token is approved and linked to the Manager Account');
  }
}

// Run the test
testSimpleConnection().catch(console.error);