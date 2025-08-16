================================================================================
PRODUCT REQUIREMENTS DOCUMENT (PRD)
GOOGLE ANALYTICS DASHBOARD - MVP WITH SUPABASE AUTH
VERSION 4.0 - WITH GOOGLE ADS API INTEGRATION
================================================================================

1. EXECUTIVE SUMMARY
--------------------
Build an MVP analytics dashboard that displays Google Analytics 4 (GA4) metrics with real-time spend and performance data from Google Ads API, with PDF upload capability as override/backup option. Uses pure Supabase Authentication for simplicity. Multi-tenant architecture will be added in future iterations.

2. PROJECT OVERVIEW
-------------------

2.1 Objectives
- Create secure dashboard with Supabase Authentication
- Display key marketing metrics from GA4 (single property for MVP)
- Fetch real-time spend and performance data from Google Ads API
- Parse and extract spend data from uploaded PDF bills (override/backup)
- Maintain existing MCP server functionality for AI agents
- Provide dynamic date range filtering
- Display data through metric cards and interactive charts

2.2 Architecture Approach
- Frontend: React/Next.js with Tailwind CSS (Port 3000)
- Backend: Express REST API (Port 5000)
- Authentication: Supabase Auth (pure - no NextAuth)
- Database: Supabase Cloud with Row Level Security (RLS)
- File Processing: PDF parsing for spend data override
- MCP Server: Standalone (stdio, no port required)
- GA4 Integration: Shared core module (single property for MVP)
- Google Ads Integration: API client for real-time metrics

2.3 MVP Scope vs Future
MVP (Current):
- Single GA4 property for all users
- Single Google Ads account for MVP (multi-account in Phase 2)
- User-specific spend data from PDFs OR Google Ads API
- Basic authentication and authorization
- Real impressions/clicks from Google Ads API (with mock data fallback)

Future (Phase 2):
- Multi-tenant architecture
- Multiple GA4 properties
- Multiple Google Ads accounts (MCC support)
- Team/organization management
- User-specific OAuth for Google Ads

3. TECHNICAL ARCHITECTURE
-------------------------

3.1 Runtime Architecture (MVP - Single Tenant)
----
Web Dashboard (localhost:3000)
React 18 + Tailwind + Supabase Client
         ↓ HTTP (Supabase Token)
Express REST API (localhost:5000)
    ↓         ↓           ↓           ↓
GA4 Core   Google Ads  Supabase    PDF Parser
Module     API Client   Client      (pdf-parse)
    ↓         ↓           ↓           ↓
Single GA4  Google Ads  Supabase    Extracted
Property    Account     Database    Spend Data
                       (with RLS)

Additional Data Source (MVP Enhancement):
----
Express REST API (localhost:5000)
         ↓
Google Ads API Client
         ↓
Google Ads Account
    ├── Campaign Spend (Real)
    ├── Impressions (Real)
    ├── Click Rate (Real)
    └── Campaign Performance (Real)

Data Priority:
1. Google Ads API (when available)
2. PDF Uploads (user override)
3. Mock Data (fallback)
----

Separate Process:
GA4 MCP Server (stdio) → GA4 Core Module → Google Analytics
(For AI assistants only, not used by web app)
----

3.2 Authentication Flow (Simplified)
----
1. User Registration/Login
   Browser → Supabase Auth → Returns Session + JWT

2. API Calls
   Browser → Express API (with Supabase JWT) → Verify with Supabase

3. Database Access
   Supabase RLS policies enforce user-specific data access
----

3.3 Code Structure
----
google-analytics-mcp/
├── src/
│   ├── core/
│   │   ├── analytics-core.js  # Shared GA4 logic
│   │   └── ads-core.js        # Google Ads API logic
│   ├── mcp/
│   │   └── index.js           # MCP Server (DO NOT MODIFY)
│   ├── api/
│   │   ├── server.js          # Express REST API
│   │   ├── middleware/
│   │   │   └── auth.js        # Supabase token verification
│   │   └── routes/
│   │       ├── upload.js      # PDF upload endpoint
│   │       ├── analytics.js   # GA4 endpoints
│   │       ├── google-ads.js  # Google Ads endpoints
│   │       ├── spend.js       # Spend data endpoints
│   │       └── dashboard.js   # Combined data endpoints
│   └── db/
│       └── supabase-client.js # Supabase JS client
├── web/                       # Frontend Next.js app
│   ├── app/
│   │   ├── layout.tsx        # Root layout with Supabase
│   │   ├── globals.css       # Tailwind imports
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx      # Dashboard (protected)
│   │   └── uploads/
│   │       └── page.tsx      # PDF upload page
│   ├── components/
│   │   ├── AuthProvider.tsx  # Supabase auth context
│   │   ├── ProtectedRoute.tsx
│   │   ├── MetricCard.tsx
│   │   ├── FileUpload.tsx
│   │   └── charts/
│   └── lib/
│       └── supabase.ts       # Supabase client config
├── test-scripts/
└── package.json
----

