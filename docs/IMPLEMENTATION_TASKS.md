================================================================================
IMPLEMENTATION TASKS CHECKLIST
MVP WITH PURE SUPABASE AUTHENTICATION
VERSION 3.0 - SIMPLIFIED AUTH
================================================================================

PROJECT: Google Analytics Dashboard MVP
STATUS: In Progress
LAST UPDATED: [Current Date]
TECH STACK: React 18 + Tailwind + Next.js 14 + Express + Supabase Auth

KEY SIMPLIFICATIONS:
- Pure Supabase Auth (no NextAuth/JWT complexity)
- Single GA4 property for MVP (multi-tenant later)
- User-specific spend data from PDFs
- Mock data for impressions/clicks
- RLS policies for data security

================================================================================
CURRENT STATUS
================================================================================
WORKING ON: Task 2.4 - PDF Upload Component
SESSION STARTED: [timestamp]
BLOCKERS: None
LAST TEST RUN: Task 2.3 protected dashboard verified with Playwright MCP - route protection working, metrics cards ready
NEXT ACTION: Create PDF upload component with drag & drop functionality

================================================================================
PHASE 0: SUPABASE SETUP & CONFIGURATION
================================================================================

--------------------------------------------------------------------------------
TASK 0.1: SUPABASE PROJECT SETUP
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED

STEPS IN SUPABASE DASHBOARD:
1. Go to https://app.supabase.com
2. Create new project (if not exists)
3. Go to Settings → API
4. Copy these values to .env:
   - Project URL → SUPABASE_URL
   - anon/public key → SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_KEY

5. Go to Authentication → Providers
6. Enable Email provider
7. Configure:
   - Enable email confirmations: OFF (for MVP)
   - Minimum password length: 6

ADD TO .env:
----
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx
----

ADD TO web/.env.local:
----
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
----

CHECKS AFTER COMPLETION:
----
Check 1: Test Supabase connection
Command: node -e "const {createClient} = require('@supabase/supabase-js'); const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY); console.log('Connected');"
EXPECT: "Connected"

Check 2: Verify Auth enabled
Navigate: Supabase Dashboard → Authentication → Providers
EXPECT: Email provider shows "Enabled"
----

--------------------------------------------------------------------------------
TASK 0.2: CREATE DATABASE TABLES WITH RLS
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED

RUN IN SUPABASE SQL EDITOR:
----
-- Create tables
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

-- Create indexes
CREATE INDEX idx_uploads_user ON pdf_uploads(user_id);
CREATE INDEX idx_spend_user ON campaigns_spend(user_id);
CREATE INDEX idx_spend_date ON campaigns_spend(date);

-- Enable RLS
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns_spend ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own uploads" 
ON pdf_uploads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" 
ON pdf_uploads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" 
ON pdf_uploads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spend" 
ON campaigns_spend FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own spend" 
ON campaigns_spend FOR ALL 
USING (auth.uid() = user_id);
----

DEVELOPMENT TESTING WITH MCP:
Tell Claude: "Use Supabase MCP to verify the tables were created with RLS policies"

CHECKS AFTER COMPLETION:
----
Check 1: Tables created
Navigate: Supabase Dashboard → Table Editor
EXPECT: See pdf_uploads and campaigns_spend tables

Check 2: RLS enabled
Navigate: Table Editor → Click table → RLS badge
EXPECT: Shows "RLS enabled" with policies listed

Check 3: Test user creation
Navigate: Authentication → Users → Add User
Create test user: test@example.com / Test123!
EXPECT: User created successfully
----

--------------------------------------------------------------------------------
TASK 0.3: PACKAGE.JSON SCRIPTS SETUP
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED
FILE: package.json

ADD THESE SCRIPTS:
----
{
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:web\"",
    "dev:api": "nodemon src/api/server.js",
    "dev:web": "cd web && npm run dev",
    "start:api": "node src/api/server.js",
    "start:mcp": "node src/mcp/index.js",
    "test:connection": "node test-scripts/test-connection.cjs",
    "test:supabase": "node -e \"const {createClient} = require('@supabase/supabase-js'); const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY); console.log('Supabase connected');\""
  }
}
----

