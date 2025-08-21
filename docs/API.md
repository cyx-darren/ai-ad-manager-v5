# Analytics Dashboard API Documentation

## Base URL
- Development: http://localhost:5050
- Production: https://api.your-domain.com

## Authentication
All endpoints require Bearer token authentication using Supabase JWT tokens.

```
Authorization: Bearer <supabase_jwt_token>
```

## Interactive Documentation
Access the interactive Swagger UI at:
- Development: http://localhost:5050/api-docs
- Production: https://api.your-domain.com/api-docs

## Core Endpoints

### Dashboard Metrics

#### GET /api/dashboard/metrics
Returns aggregated dashboard metrics from GA4, Google Ads, and user data.

**Parameters:**
- `startDate` (optional): Start date in YYYY-MM-DD format (default: 2025-08-01)
- `endDate` (optional): End date in YYYY-MM-DD format (default: 2025-08-07)

**Response:**
```json
{
  "totalCampaigns": 5,
  "totalImpressions": 25000,
  "clickRate": 3.2,
  "totalSessions": 1234,
  "totalUsers": 567,
  "avgBounceRate": 45.67,
  "conversions": 89,
  "totalSpend": 2992.50,
  "dataSource": "google_ads_api",
  "mockDataFields": []
}
```

#### GET /api/dashboard/spend/google-ads
Returns Google Ads spending data with currency conversion.

**Parameters:**
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format
- `includeCredits` (optional): Include credit adjustments (default: "true")

**Response:**
```json
{
  "totalSpend": 2992.50,
  "currency": "USD",
  "breakdown": {
    "gross": {
      "usd": 3200.00,
      "original": 3200.00,
      "originalCurrency": "USD"
    },
    "credits": {
      "usd": 207.50,
      "original": 207.50,
      "originalCurrency": "USD"
    }
  },
  "campaigns": [
    {
      "name": "Summer Campaign",
      "spend": 1500.00,
      "impressions": 12000,
      "clicks": 360
    }
  ],
  "source": "google_ads_api",
  "lastUpdated": "2025-08-21T13:47:59.227Z"
}
```

#### GET /api/dashboard/ads-metrics
Returns Google Ads performance metrics.

**Parameters:**
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format

**Response:**
```json
{
  "impressions": 25000,
  "clicks": 800,
  "ctr": 3.2,
  "spend": 2992.50,
  "conversions": 89,
  "avgCpc": 3.74,
  "source": "google_ads_api"
}
```

### Chart Data Endpoints

#### GET /api/dashboard/charts/traffic
Returns traffic source distribution data for donut charts.

**Response:**
```json
{
  "data": [
    { "name": "Paid Search", "value": 500, "users": 450 },
    { "name": "Display", "value": 300, "users": 280 },
    { "name": "Paid Social", "value": 200, "users": 180 }
  ]
}
```

#### GET /api/dashboard/charts/devices
Returns device breakdown data.

**Response:**
```json
{
  "data": [
    { "name": "Desktop", "value": 600, "users": 520 },
    { "name": "Mobile", "value": 350, "users": 310 },
    { "name": "Tablet", "value": 50, "users": 45 }
  ]
}
```

#### GET /api/dashboard/charts/geographic
Returns geographic distribution data.

**Response:**
```json
{
  "data": [
    { "name": "United States", "value": 500, "users": 450 },
    { "name": "Canada", "value": 200, "users": 180 },
    { "name": "United Kingdom", "value": 150, "users": 140 }
  ]
}
```

#### GET /api/dashboard/charts/campaigns
Returns campaign performance data.

**Response:**
```json
{
  "data": [
    {
      "name": "Summer Campaign",
      "value": 1500.00,
      "impressions": 12000,
      "clicks": 360,
      "conversions": 45
    }
  ]
}
```

### Analytics Endpoints

#### GET /api/analytics/query
Returns raw GA4 analytics data.

**Parameters:**
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format
- `dimensions` (optional): GA4 dimensions array
- `metrics` (optional): GA4 metrics array

**Response:**
```json
{
  "data": [
    {
      "date": "2025-08-01",
      "users": 123,
      "sessions": 156,
      "bounceRate": 0.45
    }
  ],
  "totals": {
    "users": 1234,
    "sessions": 1567,
    "bounceRate": 0.43
  }
}
```