4. FEATURE REQUIREMENTS
-----------------------

4.1 Authentication (Supabase Auth)
- Email/password registration
- Email verification (optional for MVP)
- Password reset functionality
- Session management via Supabase
- Automatic token refresh
- Logout functionality

4.2 PDF Upload and Parsing
- Upload PDF bills (up to 10MB per file)
- Parse PDF to extract:
  - Campaign names
  - Spend amounts
  - Date periods
- Store parsed data with user_id
- View upload history
- Manual correction of parsed data
- Override Google Ads API data when needed

4.3 Dashboard Metrics (MVP)

METRIC CARDS
| Metric            | Data Source | Notes                           |
|-------------------|-------------|---------------------------------|
| Total Campaigns   | GA4         | From single GA4 property       |
| Total Impressions | Google Ads API / Mock | Real data with fallback   |
| Click Rate        | Google Ads API / Mock | Real CTR with fallback     |
| Total Sessions    | GA4         | Paid channels only (Paid Search, Display, Paid Video) |
| Total Users       | GA4         | Paid channels only (Paid Search, Display, Paid Video) |
| Avg Bounce Rate   | GA4         | From single GA4 property       |
| Conversions       | Google Ads API / GA4 | Real conversions data      |
| Total Spend       | Google Ads API / PDFs | API primary, PDFs override |

**CRITICAL: GA4 Data Calculation Rules**
- Total Sessions and Total Users MUST be filtered to only include paid channels: Paid Search, Display, and Paid Video
- Query MUST use `sessionDefaultChannelGroup` dimension WITHOUT date dimension to avoid double-counting users
- The GA4 query should use: `dimensions: ['sessionDefaultChannelGroup']` NOT `dimensions: ['date', 'sessionDefaultChannelGroup']`
- This prevents counting the same user multiple times if they visit on different days
- The sumUsers() and sumSessions() functions must reference dimensionValues[0] for the channel group
- All users see same GA4 data (single property) but different spend data (user-specific)

4.4 Google Ads Integration (MVP Enhancement)

CAPABILITIES:
- Fetch real-time campaign spend data
- Retrieve actual impressions and clicks
- Calculate true click-through rates
- Show campaign-level performance breakdown

DATA HIERARCHY:
1. **Google Ads API (Primary)**: Live data when available
2. **PDF Uploads (Override)**: User can override with actual bills
3. **Mock Data (Fallback)**: When API unavailable or during setup

IMPLEMENTATION APPROACH:
- Single Google Ads account for MVP (configured via env variables)
- Automatic fallback to mock data on API errors
- Clear badges indicating data source (Live/PDF/Mock)
- Rate limit handling and caching for API efficiency

METRICS AVAILABLE FROM GOOGLE ADS:
| Metric | API Field | Update Frequency |
|--------|-----------|------------------|
| Spend | cost_micros | Real-time |
| Impressions | impressions | Real-time |
| Clicks | clicks | Real-time |
| CTR | ctr | Real-time |
| Conversions | conversions | Real-time |
| CPC | average_cpc | Real-time |

4.5 Data Source Priority and Reconciliation

DATA SOURCE HIERARCHY:
```
┌─────────────────────────────────────┐
│ 1. Google Ads API (Live)            │
│    └── If available: Use for all    │
│        impressions, clicks, spend   │
├─────────────────────────────────────┤
│ 2. PDF Uploads (Override)           │
│    └── If uploaded: Override spend  │
│        only, keep other metrics     │
├─────────────────────────────────────┤
│ 3. Mock Data (Fallback)             │
│    └── If API fails: Use mock for   │
│        all unavailable metrics      │
└─────────────────────────────────────┘
```

RECONCILIATION RULES:
- If user uploads PDF with different spend than API: Use PDF value
- If API is unavailable: Show last cached value or mock
- Always display data source badge (Live/PDF/Mock)
- Log discrepancies between PDF and API for review