CHECKS AFTER COMPLETION:
----
Check 1: Scripts added
Command: npm run
EXPECT: See all scripts listed

Check 2: Test Supabase connection
Command: npm run test:supabase
EXPECT: "Supabase connected"

Check 3: Test GA4 connection
Command: npm run test:connection
EXPECT: GA4 data retrieved
----

================================================================================
PHASE 1: BACKEND API WITH SUPABASE AUTH
================================================================================

--------------------------------------------------------------------------------
TASK 1.1: EXPRESS API WITH SUPABASE VERIFICATION
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED
FILES:
- src/api/server.js
- src/api/middleware/auth.js
- src/db/supabase-client.js

NPM PACKAGES TO INSTALL:
npm install express cors helmet express-rate-limit
npm install @supabase/supabase-js
npm install dotenv multer pdf-parse

CREATE SUPABASE CLIENT:
----
// src/db/supabase-client.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Backend client with service key for admin operations
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Regular client for auth verification
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
----

CREATE AUTH MIDDLEWARE:
----
// src/api/middleware/auth.js
import { supabase } from '../db/supabase-client.js';

export const verifySupabaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
----

CHECKS AFTER COMPLETION:
----
Check 1: Server starts
Command: npm run start:api
EXPECT: "API Server running on port 5050"

Check 2: Health endpoint (public)
Command: curl http://localhost:5050/api/health
EXPECT: {"status":"healthy"}

Check 3: Protected endpoint requires auth
Command: curl http://localhost:5050/api/dashboard/metrics
EXPECT: {"error":"No token provided"}
----

--------------------------------------------------------------------------------
TASK 1.2: PDF UPLOAD ENDPOINTS
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED
FILE: src/api/routes/upload.js

ENDPOINTS TO CREATE:
[ ] POST /api/upload/pdf - Upload and parse PDF
[ ] GET /api/upload/history - Get user's uploads
[ ] GET /api/upload/:id - Get upload details

MULTER SETUP:
----
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { supabaseAdmin } from '../db/supabase-client.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
});

// Upload endpoint
app.post('/api/upload/pdf', verifySupabaseToken, upload.single('file'), async (req, res) => {
  const userId = req.user.id;
  const file = req.file;
  
  // Parse PDF
  const pdfData = await pdfParse(file.buffer);
  
  // Extract spend data (customize based on your PDF format)
  const extractedData = extractSpendData(pdfData.text);
  
  // Store in database
  const { data, error } = await supabaseAdmin
    .from('pdf_uploads')
    .insert({
      user_id: userId,
      filename: file.originalname,
      file_size: file.size,
      parsed_data: extractedData,
      processing_status: 'completed'
    })
    .select()
    .single();
    
  // Store spend entries
  if (extractedData.campaigns) {
    await supabaseAdmin
      .from('campaigns_spend')
      .insert(
        extractedData.campaigns.map(c => ({
          user_id: userId,
          upload_id: data.id,
          campaign_name: c.name,
          spend_amount: c.amount,
          date: c.date
        }))
      );
  }
  
  res.json({ success: true, upload_id: data.id });
});
----

CHECKS AFTER COMPLETION:
----
Check 1: Upload endpoint exists
Command: curl -X POST http://localhost:5050/api/upload/pdf
EXPECT: {"error":"No token provided"}

Check 2: Upload history endpoint
Create a test token first, then:
Command: curl http://localhost:5050/api/upload/history -H "Authorization: Bearer [token]"
EXPECT: [] (empty array if no uploads)
----

--------------------------------------------------------------------------------
TASK 1.3: ANALYTICS ENDPOINTS WITH MOCK DATA
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED
FILE: src/api/routes/analytics.js

