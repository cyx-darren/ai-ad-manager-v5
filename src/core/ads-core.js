import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

export class GoogleAdsCore {
  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    });
    
    this.customer = this.client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN
    });
  }

  async getCampaignSpend(startDate, endDate) {
    try {
      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.cost_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          segments.date
        FROM campaign
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
      `;
      
      const response = await this.customer.query(query);
      return this.formatSpendData(response);
    } catch (error) {
      console.error('Google Ads API error:', error);
      throw error;
    }
  }

  formatSpendData(response) {
    const campaigns = response.map(row => ({
      id: row.campaign.id,
      name: row.campaign.name,
      spend: row.metrics.cost_micros / 1000000, // Convert micros to currency
      impressions: row.metrics.impressions,
      clicks: row.metrics.clicks,
      conversions: row.metrics.conversions,
      date: row.segments.date
    }));

    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    
    return {
      totalSpend,
      campaigns,
      currency: 'USD'
    };
  }

  async getTotalSpend(startDate, endDate) {
    const data = await this.getCampaignSpend(startDate, endDate);
    return data.totalSpend;
  }

  async getAdsMetrics(startDate, endDate) {
    const query = `
      SELECT 
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM customer
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;
    
    const response = await this.customer.query(query);
    
    return {
      impressions: response[0]?.metrics.impressions || 0,
      clicks: response[0]?.metrics.clicks || 0,
      ctr: response[0]?.metrics.ctr || 0,
      spend: (response[0]?.metrics.cost_micros || 0) / 1000000,
      conversions: response[0]?.metrics.conversions || 0,
      avgCpc: (response[0]?.metrics.average_cpc || 0) / 1000000
    };
  }
}

export default GoogleAdsCore;