CACHING STRATEGY:
- Cache Google Ads data for 1 hour
- Refresh on demand with manual refresh button
- Store last successful fetch in database

5. DATABASE SCHEMA (SUPABASE WITH RLS)
--------------------------------------

5.1 Schema Definition
----
-- Users managed by Supabase Auth (auth.users table)

-- PDF Upload History (user-specific)
CREATE TABLE pdf_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP DEFAULT NOW(),
  processing_status TEXT DEFAULT 'pending',
  parsed_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign Spend Table (user-specific)
CREATE TABLE campaigns_spend (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES pdf_uploads(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  spend_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'pdf', -- 'pdf' or 'google_ads_api'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Google Ads Cache Table (for API data caching)
CREATE TABLE google_ads_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour'
);

-- Row Level Security Policies
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_cache ENABLE ROW LEVEL SECURITY;

-- Users can only see their own uploads
CREATE POLICY "Users can view own uploads" ON pdf_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" ON pdf_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own spend data
CREATE POLICY "Users can view own spend" ON campaigns_spend
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own spend" ON campaigns_spend
  FOR ALL USING (auth.uid() = user_id);

-- Google Ads cache is available to all authenticated users (single account MVP)
CREATE POLICY "Authenticated users can view cache" ON google_ads_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);
----

6. API ENDPOINTS
----------------

6.1 Authentication (Handled by Supabase Client)
- No custom auth endpoints needed
- Supabase SDK handles login/signup/logout
- Token automatically included in requests

6.2 Upload Endpoints (Protected by Supabase Token)
POST /api/upload/pdf - Upload PDF bill
GET  /api/upload/history - Get user's upload history
GET  /api/upload/:id - Get specific upload details
POST /api/upload/:id/verify - Verify/correct parsed data

6.3 Analytics Endpoints (Protected)
GET /api/analytics/query - GA4 data (same for all users)
GET /api/analytics/traffic-sources
GET /api/analytics/devices
GET /api/analytics/mock/impressions - Mock data (fallback)
GET /api/analytics/mock/clickrate - Mock data (fallback)

6.4 Google Ads Endpoints (Protected)
GET /api/google-ads/campaigns - List all campaigns with metrics
GET /api/google-ads/spend - Get total spend for date range
GET /api/google-ads/metrics - Get all metrics (impressions, clicks, CTR)
POST /api/google-ads/refresh - Force refresh cached data

6.5 Dashboard Endpoints (Protected)
GET /api/dashboard/metrics - Combined metrics
  IMPLEMENTATION REQUIREMENTS:
  - MUST query GA4 with dimensions: ['sessionDefaultChannelGroup'] only
  - MUST NOT include 'date' dimension to prevent user double-counting
  - MUST filter to paid channels: ['Paid Search', 'Display', 'Paid Video']
  - sumUsers() and sumSessions() MUST use dimensionValues[0] for channel
  - Include Google Ads data with fallback to mock
GET /api/dashboard/charts/traffic
GET /api/dashboard/charts/devices
GET /api/dashboard/charts/geographic
GET /api/dashboard/charts/campaigns - Campaign performance from Google Ads

6.6 Spend Endpoints (Protected, User-specific)
GET /api/spend - Get user's spend data (combined sources)
PUT /api/spend/:id - Update spend entry
DELETE /api/spend/:id - Delete spend entry
GET /api/spend/reconcile - Compare API vs PDF data

7. IMPLEMENTATION PHASES
------------------------

PHASE 0: Setup & Supabase Auth (Week 1)
[x] Configure Supabase project
[x] Enable email auth in Supabase
[x] Set up RLS policies
[x] Create database tables
[x] Update package.json scripts

PHASE 1: Core Infrastructure (Week 1-2)
[x] Extract GA4 logic into analytics-core.js
[x] Refactor MCP server to use core module
[x] Set up Express API with Supabase verification
[x] Configure Supabase client (frontend & backend)
[x] Implement protected routes

PHASE 2: PDF Processing (Week 2)
[x] Implement PDF upload endpoint
[x] Add PDF parsing logic
[x] Store parsed data with user_id
[x] Create upload history UI
[x] Add verification UI

PHASE 3: Dashboard Development (Week 3)
[x] Build login/signup pages with Supabase
[x] Create dashboard with metric cards
[x] Add mock data indicators
[x] Implement charts
[x] Connect to backend API