ENDPOINTS:
[x] GET /api/analytics/query - Real GA4 data
[x] GET /api/analytics/mock/impressions - Mock data
[x] GET /api/analytics/mock/clickrate - Mock data
[x] GET /api/analytics/mock/sessions - Mock data
[x] GET /api/analytics/mock/users - Mock data
[x] GET /api/analytics/mock/bounce-rate - Mock data
[x] GET /api/analytics/mock/conversions - Mock data

MOCK DATA IMPLEMENTATION:
----
// Mock impressions (10K-50K random)
app.get('/api/analytics/mock/impressions', verifySupabaseToken, (req, res) => {
  const impressions = Math.floor(Math.random() * 40000) + 10000;
  res.json({
    data: impressions,
    is_mock: true,
    note: 'Will be replaced with real data post-MVP'
  });
});

// Mock click rate (2-5% random)
app.get('/api/analytics/mock/clickrate', verifySupabaseToken, (req, res) => {
  const clickRate = (Math.random() * 3 + 2).toFixed(2);
  res.json({
    data: parseFloat(clickRate),
    unit: 'percentage',
    is_mock: true,
    note: 'Will be replaced with real data post-MVP'
  });
});
----

CHECKS AFTER COMPLETION:
----
Check 1: Mock impressions (need auth)
Command: curl http://localhost:5050/api/analytics/mock/impressions -H "Authorization: Bearer [token]"
EXPECT: {"data": 25000, "is_mock": true}

Check 2: Mock click rate
Command: curl http://localhost:5050/api/analytics/mock/clickrate -H "Authorization: Bearer [token]"
EXPECT: {"data": 3.5, "unit": "percentage", "is_mock": true}

Check 3: All endpoints require authentication
Command: curl http://localhost:5050/api/analytics/mock/impressions
EXPECT: {"error": "No token provided"}

Check 4: Test endpoints bypass auth
Command: curl http://localhost:5050/api/test/mock/impressions
EXPECT: {"data": [10000-50000], "is_mock": true}

✅ VERIFIED: All checks passed - impressions range 10K-50K, click rate 2-5%, auth required
----

--------------------------------------------------------------------------------
TASK 1.4: DASHBOARD AGGREGATION ENDPOINT
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED
FILE: src/api/routes/dashboard.js

ENDPOINT IMPLEMENTATION:
----
app.get('/api/dashboard/metrics', verifySupabaseToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.user.id;
  
  // Get GA4 data filtered by paid channels (Paid Search, Display, Paid Video)
  const ga4Data = await analyticsCore.queryAnalytics({
    dimensions: ['date', 'defaultChannelGroup'],
    metrics: ['sessions', 'totalUsers', 'bounceRate'],
    startDate,
    endDate,
    dimensionFilter: {
      filter: {
        fieldName: 'defaultChannelGroup',
        inListFilter: {
          values: ['Paid Search', 'Display', 'Paid Video']
        }
      }
    }
  });
  
  // Get user's spend from database
  const { data: spendData } = await supabaseAdmin
    .from('campaigns_spend')
    .select('spend_amount')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);
  
  const totalSpend = spendData?.reduce((sum, row) => 
    sum + Number(row.spend_amount), 0) || 0;
  
  // Get mock data
  const impressions = Math.floor(Math.random() * 40000) + 10000;
  const clickRate = (Math.random() * 3 + 2).toFixed(2);
  
  res.json({
    totalCampaigns: extractCampaignCount(ga4Data),
    totalImpressions: impressions,  // Mock
    clickRate: parseFloat(clickRate),  // Mock
    totalSessions: sumSessions(ga4Data), // From paid channels only
    totalUsers: sumUsers(ga4Data), // From paid channels only
    avgBounceRate: calculateBounceRate(ga4Data),
    conversions: extractConversions(ga4Data),
    totalSpend: totalSpend,  // User-specific
    mockDataFields: ['totalImpressions', 'clickRate']
  });
});
----

CHECKS AFTER COMPLETION:
----
Check 1: Dashboard metrics (requires auth)
Command: curl "http://localhost:5050/api/dashboard/metrics?startDate=2025-08-01&endDate=2025-08-07" -H "Authorization: Bearer [token]"
EXPECT: All 8 metrics with mockDataFields array

