import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function listAllAccounts() {
  console.log('📋 Listing All Accessible Google Ads Accounts...\n');
  
  try {
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    });

    const managerCustomer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
    });

    // Get ALL linked accounts (not just direct children)
    const query = `
      SELECT 
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.level,
        customer_client.manager,
        customer_client.status,
        customer_client.currency_code,
        customer_client.time_zone
      FROM customer_client
    `;

    const accounts = await managerCustomer.query(query);
    
    console.log(`Found ${accounts.length} account(s):\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Group by type
    const managers = accounts.filter(a => a.customer_client.manager);
    const clients = accounts.filter(a => !a.customer_client.manager);
    
    if (managers.length > 0) {
      console.log('🏢 MANAGER ACCOUNTS:');
      managers.forEach(account => {
        console.log(`\n   ${account.customer_client.descriptive_name || 'Unnamed'}`);
        console.log(`   ID: ${account.customer_client.id}`);
        console.log(`   Status: ${account.customer_client.status === 2 ? 'Active' : 'Inactive'}`);
        console.log(`   Currency: ${account.customer_client.currency_code}`);
        console.log(`   Timezone: ${account.customer_client.time_zone}`);
      });
    }
    
    if (clients.length > 0) {
      console.log('\n📊 CLIENT ACCOUNTS:');
      clients.forEach(account => {
        console.log(`\n   ${account.customer_client.descriptive_name || 'Unnamed'}`);
        console.log(`   ID: ${account.customer_client.id}`);
        console.log(`   Status: ${account.customer_client.status === 2 ? 'Active' : 'Inactive'}`);
        console.log(`   Currency: ${account.customer_client.currency_code}`);
        console.log(`   Timezone: ${account.customer_client.time_zone}`);
      });
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check if EasyPrint SG is in the list
    const easyPrintId = '5962724983';
    const hasEasyPrint = accounts.some(a => a.customer_client.id === easyPrintId);
    
    if (!hasEasyPrint) {
      console.log(`⚠️  WARNING: EasyPrint SG (${easyPrintId}) is NOT linked to your Manager Account\n`);
      console.log('To fix this:');
      console.log('1. Log into Google Ads with your Manager Account');
      console.log('2. Send a link request to EasyPrint SG account');
      console.log('3. Accept the link request from EasyPrint SG account');
      console.log('\nOR\n');
      console.log('Use one of the client accounts listed above by updating GOOGLE_ADS_CUSTOMER_ID in .env');
    } else {
      console.log('✅ EasyPrint SG account is linked to your Manager Account');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.errors?.[0]?.message || error.message);
  }
}

// Run the script
listAllAccounts().catch(console.error);