import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Analytics Dashboard API',
      version: '1.0.0',
      description: 'API for Google Analytics Dashboard with GA4 and Google Ads integration',
      contact: {
        name: 'API Support',
        email: 'support@your-domain.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5050',
        description: 'Development server',
      },
      {
        url: 'https://api.your-domain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT token'
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            status: {
              type: 'integer',
              description: 'HTTP status code'
            }
          }
        },
        DashboardMetrics: {
          type: 'object',
          properties: {
            totalCampaigns: {
              type: 'number',
              description: 'Total number of campaigns'
            },
            totalImpressions: {
              type: 'number',
              description: 'Total ad impressions'
            },
            clickRate: {
              type: 'number',
              format: 'float',
              description: 'Click-through rate percentage'
            },
            totalSessions: {
              type: 'number',
              description: 'Total website sessions'
            },
            totalUsers: {
              type: 'number',
              description: 'Total unique users'
            },
            avgBounceRate: {
              type: 'number',
              format: 'float',
              description: 'Average bounce rate percentage'
            },
            conversions: {
              type: 'number',
              description: 'Total conversions'
            },
            totalSpend: {
              type: 'number',
              format: 'float',
              description: 'Total advertising spend'
            },
            dataSource: {
              type: 'string',
              enum: ['google_ads_api', 'cache', 'mock'],
              description: 'Source of the data'
            },
            mockDataFields: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Fields that contain mock data'
            }
          }
        },
        ChartData: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Chart segment name'
            },
            value: {
              type: 'number',
              description: 'Chart segment value'
            },
            users: {
              type: 'number',
              description: 'Number of users (optional)'
            },
            sessions: {
              type: 'number',
              description: 'Number of sessions (optional)'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/api/routes/*.js', './src/api/server.js'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Analytics Dashboard API Documentation'
  }));
  
  // Serve the swagger.json for external tools
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}

export { specs };