Check 2: Auth protection works
Command: curl "http://localhost:5050/api/dashboard/metrics?startDate=2025-08-01&endDate=2025-08-07"
EXPECT: {"error": "No token provided"}

Check 3: Dashboard summary endpoint
Command: curl http://localhost:5050/api/dashboard/summary -H "Authorization: Bearer [token]"
EXPECT: {"totalUploads": 0, "totalSpend": 0, "summary": {...}}

Check 4: Endpoint info available
Command: curl http://localhost:5050/api/dashboard/
EXPECT: Endpoint documentation and data types

✅ VERIFIED: All checks passed - auth protection working, endpoints integrated, mock data clearly marked
----

================================================================================
PHASE 2: FRONTEND WITH SUPABASE AUTH
================================================================================

--------------------------------------------------------------------------------
TASK 2.1: NEXT.JS SETUP WITH SUPABASE
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED
DIRECTORY: web/

COMMANDS TO RUN:
cd web
npx create-next-app@latest . --typescript --tailwind --app

INSTALL PACKAGES:
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
npm install recharts axios date-fns lucide-react
npm install react-dropzone clsx tailwind-merge

CREATE SUPABASE CLIENT:
----
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
----

CREATE AUTH PROVIDER:
----
// components/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

const AuthContext = createContext<{
  user: User | null
  loading: boolean
}>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
----

CHECKS AFTER COMPLETION:
----
Check 1: Frontend starts
Command: cd web && npm run dev
EXPECT: Next.js on localhost:3000

Check 2: Supabase client works
Open browser console at localhost:3000
Run: window.supabase = (await import('@/lib/supabase')).supabase
EXPECT: supabase object available

✅ VERIFIED: Frontend accessible on localhost:3000, Supabase client configured correctly
- Next.js 15.4.6 with TypeScript and Tailwind CSS
- Modern @supabase/ssr package for SSR support  
- AuthProvider with React Context for state management
- Environment variables configured correctly
- All required packages installed and working
----

--------------------------------------------------------------------------------
TASK 2.2: LOGIN AND SIGNUP PAGES
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED

CREATE LOGIN PAGE:
----
// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Sign In</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        
        <p className="text-center text-sm">
          Don't have an account? 
          <a href="/auth/signup" className="text-blue-600 ml-1">Sign Up</a>
        </p>
      </form>
    </div>
  )
}
----

CHECKS AFTER COMPLETION:
----
Check 1: Login page renders
Navigate: http://localhost:3000/auth/login
EXPECT: Login form with Tailwind styling

Check 2: Signup page renders
Navigate: http://localhost:3000/auth/signup
EXPECT: Signup form

Check 3: Test signup
Fill form and submit
EXPECT: User created in Supabase, redirects to dashboard

✅ VERIFIED WITH PLAYWRIGHT MCP: All checks passed
- Login page renders with professional Tailwind CSS styling
- Signup page renders with email, password, and confirm password fields
- Error handling works correctly (shows "Invalid login credentials")
- Navigation between login/signup pages works perfectly
- "Back to home" links function correctly
- Forms validate properly (password confirmation, minimum length)
- Supabase authentication integration working
- All pages are mobile-responsive and accessible
----

--------------------------------------------------------------------------------
TASK 2.3: PROTECTED DASHBOARD
--------------------------------------------------------------------------------
STATUS: [x] COMPLETED