PHASE 4: Google Ads Integration (Completed)
[x] Set up Google Ads API credentials
[x] Create Google Ads core module
[x] Implement API endpoints for real-time data
[x] Update dashboard to use live data
[x] Add data source indicators (Live/PDF/Mock)
[x] Implement caching strategy

PHASE 5: Polish & Testing (Week 4)
[ ] Add loading states
[ ] Implement error handling
[ ] Test RLS policies
[ ] Responsive design testing
[ ] Performance optimization
[ ] Test Google Ads fallback

PHASE 6: Deployment Preparation
[ ] Configure production environment
[ ] Set up monitoring
[ ] Document API
[ ] Create user guide

8. ENVIRONMENT CONFIGURATION
----------------------------

# .env (Backend)
GA_PROPERTY_ID=your_property_id
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# Google Ads API Configuration (MVP Enhancement)
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id
GOOGLE_ADS_LOGIN_CUSTOMER_ID=your_mcc_id_if_applicable

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

API_PORT=5000
NODE_ENV=development

# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

9. DEVELOPMENT SETUP
--------------------

9.1 Prerequisites
- Node.js 18+
- Supabase account with project created
- Google Analytics property with service account
- GA4 credentials JSON file
- Google Ads API developer token
- Google Ads account access

9.2 Installation Steps

# Backend setup
npm install express cors dotenv
npm install @supabase/supabase-js
npm install multer pdf-parse
npm install express-rate-limit helmet
npm install google-ads-api
npm install --save-dev nodemon concurrently

# Frontend setup
cd web
npx create-next-app@latest . --typescript --tailwind --app
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
npm install recharts axios date-fns
npm install lucide-react react-dropzone
npm install clsx tailwind-merge

9.3 Package.json Scripts
{
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:web\"",
    "dev:api": "nodemon src/api/server.js",
    "dev:web": "cd web && npm run dev",
    "start:api": "node src/api/server.js",
    "start:mcp": "node src/mcp/index.js",
    "test:connection": "node test-scripts/test-connection.cjs",
    "test:google-ads": "node test-scripts/test-google-ads.cjs"
  }
}

10. SUCCESS CRITERIA (MVP)
--------------------------

10.1 Functional Requirements
[x] Users can sign up and log in via Supabase
[x] Users can upload PDF bills
[x] Dashboard shows GA4 metrics (same for all users)
[x] Dashboard shows real spend from Google Ads API
[x] Dashboard shows real impressions/CTR from Google Ads API
[x] Fallback to mock data works when API unavailable
[x] Data source badges clearly indicate Live/PDF/Mock
[x] PDF uploads can override API data
[x] Date range filtering works
[x] MCP server remains functional

10.2 Performance Requirements
- Dashboard load < 3 seconds
- PDF processing < 10 seconds
- API response < 500ms
- Google Ads data cached for 1 hour

10.3 Security Requirements
- RLS policies enforce data isolation
- Tokens expire and refresh properly
- File uploads validated
- Google Ads credentials secured

11. FUTURE ENHANCEMENTS (POST-MVP)
----------------------------------

11.1 Multi-Tenant Architecture
- Store GA4 credentials per organization
- Isolate GA4 data by tenant
- Multiple Google Ads accounts (MCC)
- User-specific Google Ads OAuth connections
- Team management features
- Organization settings

11.2 Advanced Google Ads Features
- Historical spend trend analysis
- Keyword-level performance data
- Ad group and ad-level metrics
- Automated bid strategy recommendations
- Budget pacing analysis
- Competitor analysis

11.3 Advanced Features
- Automated report generation
- Data export capabilities
- Advanced visualizations
- AI insights using MCP
- Custom alerts and notifications
- API rate limit management

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
    "google-ads-api": "^14.0.0",
    "multer": "^1.4.5",
    "pdf-parse": "^1.1.1",
    "express-rate-limit": "^7.0.0",
    "helmet": "^7.0.0"
  }
}

12.2 Frontend Dependencies
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "@supabase/supabase-js": "^2.39.0",
    "tailwindcss": "^3.4.0",
    "recharts": "^2.12.0",
    "axios": "^1.6.0",
    "react-dropzone": "^14.2.0",
    "lucide-react": "^0.400.0"
  }
}

================================================================================
END OF DOCUMENT

This PRD includes Google Ads API integration for real-time metrics.
PDF uploads remain as an override/backup mechanism.
Data source hierarchy: API → PDF → Mock with clear indicators.
Single GA4 property and single Google Ads account for MVP.
Multi-tenant architecture deferred to Phase 2.
================================================================================