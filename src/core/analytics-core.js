import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Core Google Analytics 4 functionality
 * Provides reusable GA4 query methods without MCP-specific dependencies
 */
export class GoogleAnalyticsCore {
  constructor(propertyId = null, credentialsPath = null) {
    this.analyticsDataClient = null;
    this.propertyId = propertyId || process.env.GA_PROPERTY_ID;
    this.credentialsPath = credentialsPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!this.propertyId) {
      throw new Error('GA Property ID is required. Set GA_PROPERTY_ID env variable or pass it to constructor');
    }
  }

  /**
   * Initialize the Google Analytics client
   */
  async initialize() {
    if (this.analyticsDataClient) return;

    const auth = new GoogleAuth({
      keyFilename: this.credentialsPath,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    this.analyticsDataClient = new BetaAnalyticsDataClient({
      auth: auth,
    });
  }

  /**
   * Ensure client is initialized before making requests
   */
  async ensureInitialized() {
    if (!this.analyticsDataClient) {
      await this.initialize();
    }
  }

  /**
   * Run a custom analytics query
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async queryAnalytics({ dimensions, metrics, startDate, endDate, limit = 100 }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: dimensions.map(name => ({ name })),
        metrics: metrics.map(name => ({ name })),
        limit: limit,
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        metadata: response.metadata,
        propertyQuota: response.propertyQuota,
      };
    } catch (error) {
      throw new Error(`Analytics query failed: ${error.message}`);
    }
  }

  /**
   * Get real-time analytics data
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async getRealtimeData({ metrics = ['activeUsers'], dimensions = [] }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dimensions: dimensions.map(name => ({ name })),
        metrics: metrics.map(name => ({ name })),
      };

      const [response] = await this.analyticsDataClient.runRealtimeReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        maximums: response.maximums,
        minimums: response.minimums,
        totals: response.totals,
      };
    } catch (error) {
      throw new Error(`Real-time data query failed: ${error.message}`);
    }
  }

  /**
   * Get traffic sources analysis
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async getTrafficSources({ startDate, endDate, limit = 100 }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
          { name: 'sessionCampaignName' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
        limit: limit,
        orderBys: [
          {
            metric: { metricName: 'sessions' },
            desc: true,
          },
        ],
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(`Traffic sources query failed: ${error.message}`);
    }
  }

  /**
   * Get user demographics data
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async getUserDemographics({ startDate, endDate, limit = 100 }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: [
          { name: 'country' },
          { name: 'city' },
          { name: 'userAgeBracket' },
          { name: 'userGender' },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
        limit: limit,
        orderBys: [
          {
            metric: { metricName: 'totalUsers' },
            desc: true,
          },
        ],
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(`User demographics query failed: ${error.message}`);
    }
  }

  /**
   * Get page performance metrics
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async getPagePerformance({ startDate, endDate, limit = 100 }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'exitRate' },
        ],
        limit: limit,
        orderBys: [
          {
            metric: { metricName: 'screenPageViews' },
            desc: true,
          },
        ],
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(`Page performance query failed: ${error.message}`);
    }
  }

  /**
   * Get conversion and goal data
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async getConversionData({ startDate, endDate, limit = 100 }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: [
          { name: 'eventName' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'conversions' },
          { name: 'totalRevenue' },
        ],
        limit: limit,
        orderBys: [
          {
            metric: { metricName: 'conversions' },
            desc: true,
          },
        ],
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(`Conversion data query failed: ${error.message}`);
    }
  }

  /**
   * Generate custom analytics report with flexible parameters
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async getCustomReport({ dimensions, metrics, startDate, endDate, orderBy = [], filters = [], limit = 100 }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: dimensions.map(name => ({ name })),
        metrics: metrics.map(name => ({ name })),
        limit: limit,
      };

      if (orderBy && orderBy.length > 0) {
        request.orderBys = orderBy.map(order => ({
          metric: { metricName: order.metric },
          desc: order.desc !== false,
        }));
      }

      if (filters && filters.length > 0) {
        request.dimensionFilter = {
          andGroup: {
            expressions: filters.map(filter => ({
              filter: {
                fieldName: filter.fieldName,
                stringFilter: {
                  matchType: filter.operation === 'exact' ? 'EXACT' : 'CONTAINS',
                  value: filter.value,
                },
              },
            })),
          },
        };
      }

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        metadata: response.metadata,
        propertyQuota: response.propertyQuota,
      };
    } catch (error) {
      throw new Error(`Custom report query failed: ${error.message}`);
    }
  }

  /**
   * Get campaign performance data
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async getCampaignPerformance({ startDate, endDate, limit = 100 }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: [
          { name: 'sessionCampaignName' },
          { name: 'sessionCampaignId' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'bounceRate' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
        ],
        limit: limit,
        orderBys: [
          {
            metric: { metricName: 'sessions' },
            desc: true,
          },
        ],
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(`Campaign performance query failed: ${error.message}`);
    }
  }

  /**
   * Get device and browser breakdown
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async getDeviceBreakdown({ startDate, endDate, limit = 100 }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: [
          { name: 'deviceCategory' },
          { name: 'operatingSystem' },
          { name: 'browser' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
        limit: limit,
        orderBys: [
          {
            metric: { metricName: 'sessions' },
            desc: true,
          },
        ],
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(`Device breakdown query failed: ${error.message}`);
    }
  }

  /**
   * Get geographic distribution data
   * @param {Object} params Query parameters
   * @returns {Object} Raw GA4 API response
   */
  async getGeographicData({ startDate, endDate, limit = 100 }) {
    await this.ensureInitialized();
    
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: startDate,
            endDate: endDate,
          },
        ],
        dimensions: [
          { name: 'country' },
          { name: 'region' },
          { name: 'city' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
        ],
        limit: limit,
        orderBys: [
          {
            metric: { metricName: 'sessions' },
            desc: true,
          },
        ],
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        rows: response.rows || [],
        rowCount: response.rowCount || 0,
        dimensionHeaders: response.dimensionHeaders || [],
        metricHeaders: response.metricHeaders || [],
        metadata: response.metadata,
      };
    } catch (error) {
      throw new Error(`Geographic data query failed: ${error.message}`);
    }
  }

  /**
   * Batch run multiple reports
   * @param {Array} reports Array of report configurations
   * @returns {Array} Array of raw GA4 API responses
   */
  async batchRunReports(reports) {
    await this.ensureInitialized();
    
    try {
      const requests = reports.map(report => ({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: report.startDate,
            endDate: report.endDate,
          },
        ],
        dimensions: report.dimensions.map(name => ({ name })),
        metrics: report.metrics.map(name => ({ name })),
        limit: report.limit || 100,
      }));

      const [response] = await this.analyticsDataClient.batchRunReports({
        property: `properties/${this.propertyId}`,
        requests: requests,
      });

      return response.reports.map(report => ({
        rows: report.rows || [],
        rowCount: report.rowCount || 0,
        dimensionHeaders: report.dimensionHeaders || [],
        metricHeaders: report.metricHeaders || [],
        metadata: report.metadata,
      }));
    } catch (error) {
      throw new Error(`Batch reports query failed: ${error.message}`);
    }
  }

  /**
   * Get available dimensions and metrics metadata
   * @returns {Object} Metadata about available dimensions and metrics
   */
  async getMetadata() {
    await this.ensureInitialized();
    
    try {
      const [response] = await this.analyticsDataClient.getMetadata({
        name: `properties/${this.propertyId}/metadata`,
      });

      return {
        dimensions: response.dimensions || [],
        metrics: response.metrics || [],
        comparisons: response.comparisons || [],
      };
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
  }
}

export default GoogleAnalyticsCore;