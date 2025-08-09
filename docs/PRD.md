================================================================================
PRODUCT REQUIREMENTS DOCUMENT (PRD)
GOOGLE ANALYTICS DASHBOARD - MVP WITH SUPABASE AUTH
VERSION 3.0 - SIMPLIFIED AUTHENTICATION
================================================================================

1. EXECUTIVE SUMMARY
--------------------
Build an MVP analytics dashboard that displays Google Analytics 4 (GA4) metrics with spend data extracted from uploaded PDF bills. Uses pure Supabase Authentication for simplicity. Multi-tenant architecture will be added in future iterations.

2. PROJECT OVERVIEW
-------------------

2.1 Objectives
- Create secure dashboard with Supabase Authentication
- Display key marketing metrics from GA4 (single property for MVP)
- Parse and extract spend data from uploaded PDF bills
- Maintain existing MCP server functionality for AI agents
- Provide dynamic date range filtering
- Display data through metric cards and interactive charts

2.2 Architecture Approach
- Frontend: React/Next.js with Tailwind CSS (Port 3000)
- Backend: Express REST API (Port 5000)
- Authentication: Supabase Auth (pure - no NextAuth)
- Database: Supabase Cloud with Row Level Security (RLS)
- File Processing: PDF parsing for spend data
- MCP Server: Standalone (stdio, no port required)
- GA4 Integration: Shared core module (single property for MVP)

2.3 MVP Scope vs Future
MVP (Current):
- Single GA4 property for all users
- User-specific spend data from PDFs
- Basic authentication and authorization
- Mock data for impressions/clicks

Future (Phase 2):
- Multi-tenant architecture
- Multiple GA4 properties
- Team/organization management
- Real impressions/clicks data

3. TECHNICAL ARCHITECTURE
-------------------------

3.1 Runtime Architecture (MVP - Single Tenant)
----
Web Dashboard (localhost:3000)
React 18 + Tailwind + Supabase Client
         ↓ HTTP (Supabase Token)
Express REST API (localhost:5000)
    ↓         ↓           ↓
GA4 Core   Supabase    PDF Parser
Module     Client      (pdf-parse)
    ↓         ↓           ↓
Single GA4  Supabase    Extracted
Property    Database    Spend Data
            (with RLS)

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
│   │   └── analytics-core.js  # Shared GA4 logic
│   ├── mcp/
│   │   └── index.js           # MCP Server (DO NOT MODIFY)
│   ├── api/
│   │   ├── server.js          # Express REST API
│   │   ├── middleware/
│   │   │   └── auth.js        # Supabase token verification
│   │   └── routes/
│   │       ├── upload.js      # PDF upload endpoint
│   │       ├── analytics.js   # GA4 endpoints
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

4.3 Dashboard Metrics (MVP)

METRIC CARDS
| Metric            | Data Source | Notes                           |
|-------------------|-------------|---------------------------------|
| Total Campaigns   | GA4         | From single GA4 property       |
| Total Impressions | Mock Data   | Random 10K-50K with badge       |
| Click Rate        | Mock Data   | Random 2-5% with badge          |
| Total Sessions    | GA4         | From single GA4 property       |
| Total Users       | GA4         | From single GA4 property       |
| Avg Bounce Rate   | GA4         | From single GA4 property       |
| Conversions       | GA4         | From single GA4 property       |
| Total Spend       | User PDFs   | User-specific from uploads     |

Note: All users see same GA4 data (single property) but different spend data (user-specific)

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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns_spend ENABLE ROW LEVEL SECURITY;

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
GET /api/analytics/mock/impressions - Mock data
GET /api/analytics/mock/clickrate - Mock data

6.4 Dashboard Endpoints (Protected)
GET /api/dashboard/metrics - Combined metrics
GET /api/dashboard/charts/traffic
GET /api/dashboard/charts/devices
GET /api/dashboard/charts/geographic

6.5 Spend Endpoints (Protected, User-specific)
GET /api/spend - Get user's spend data
PUT /api/spend/:id - Update spend entry
DELETE /api/spend/:id - Delete spend entry

7. IMPLEMENTATION PHASES
------------------------

PHASE 0: Setup & Supabase Auth (Week 1)
[ ] Configure Supabase project
[ ] Enable email auth in Supabase
[ ] Set up RLS policies
[ ] Create database tables
[ ] Update package.json scripts

PHASE 1: Core Infrastructure (Week 1-2)
[x] Extract GA4 logic into analytics-core.js
[x] Refactor MCP server to use core module
[ ] Set up Express API with Supabase verification
[ ] Configure Supabase client (frontend & backend)
[ ] Implement protected routes

PHASE 2: PDF Processing (Week 2)
[ ] Implement PDF upload endpoint
[ ] Add PDF parsing logic
[ ] Store parsed data with user_id
[ ] Create upload history UI
[ ] Add verification UI

PHASE 3: Dashboard Development (Week 3)
[ ] Build login/signup pages with Supabase
[ ] Create dashboard with metric cards
[ ] Add mock data indicators
[ ] Implement charts
[ ] Connect to backend API

PHASE 4: Polish & Testing (Week 4)
[ ] Add loading states
[ ] Implement error handling
[ ] Test RLS policies
[ ] Responsive design testing
[ ] Performance optimization

PHASE 5: Deployment Preparation

8. ENVIRONMENT CONFIGURATION
----------------------------

# .env (Backend)
GA_PROPERTY_ID=your_property_id
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
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

9.2 Installation Steps

# Backend setup
npm install express cors dotenv
npm install @supabase/supabase-js
npm install multer pdf-parse
npm install express-rate-limit helmet
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
    "test:connection": "node test-scripts/test-connection.cjs"
  }
}

10. SUCCESS CRITERIA (MVP)
--------------------------

10.1 Functional Requirements
[ ] Users can sign up and log in via Supabase
[ ] Users can upload PDF bills
[ ] Dashboard shows GA4 metrics (same for all users)
[ ] Dashboard shows user-specific spend from PDFs
[ ] Mock data clearly indicated
[ ] Date range filtering works
[ ] MCP server remains functional

10.2 Performance Requirements
- Dashboard load < 3 seconds
- PDF processing < 10 seconds
- API response < 500ms

10.3 Security Requirements
- RLS policies enforce data isolation
- Tokens expire and refresh properly
- File uploads validated

11. FUTURE ENHANCEMENTS (POST-MVP)
----------------------------------

11.1 Multi-Tenant Architecture
- Store GA4 credentials per organization
- Isolate GA4 data by tenant
- Team management features
- Organization settings

11.2 Real Metrics
- Replace mock impressions with real data
- Integrate Google Ads API
- Custom GA4 events

11.3 Advanced Features
- Automated report generation
- Data export capabilities
- Advanced visualizations
- AI insights using MCP

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

This PRD focuses on MVP delivery with pure Supabase Auth.
Multi-tenant architecture is documented as a future enhancement.
Single GA4 property serves all users with user-specific spend data.
================================================================================