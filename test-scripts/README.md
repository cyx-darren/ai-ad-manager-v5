# Test Scripts

This directory contains various test and debugging scripts for the Google Analytics 4 integration.

## Prerequisites

All scripts require:
- `.env` file configured in project root with:
  - `GA_PROPERTY_ID` - Your GA4 property ID
  - `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON file
- Node.js dependencies installed (`npm install`)

## Available Scripts

### 🔧 Core Testing

#### `test-connection.cjs`
**Purpose:** Basic connection and authentication test  
**What it does:**
- Tests Google Analytics API authentication
- Retrieves basic property information
- Fetches last 7 days of active users and sessions data
- Validates environment configuration

**Run:** `node test-connection.cjs`

**Expected Output:**
```
✅ Connection successful!
📊 Analytics Data (Last 7 Days):
Active Users: 1486
Sessions: 1956
Property ID: 255973574
```

---

#### `debug-auth.cjs`
**Purpose:** Comprehensive authentication debugging  
**What it does:**
- Tests client initialization
- Retrieves property metadata
- Lists available dimensions and metrics
- Performs minimal report request to verify full API access

**Run:** `node debug-auth.cjs`

**Use when:** Authentication issues or API permission problems

---

### 📊 Data Analysis Scripts

#### `channel-breakdown.cjs`
**Purpose:** Analyze traffic channels and sources  
**What it does:**
- Retrieves session data by traffic channel
- Shows breakdown by source and medium
- Focuses on June 2025 data (configurable)
- Useful for understanding traffic distribution

**Run:** `node channel-breakdown.cjs`

**Output:** Channel-wise session counts and sources

---

#### `google-ads-sessions.cjs`
**Purpose:** Google Ads campaign session analysis  
**What it does:**
- Focuses specifically on Google Ads traffic
- Analyzes campaign performance
- Shows session data by campaign and ad group
- Helpful for PPC campaign optimization

**Run:** `node google-ads-sessions.cjs`

**Output:** Google Ads campaign session metrics

---

#### `google-ads-complete.cjs`
**Purpose:** Comprehensive Google Ads performance report  
**What it does:**
- Complete Google Ads campaign analysis
- Includes conversion data, revenue metrics
- Shows detailed campaign breakdowns
- Most comprehensive Google Ads script

**Run:** `node google-ads-complete.cjs`

**Output:** Full Google Ads performance report

---

### 🔍 Advanced Debugging

#### `debug-filter.cjs`
**Purpose:** Test dimension filters and advanced queries  
**What it does:**
- Tests GA4 API filtering capabilities
- Validates dimension filter syntax
- Useful for troubleshooting complex queries
- Helps understand GA4 query limitations

**Run:** `node debug-filter.cjs`

**Use when:** Building complex filtered reports or debugging query issues

---

## Common Usage Patterns

### Quick Health Check
```bash
# Test basic connectivity and auth
node test-connection.cjs

# Verify full API access
node debug-auth.cjs
```

### Campaign Analysis
```bash
# Get traffic breakdown
node channel-breakdown.cjs

# Analyze Google Ads performance
node google-ads-complete.cjs
```

### Development Debugging
```bash
# Test filtering capabilities
node debug-filter.cjs

# Focus on specific data issues
node google-ads-sessions.cjs
```

## Troubleshooting

### Common Issues

**1. Environment Variables Not Found**
```
Error: GA Property ID is required
```
**Solution:** Ensure `.env` file exists in project root with correct values

**2. Authentication Failed**
```
Error: Could not load the default credentials
```
**Solution:** Check `GOOGLE_APPLICATION_CREDENTIALS` path and file permissions

**3. Property Access Denied**
```
Error: User does not have sufficient permissions
```
**Solution:** Verify service account has GA4 property access

**4. Module Resolution Errors**
```
Error: Cannot find module 'dotenv'
```
**Solution:** Run `npm install` from project root

### Script-Specific Notes

- **All scripts use CommonJS** (`.cjs` extension) for compatibility
- **Environment loading** uses `require('dotenv').config({ path: '../.env' })`
- **Date ranges** are often hardcoded - modify as needed for your analysis
- **Rate limits** apply - avoid running multiple scripts simultaneously

## Development

To create new test scripts:
1. Copy an existing script as a template
2. Use `.cjs` extension for CommonJS compatibility  
3. Include dotenv config: `require('dotenv').config({ path: '../.env' })`
4. Add error handling for common issues
5. Document the script's purpose in this README

## Integration

These scripts use the same GA4 client as:
- MCP server (`src/mcp/index.js`)  
- Core module (`src/core/analytics-core.js`)
- Future REST API

All use identical authentication and query patterns for consistency.