PRODUCT REQUIREMENTS DOCUMENT (PRD)
GOOGLE ANALYTICS DASHBOARD WITH MCP INTEGRATION
================================================

1. EXECUTIVE SUMMARY
--------------------
Build a web-based analytics dashboard that displays Google Analytics 4 (GA4) metrics and visualizations while maintaining the existing MCP server for AI assistant integration. The dashboard will combine real-time GA4 data with manually managed advertising spend data stored in Supabase Cloud.

2. PROJECT OVERVIEW
-------------------

2.1 Objectives
- Create a web dashboard displaying key marketing metrics from GA4
- Integrate manual advertising spend tracking
- Maintain existing MCP server functionality for AI agents
- Provide dynamic date range filtering
- Display data through metric cards and interactive charts

2.2 Architecture Approach
- Frontend: React/Next.js application (Port 3000)
- Backend: Express REST API (Port 5050)
- Database: Supabase Cloud (no local ports)
- MCP Server: Standalone (stdio, no port required)
- GA4 Integration: Shared core module between MCP and API

3. TECHNICAL ARCHITECTURE
-------------------------

3.1 System Architecture

Web Dashboard (localhost:3000)
         ↓ HTTP
Express REST API (localhost:5050)
    ↓         ↓
GA4 Core   Supabase Cloud
Module      Database
    ↓         
Google      [Manual Spend Data]
Analytics   [Cache Layer]

MCP Server (stdio) → GA4 Core Module → Google Analytics

3.2 Code Structure

google-analytics-mcp/
├── src/
│   ├── analytics-core.js      # Shared GA4 logic (NEW)
│   ├── index.js               # MCP Server (existing, refactored)
│   ├── api-server.js          # Express REST API (NEW)
│   ├── db/
│   │   ├── supabase-client.js # Supabase connection (NEW)
│   │   └── models/
│   │       ├── spend.js       # Spend data model (NEW)
│   │       ├── cache.js       # Cache model (NEW)
│   │       └── campaign.js    # Campaign model (NEW)
│   └── routes/
│       ├── analytics.js       # GA4 endpoints (NEW)
│       ├── spend.js          # Manual data endpoints (NEW)
│       └── dashboard.js      # Combined data endpoints (NEW)
├── web/                       # Frontend Next.js app (NEW)
│   ├── components/
│   │   ├── MetricCard.js
│   │   ├── DateRangePicker.js
│   │   └── charts/
│   │       ├── DonutChart.js
│   │       └── ChartContainer.js
│   └── pages/
│       └── dashboard.js
├── test-scripts/              # Existing test scripts
└── package.json

4. FEATURE REQUIREMENTS
-----------------------

4.1 Dashboard Metrics (Phase 1)

METRIC CARDS
Display the following metrics as cards with real-time data:

| Metric            | Data Source | Calculation                                              |
|-------------------|-------------|----------------------------------------------------------|
| Total Campaigns   | GA4         | Count unique campaign dimensions                         |
| Total Impressions | GA4         | Sum of impression metrics                                |
| Click Rate        | GA4         | (Clicks / Impressions) × 100                             |
| Total Sessions    | GA4         | Sum of sessions from Paid Search, Display, Paid Video    |
| Total Users       | GA4         | Sum of totalUsers from Paid Search, Display, Paid Video  |
| Avg Bounce Rate   | GA4         | Weighted average by sessions                             |
| Conversions       | GA4         | Sum of conversion events                                 |
| Total Spend       | Supabase    | Sum of manual spend entries                              |

DATE RANGE FUNCTIONALITY
- Global date range picker component
- Default: Last 30 days
- Options: Last 7/30/90 days, custom range
- All metrics update on date change

4.2 Data Visualizations (Phase 2)

CHART COMPONENTS
Four donut charts with drill-down capabilities:

1. Traffic Source Distribution
   - Dimensions: sessionSource, sessionMedium
   - Metrics: sessions
   - Groups: Organic, Paid, Direct, Social, etc.

2. Device Breakdown
   - Dimensions: deviceCategory
   - Metrics: sessions, totalUsers
   - Categories: Desktop, Mobile, Tablet

3. Campaign Type Performance
   - Dimensions: campaignName, sessionCampaignId
   - Metrics: sessions, conversions
   - Manual grouping by campaign type

4. Geographic Distribution
   - Dimensions: country, city
   - Metrics: sessions, totalUsers
   - Top 10 countries/regions

5. DATABASE SCHEMA (SUPABASE)
-----------------------------

-- Campaign Spend Table
CREATE TABLE campaigns_spend (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  campaign_id TEXT,
  spend_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_date (date),
  INDEX idx_campaign (campaign_id)
);

-- Analytics Cache Table (Optional)
CREATE TABLE analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_cache_key (cache_key),
  INDEX idx_expires (expires_at)
);

-- Campaign Metadata
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ga_campaign_id TEXT UNIQUE,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

