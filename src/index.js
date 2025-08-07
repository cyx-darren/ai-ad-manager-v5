import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

class GoogleAnalyticsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'google-analytics-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.analyticsDataClient = null;
    this.propertyId = process.env.GA_PROPERTY_ID;
    
    this.setupToolHandlers();
  }

  async initializeGoogleAnalytics() {
    if (this.analyticsDataClient) return;

    const auth = new GoogleAuth({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    this.analyticsDataClient = new BetaAnalyticsDataClient({
      auth: auth,
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'query_analytics',
          description: 'Run custom analytics queries with dimensions and metrics',
          inputSchema: {
            type: 'object',
            properties: {
              dimensions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Analytics dimensions (e.g., ["city", "country"])',
              },
              metrics: {
                type: 'array',
                items: { type: 'string' },
                description: 'Analytics metrics (e.g., ["sessions", "pageviews"])',
              },
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of rows to return',
                default: 100,
              },
            },
            required: ['dimensions', 'metrics', 'startDate', 'endDate'],
          },
        },
        {
          name: 'get_realtime_data',
          description: 'Get real-time analytics data',
          inputSchema: {
            type: 'object',
            properties: {
              metrics: {
                type: 'array',
                items: { type: 'string' },
                description: 'Real-time metrics (e.g., ["activeUsers"])',
                default: ['activeUsers'],
              },
              dimensions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Real-time dimensions (e.g., ["country", "city"])',
                default: [],
              },
            },
          },
        },
        {
          name: 'get_traffic_sources',
          description: 'Get traffic source data',
          inputSchema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of rows to return',
                default: 100,
              },
            },
            required: ['startDate', 'endDate'],
          },
        },
        {
          name: 'get_user_demographics',
          description: 'Get user demographic data',
          inputSchema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of rows to return',
                default: 100,
              },
            },
            required: ['startDate', 'endDate'],
          },
        },
        {
          name: 'get_page_performance',
          description: 'Get page performance metrics',
          inputSchema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of rows to return',
                default: 100,
              },
            },
            required: ['startDate', 'endDate'],
          },
        },
        {
          name: 'get_conversion_data',
          description: 'Get conversion and goal data',
          inputSchema: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of rows to return',
                default: 100,
              },
            },
            required: ['startDate', 'endDate'],
          },
        },
        {
          name: 'get_custom_report',
          description: 'Generate custom analytics reports with flexible parameters',
          inputSchema: {
            type: 'object',
            properties: {
              dimensions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Custom dimensions for the report',
              },
              metrics: {
                type: 'array',
                items: { type: 'string' },
                description: 'Custom metrics for the report',
              },
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
              orderBy: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metric: { type: 'string' },
                    desc: { type: 'boolean', default: true },
                  },
                },
                description: 'Sort order for the report',
              },
              filters: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fieldName: { type: 'string' },
                    operation: { type: 'string' },
                    value: { type: 'string' },
                  },
                },
                description: 'Filters to apply to the report',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of rows to return',
                default: 100,
              },
            },
            required: ['dimensions', 'metrics', 'startDate', 'endDate'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.initializeGoogleAnalytics();

      switch (request.params.name) {
        case 'query_analytics':
          return await this.queryAnalytics(request.params.arguments);
        case 'get_realtime_data':
          return await this.getRealtimeData(request.params.arguments);
        case 'get_traffic_sources':
          return await this.getTrafficSources(request.params.arguments);
        case 'get_user_demographics':
          return await this.getUserDemographics(request.params.arguments);
        case 'get_page_performance':
          return await this.getPagePerformance(request.params.arguments);
        case 'get_conversion_data':
          return await this.getConversionData(request.params.arguments);
        case 'get_custom_report':
          return await this.getCustomReport(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async queryAnalytics(args) {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: args.startDate,
            endDate: args.endDate,
          },
        ],
        dimensions: args.dimensions.map(name => ({ name })),
        metrics: args.metrics.map(name => ({ name })),
        limit: args.limit || 100,
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              rows: response.rows,
              rowCount: response.rowCount,
              dimensionHeaders: response.dimensionHeaders,
              metricHeaders: response.metricHeaders,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Analytics query failed: ${error.message}`);
    }
  }

  async getRealtimeData(args) {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dimensions: (args.dimensions || []).map(name => ({ name })),
        metrics: (args.metrics || ['activeUsers']).map(name => ({ name })),
      };

      const [response] = await this.analyticsDataClient.runRealtimeReport(request);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              rows: response.rows,
              rowCount: response.rowCount,
              dimensionHeaders: response.dimensionHeaders,
              metricHeaders: response.metricHeaders,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Real-time data query failed: ${error.message}`);
    }
  }

  async getTrafficSources(args) {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: args.startDate,
            endDate: args.endDate,
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
        limit: args.limit || 100,
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              rows: response.rows,
              rowCount: response.rowCount,
              dimensionHeaders: response.dimensionHeaders,
              metricHeaders: response.metricHeaders,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Traffic sources query failed: ${error.message}`);
    }
  }

  async getUserDemographics(args) {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: args.startDate,
            endDate: args.endDate,
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
        limit: args.limit || 100,
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              rows: response.rows,
              rowCount: response.rowCount,
              dimensionHeaders: response.dimensionHeaders,
              metricHeaders: response.metricHeaders,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`User demographics query failed: ${error.message}`);
    }
  }

  async getPagePerformance(args) {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: args.startDate,
            endDate: args.endDate,
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
        limit: args.limit || 100,
        orderBys: [
          {
            metric: { metricName: 'screenPageViews' },
            desc: true,
          },
        ],
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              rows: response.rows,
              rowCount: response.rowCount,
              dimensionHeaders: response.dimensionHeaders,
              metricHeaders: response.metricHeaders,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Page performance query failed: ${error.message}`);
    }
  }

  async getConversionData(args) {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: args.startDate,
            endDate: args.endDate,
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
        limit: args.limit || 100,
        orderBys: [
          {
            metric: { metricName: 'conversions' },
            desc: true,
          },
        ],
      };

      const [response] = await this.analyticsDataClient.runReport(request);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              rows: response.rows,
              rowCount: response.rowCount,
              dimensionHeaders: response.dimensionHeaders,
              metricHeaders: response.metricHeaders,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Conversion data query failed: ${error.message}`);
    }
  }

  async getCustomReport(args) {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: args.startDate,
            endDate: args.endDate,
          },
        ],
        dimensions: args.dimensions.map(name => ({ name })),
        metrics: args.metrics.map(name => ({ name })),
        limit: args.limit || 100,
      };

      if (args.orderBy && args.orderBy.length > 0) {
        request.orderBys = args.orderBy.map(order => ({
          metric: { metricName: order.metric },
          desc: order.desc !== false,
        }));
      }

      if (args.filters && args.filters.length > 0) {
        request.dimensionFilter = {
          andGroup: {
            expressions: args.filters.map(filter => ({
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
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              rows: response.rows,
              rowCount: response.rowCount,
              dimensionHeaders: response.dimensionHeaders,
              metricHeaders: response.metricHeaders,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Custom report query failed: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new GoogleAnalyticsMCPServer();
server.run().catch((error) => {
  process.exit(1);
});