### Upload Endpoints

#### POST /api/upload/pdf
Upload and parse PDF advertising bills.

**Body:** FormData with 'file' field containing PDF

**Response:**
```json
{
  "success": true,
  "upload_id": "uuid-string",
  "parsed_data": {
    "campaigns": [
      {
        "name": "Campaign Name",
        "amount": 1500.00,
        "date": "2025-08-01"
      }
    ]
  }
}
```

#### GET /api/upload/history
Returns user's PDF upload history.

**Response:**
```json
{
  "uploads": [
    {
      "id": "uuid-string",
      "filename": "ads-bill-august.pdf",
      "upload_date": "2025-08-21T13:47:59.227Z",
      "processing_status": "completed",
      "campaigns_count": 3
    }
  ]
}
```

### Utility Endpoints

#### GET /api/health
Health check endpoint (public, no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-21T13:47:59.227Z",
  "uptime": 321.309,
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "analyticsCore": "connected",
    "supabase": "connected"
  }
}
```

#### GET /api/metrics
Prometheus metrics endpoint for monitoring.

**Response:** Plain text Prometheus metrics format

#### GET /api/cache/stats
Cache performance statistics.

**Response:**
```json
{
  "totalRequests": 1234,
  "cacheHits": 1022,
  "cacheMisses": 212,
  "hitRate": 82.86,
  "averageResponseTime": 145
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error description",
  "status": 400,
  "timestamp": "2025-08-21T13:47:59.227Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- **Development**: 1000 requests per 15-minute window per IP
- **Production**: 100 requests per 15-minute window per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Data Sources and Fallbacks

The API uses multiple data sources with fallback hierarchy:

1. **Google Ads API**: Live campaign data (when available)
2. **Google Analytics 4**: Real-time website analytics
3. **User Uploads**: PDF-derived spending data (overrides API data)
4. **Cache**: Recently fetched data (1-hour TTL)
5. **Mock Data**: Fallback when live services are unavailable

Data source is indicated in response `source` field:
- `google_ads_api` - Live Google Ads data
- `ga4` - Google Analytics 4 data
- `cache` - Cached data from previous API calls
- `mock` - Sample/fallback data
- `pdf_upload` - User-uploaded data

## Authentication Flow

1. **Sign Up/Login**: Use Supabase Auth endpoints
2. **Get JWT Token**: Extract `access_token` from session
3. **API Requests**: Include token in Authorization header
4. **Token Refresh**: Handle token expiration with refresh logic

Example authentication code:
```javascript
const { data: { session } } = await supabase.auth.getSession()
const response = await fetch('/api/dashboard/metrics', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`
  }
})
```

## Data Caching

- **Cache Duration**: 1 hour for most endpoints
- **Cache Keys**: Based on endpoint + parameters + user ID
- **Cache Invalidation**: Manual refresh via cache stats endpoint
- **Cache Statistics**: Available at `/api/cache/stats`

## Performance Considerations

- **Response Times**: 95% of requests under 500ms
- **Data Freshness**: Live data updated every 5 minutes
- **Pagination**: Large datasets automatically paginated
- **Compression**: All responses compressed with gzip
- **CDN**: Static assets served via CDN in production

## SDK and Client Libraries

### JavaScript/TypeScript
```bash
npm install @your-org/analytics-dashboard-sdk
```

### cURL Examples
```bash
# Get dashboard metrics
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:5050/api/dashboard/metrics?startDate=2025-08-01&endDate=2025-08-07"

# Upload PDF
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -F "file=@bill.pdf" \
     "http://localhost:5050/api/upload/pdf"
```

## Support and Contact

- **Documentation**: Full interactive docs at `/api-docs`
- **GitHub**: [Repository Issues](https://github.com/your-org/analytics-dashboard)
- **Email**: api-support@your-domain.com
- **Status Page**: https://status.your-domain.com

## Changelog

### Version 1.0.0 (2025-08-21)
- Initial API release
- Google Ads integration
- GA4 analytics endpoints
- PDF upload and parsing
- Comprehensive monitoring
- Swagger documentation