CREATE PROTECTED ROUTE:
----
// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import MetricCard from '@/components/MetricCard'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchMetrics()
    }
  }, [user])

  const fetchMetrics = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/metrics?startDate=2025-08-01&endDate=2025-08-07`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      }
    )
    
    const data = await response.json()
    setMetrics(data)
  }

  if (loading) return <div>Loading...</div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Impressions"
            value={metrics?.totalImpressions}
            isMockData={true}
          />
          {/* Other metric cards */}
        </div>
      </div>
    </div>
  )
}
----

CHECKS AFTER COMPLETION:
----
Check 1: Protected route works
Navigate: http://localhost:3000/dashboard (not logged in)
EXPECT: Redirects to /auth/login

Check 2: Dashboard loads after login
Login, then navigate to dashboard
EXPECT: Dashboard with metric cards

Check 3: Mock data indicators
EXPECT: Impressions and Click Rate show "Mock Data" badge

✅ VERIFIED WITH PLAYWRIGHT MCP: All checks passed
- Protected route correctly redirects unauthenticated users to /auth/login
- Dashboard component created with professional metric cards layout
- MetricCard component supports mock data indicators
- Dashboard integrates with backend API for metrics fetching
- Error handling and loading states implemented
- Clean header with user email display and sign out functionality
- Responsive grid layout for metric cards
- Mock data badges clearly identify MVP placeholder data
- Date range information displayed for transparency
----

--------------------------------------------------------------------------------
TASK 2.4: PDF UPLOAD COMPONENT
--------------------------------------------------------------------------------
STATUS: [ ] Not Started

CREATE UPLOAD COMPONENT:
----
// components/FileUpload.tsx
'use client'

import { useDropzone } from 'react-dropzone'
import { useState } from 'react'
import { Upload } from 'lucide-react'

export default function FileUpload() {
  const [uploading, setUploading] = useState(false)
  
  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true)
    const file = acceptedFiles[0]
    
    const formData = new FormData()
    formData.append('file', file)
    
    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/upload/pdf`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      }
    )
    
    if (response.ok) {
      // Handle success
      console.log('Upload successful')
    }
    
    setUploading(false)
  }
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10485760, // 10MB
    multiple: false
  })
  
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2">
        {isDragActive ? 'Drop PDF here' : 'Drag & drop PDF or click'}
      </p>
      {uploading && <p>Uploading...</p>}
    </div>
  )
}
----

CHECKS AFTER COMPLETION:
----
Check 1: Upload component renders
Navigate: http://localhost:3000/uploads
EXPECT: Dropzone interface

Check 2: PDF upload works
Upload a test PDF
EXPECT: File uploads, shows in database
----

================================================================================
TESTING CHECKLIST
================================================================================

SUPABASE AUTH TESTING:
[ ] User can sign up
[ ] User can log in
[ ] Session persists on refresh
[ ] Logout clears session
[ ] Protected routes redirect

RLS TESTING:
[ ] User A cannot see User B's data
[ ] Uploads are user-specific
[ ] Spend data is isolated

MOCK DATA TESTING:
[ ] Impressions show random 10K-50K
[ ] Click rate shows random 2-5%
[ ] Mock badges display correctly

PDF UPLOAD TESTING:
[ ] PDF uploads successfully
[ ] Parse extracts data
[ ] Data saves to database
[ ] Shows in dashboard

================================================================================
QUICK REFERENCE COMMANDS
================================================================================

# Development
npm run dev                 # Start everything
npm run dev:api            # Backend only
npm run dev:web            # Frontend only

# Testing
npm run test:connection    # Test GA4
npm run test:supabase      # Test Supabase

# Create test user (Supabase Dashboard)
Email: test@example.com
Password: Test123!

# Test auth flow
1. Sign up at http://localhost:3000/auth/signup
2. Check user in Supabase Dashboard
3. Login at http://localhost:3000/auth/login
4. Access dashboard

================================================================================
NOTES
================================================================================

MVP SCOPE:
- Single GA4 property (all users see same data)
- Paid channel filtering (Sessions/Users from Paid Search, Display, Paid Video only)
- User-specific spend from PDFs
- Mock data for impressions/clicks
- Basic auth with Supabase

FUTURE (POST-MVP):
- Multi-tenant (multiple GA4 properties)
- Real impressions/clicks data
- Team management
- Advanced analytics

KEY SIMPLIFICATIONS:
- No JWT complexity (Supabase handles it)
- No NextAuth (pure Supabase)
- Single GA4 property (simpler config)
- RLS handles data isolation

================================================================================
END OF DOCUMENT
================================================================================