6. API ENDPOINTS
----------------

6.1 Analytics Endpoints
GET /api/analytics/query
GET /api/analytics/traffic-sources
GET /api/analytics/devices
GET /api/analytics/geographic
GET /api/analytics/campaigns

6.2 Dashboard Endpoints
GET /api/dashboard/metrics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
GET /api/dashboard/charts/traffic?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
GET /api/dashboard/charts/devices?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
GET /api/dashboard/charts/campaigns?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
GET /api/dashboard/charts/geographic?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

6.3 Spend Management Endpoints
GET    /api/spend?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
POST   /api/spend
PUT    /api/spend/:id
DELETE /api/spend/:id
POST   /api/spend/bulk-import

7. IMPLEMENTATION PHASES
------------------------

PHASE 1: Core Infrastructure (Week 1)
[ ] Extract GA4 logic into analytics-core.js
[ ] Refactor MCP server to use core module
[ ] Set up Express API server
[ ] Configure Supabase Cloud connection
[ ] Create database schema

PHASE 2: Backend API (Week 2)
[ ] Implement GA4 REST endpoints
[ ] Create spend management CRUD operations
[ ] Build dashboard aggregation endpoints
[ ] Add error handling and logging
[ ] Implement basic caching

PHASE 3: Frontend Foundation (Week 3)
[ ] Set up Next.js project
[ ] Create layout and navigation
[ ] Implement date range picker
[ ] Build metric card components
[ ] Connect to backend API

PHASE 4: Data Visualizations (Week 4)
[ ] Implement chart components
[ ] Add chart data endpoints
[ ] Create interactive features
[ ] Add loading states and error handling
[ ] Implement data refresh

PHASE 5: Polish & Optimization (Week 5)
[ ] Add authentication (optional)
[ ] Implement comprehensive caching
[ ] Add CSV export functionality
[ ] Create spend data import UI
[ ] Performance optimization

8. ENVIRONMENT CONFIGURATION
----------------------------

# .env (Backend)
GA_PROPERTY_ID=your_property_id
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
API_PORT=5050
NODE_ENV=development

# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:5050
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

9. DEVELOPMENT SETUP
--------------------

9.1 Prerequisites
- Node.js 18+
- npm/yarn
- Google Analytics property with service account access
- Supabase Cloud account
- Existing GA4 credentials from MCP setup

9.2 Installation Steps

# Backend setup
npm install express cors dotenv
npm install @supabase/supabase-js
npm install --save-dev nodemon concurrently

# Frontend setup
cd web
npx create-next-app@latest .
npm install recharts axios date-fns
npm install @supabase/supabase-js

9.3 Running the Application

# Development mode (both frontend and backend)
npm run dev

# Individual services
npm run dev:api      # Backend only (port 5050)
npm run dev:frontend # Frontend only (port 3000)
npm run start:mcp    # MCP server (for AI agents)

10. SUCCESS CRITERIA
--------------------

10.1 Functional Requirements
[ ] All 8 metric cards display accurate data
[ ] Date range changes update all components
[ ] Charts render with correct data
[ ] Manual spend data can be added/edited
[ ] MCP server continues to work independently

10.2 Performance Requirements
- Dashboard initial load < 3 seconds
- Metric updates < 2 seconds after date change
- API response time < 500ms for cached data
- Support for date ranges up to 1 year

10.3 Quality Requirements
- Responsive design (mobile, tablet, desktop)
- Error handling for API failures
- Loading states for all async operations
- Data validation for manual entries

11. FUTURE ENHANCEMENTS
-----------------------

Phase 6+ Considerations:
- Real-time data updates via WebSockets
- Advanced filtering and segmentation
- Custom report builder
- Scheduled report emails
- Multi-user support with role-based access
- Advanced caching with Redis
- Comparison periods (vs previous period)
- Predictive analytics using historical data
- Integration with additional ad platforms
- AI-powered insights using MCP server

12. DEPENDENCIES
----------------

12.1 Backend Dependencies
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "@google-analytics/data": "^4.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "google-auth-library": "^9.0.0",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "concurrently": "^8.0.0"
  }
}

12.2 Frontend Dependencies
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "recharts": "^2.10.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "react-datepicker": "^4.25.0",
    "tailwindcss": "^3.4.0"
  }
}

13. RISK MITIGATION
-------------------

| Risk                         | Impact | Mitigation                           |
|------------------------------|--------|--------------------------------------|
| GA4 API rate limits          | High   | Implement caching, batch requests   |
| Manual data inconsistency    | Medium | Validation rules, audit logs        |
| Performance with large data  | Medium | Pagination, data aggregation         |
| Authentication complexity    | Low    | Start with basic auth, iterate      |

================================================
END OF DOCUMENT

This PRD provides a complete blueprint for building upon your existing MCP server to create a functional analytics dashboard. The phased approach allows for iterative development while maintaining your existing AI capabilities.