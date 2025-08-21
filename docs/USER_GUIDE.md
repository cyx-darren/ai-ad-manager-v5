# Analytics Dashboard User Guide

Welcome to the Google Analytics Dashboard! This guide will help you get started and make the most of your advertising analytics.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Uploading PDF Bills](#uploading-pdf-bills)
4. [Understanding Metrics](#understanding-metrics)
5. [Using Date Ranges](#using-date-ranges)
6. [Data Sources](#data-sources)
7. [Troubleshooting](#troubleshooting)
8. [FAQs](#faqs)
9. [Support](#support)

## Getting Started

### Creating an Account
1. Navigate to your dashboard URL (http://localhost:3000 for development)
2. Click **"Sign Up"** in the top-right corner
3. Enter your email address and create a secure password
4. Click **"Create Account"**
5. You'll be automatically logged in and redirected to the dashboard

### First Login
After logging in, you'll see the main dashboard featuring:
- **8 Metric Cards** showing key performance indicators
- **4 Interactive Charts** with traffic and campaign breakdowns
- **Date Range Selector** in the top-right corner
- **Refresh Button** to manually update data
- **Navigation Menu** for accessing different features

### Quick Navigation
- **Dashboard**: Main analytics overview
- **API Documentation**: Technical API reference at `/api-docs`
- **Settings**: Account and preferences (coming soon)
- **Logout**: Securely end your session

## Dashboard Overview

### Metric Cards
The dashboard displays 8 essential metrics in colorful cards:

#### 📊 **Total Campaigns**
- **What it shows**: Number of active advertising campaigns
- **Data source**: Google Analytics 4
- **Updates**: Every 5 minutes

#### 👁️ **Total Impressions** 
- **What it shows**: Total ad views across all campaigns
- **Data source**: Google Ads API (with mock data fallback)
- **Badge indicator**: Green for live data, orange for mock data

#### 🖱️ **Click Rate**
- **What it shows**: Percentage of impressions that resulted in clicks
- **Formula**: (Clicks ÷ Impressions) × 100
- **Data source**: Google Ads API (with mock data fallback)

#### 🎯 **Total Sessions**
- **What it shows**: Website visits from paid advertising channels
- **Data source**: Google Analytics 4
- **Includes**: Paid Search, Display, Social, Video traffic

#### 👥 **Total Users**
- **What it shows**: Unique visitors from paid advertising
- **Data source**: Google Analytics 4
- **Note**: Users may have multiple sessions

#### 📈 **Average Bounce Rate**
- **What it shows**: Percentage of single-page sessions
- **Formula**: Single-page sessions ÷ Total sessions
- **Lower is better**: Indicates engaged visitors

#### 🎯 **Conversions**
- **What it shows**: Completed goal actions (purchases, sign-ups, etc.)
- **Data source**: Google Analytics 4 goals/events
- **Setup required**: Goals must be configured in GA4

#### 💰 **Total Spend**
- **What it shows**: Your total advertising expenditure
- **Data sources**: 
  - PDF uploads (primary)
  - Google Ads API (secondary)
- **Currency**: USD (automatically converted if needed)

### Data Source Indicators
Each metric card shows its data source with colored badges:
- 🟢 **Live Data**: Real-time from APIs (updates every 5 minutes)
- 📄 **PDF Data**: From uploaded billing statements (user-specific)
- 🔄 **Mock Data**: Sample data when live sources unavailable

### Interactive Charts

#### 1. Traffic Sources Distribution
- **Type**: Donut chart
- **Shows**: Where your paid traffic originates
- **Categories**: Paid Search, Display, Paid Social, Paid Video
- **Interaction**: Hover for detailed tooltips

#### 2. Device Breakdown  
- **Type**: Donut chart
- **Shows**: User device preferences
- **Categories**: Desktop, Mobile, Tablet
- **Data**: Both sessions and unique users

#### 3. Geographic Distribution
- **Type**: Donut chart  
- **Shows**: User locations by country/region
- **Data**: Based on user IP addresses
- **Updates**: Real-time with traffic changes

#### 4. Campaign Performance
- **Type**: Donut chart
- **Shows**: Individual campaign spending and performance
- **Data**: Combines PDF uploads with API data
- **Sorting**: By total spend (highest first)

## Uploading PDF Bills

### Why Upload PDFs?
PDF billing statements provide the most accurate spending data, overriding API estimates and ensuring your dashboard reflects actual charges.

### Supported File Types
- **Google Ads** billing statements (.pdf)
- **Facebook Ads** invoices (.pdf) 
- **Microsoft Ads** billing reports (.pdf)
- **Other platforms** with standard invoice formats

### How to Upload

1. **Access Upload**
   - Click **"Upload PDF"** button in the top navigation
   - Or visit `/upload` directly

2. **Select File**
   - Click the upload area or drag & drop your PDF
   - Maximum file size: 10MB
   - Only PDF format accepted

3. **Processing**
   - File uploads automatically
   - Processing typically takes 5-10 seconds
   - Progress indicator shows upload status

4. **Review Data**
   - Parsed campaigns and spending amounts display
   - Verify accuracy against your original bill
   - Edit any incorrect values if needed

5. **Save**
   - Click **"Confirm"** to save the data
   - Data immediately appears in your dashboard
   - Original PDF is securely stored for reference

### Tips for Better Parsing
- ✅ **Use text-based PDFs** (not scanned images)
- ✅ **Upload complete bills** with all pages
- ✅ **Check currency settings** match your account
- ✅ **Verify campaign names** are recognizable
- ❌ **Avoid password-protected PDFs**
- ❌ **Don't upload incomplete statements**

### Upload History
- View all uploaded files in **Upload History**
- Re-process failed uploads
- Download original PDFs for reference
- Delete outdated files to save space

## Understanding Metrics

### Traffic Sources Explained

#### **Paid Search**
- Google Ads search campaigns
- Microsoft Ads (Bing) search
- Text ads on search results pages
- **High intent** traffic with specific search queries

#### **Display**  
- Banner ads on websites
- Google Display Network
- Remarketing campaigns
- **Visual appeal** with broader reach

#### **Paid Social**
- Facebook & Instagram ads
- LinkedIn sponsored posts  
- Twitter promoted tweets
- **Social engagement** and brand awareness

#### **Paid Video**
- YouTube advertising
- Video ads on social platforms
- **Engaging content** with storytelling

### Device Performance

#### **Desktop** 💻
- Traditional computer users
- Often highest conversion rates
- Better for complex purchases
- Longer session durations

#### **Mobile** 📱  
- Smartphone and tablet users
- Growing share of traffic
- Quick, impulse decisions
- Location-based targeting opportunities

#### **Tablet** 🖥️
- Between mobile and desktop behavior  
- Good for browsing and research
- Moderate conversion rates

### Campaign Performance Metrics

#### **Spend per Campaign**
- Total cost for each campaign
- Includes all ad formats and placements
- Excludes taxes and fees (shown separately)

#### **Click-Through Rate (CTR)**  
- Percentage of impressions that generated clicks
- **Industry average**: 2-5% for most platforms
- Higher CTR = more relevant ads

#### **Cost per Click (CPC)**
- Average amount paid per click
- Varies by industry and competition
- Lower CPC = more efficient spending

#### **Conversion Rate**
- Percentage of clicks that completed goals
- **Industry average**: 1-4% for most industries  
- Higher conversion rate = better landing pages

## Using Date Ranges

### Quick Date Selectors
The date picker offers common ranges for fast analysis:

- **Last 7 days**: Recent performance trends
- **Last 30 days**: Monthly performance overview  
- **Last 90 days**: Quarterly trends and seasonality
- **This month**: Current month progress
- **Last month**: Previous month performance
- **Year to date**: Annual progress tracking

### Custom Date Ranges
1. Click **"Custom Range"** in the date picker
2. Select your **start date** using the calendar
3. Select your **end date** using the calendar  
4. Click **"Apply"** to update all data
5. Maximum range: 1 year of historical data

### Data Refresh Behavior
- **Automatic refresh**: Every 5 minutes for live data
- **Manual refresh**: Click the 🔄 refresh button anytime
- **Last updated**: Timestamp shown in dashboard header
- **Date range changes**: Trigger immediate data refresh

### Best Practices
- 📊 **Compare periods**: Use consistent date ranges for analysis
- 📈 **Seasonal trends**: Look at month-over-month changes
- ⚡ **Recent changes**: Use shorter ranges for immediate insights
- 📅 **Historical context**: Longer ranges show overall trends

## Data Sources

### Data Priority Hierarchy
The dashboard intelligently combines data from multiple sources:

1. **PDF Uploads** (Highest priority)
   - User-uploaded billing statements
   - Most accurate spending data
   - Overrides API estimates
   - User-specific and private

2. **Google Ads API** (Secondary)
   - Real-time campaign metrics
   - Impressions, clicks, conversions
   - Automatic updates every 5 minutes
   - Shared configuration (MVP)

3. **Google Analytics 4** (Real-time web data)
   - Website traffic from paid channels
   - User behavior and conversions
   - Session and user metrics
   - Geographic and device data

4. **Cache Layer** (Performance)
   - Recently fetched API data
   - 1-hour cache duration
   - Faster response times
   - Backup when APIs temporarily fail

5. **Mock Data** (Fallback only)
   - Sample data when APIs unavailable
   - Clearly labeled with orange badges
   - Helps demonstrate interface
   - **Not used for real decisions**

### Understanding Data Discrepancies

#### **PDF vs. API Differences**
- **PDF data**: Final billed amounts including taxes, adjustments
- **API data**: Real-time estimates, may exclude final charges
- **Resolution**: PDF data takes priority for spending totals

#### **Timing Differences**  
- **Real-time APIs**: Include today's partial data
- **PDF bills**: Complete monthly or weekly summaries
- **Resolution**: Use consistent date ranges for comparisons

#### **Currency Conversions**
- **APIs**: May report in original currency
- **Dashboard**: Automatically converts to USD
- **PDF**: Respects original bill currency, then converts

### Data Refresh Schedule
- **Live APIs**: Every 5 minutes
- **Cache refresh**: Every hour
- **PDF processing**: Immediate upon upload
- **Historical data**: 24-hour retention for trends

## Troubleshooting

### Common Issues and Solutions

#### 🚨 Dashboard Not Loading
**Symptoms**: Blank page, loading spinner doesn't disappear

**Solutions**:
1. **Check internet connection**: Ensure stable connectivity
2. **Clear browser cache**: Ctrl+Shift+R (PC) or Cmd+Shift+R (Mac)
3. **Try different browser**: Test in Chrome, Firefox, or Safari
4. **Disable browser extensions**: Ad blockers may interfere
5. **Log out and back in**: Refresh authentication tokens

#### 📄 PDF Upload Fails
**Symptoms**: "Upload failed" message, file not processing

**Solutions**:
1. **Check file size**: Must be under 10MB
2. **Verify PDF format**: Only .pdf files accepted
3. **Remove password protection**: Unprotect file before upload
4. **Try different PDF**: Test with a simple, text-based PDF
5. **Check file integrity**: Re-download from original source
6. **Contact support**: If problem persists

#### 🔄 Data Not Updating  
**Symptoms**: Old data showing, refresh doesn't work

**Solutions**:
1. **Verify date range**: Ensure dates include recent activity
2. **Manual refresh**: Click the refresh button
3. **Clear cache**: Browser cache may be stale
4. **Check API status**: Temporary service disruptions possible
5. **Wait 5-10 minutes**: Automatic refresh may resolve issue

#### 📊 Incorrect Metrics
**Symptoms**: Numbers don't match expectations or other tools

**Solutions**:
1. **Review data sources**: Check which data is from PDF vs. API
2. **Verify date ranges**: Ensure consistent time periods
3. **Check currency**: Conversion rates may affect totals
4. **Compare methodologies**: Different tools may calculate differently
5. **Upload recent PDFs**: Override API estimates with actual bills

#### 🔐 Login Issues  
**Symptoms**: Cannot access account, authentication errors

**Solutions**:
1. **Reset password**: Use "Forgot Password" link
2. **Check email verification**: Verify account if required
3. **Clear cookies**: Remove old session data
4. **Try incognito mode**: Test without browser extensions
5. **Contact support**: For persistent access issues

### Performance Issues

#### ⏱️ Slow Loading Times
**Possible causes**:
- Large date ranges (>90 days)
- Multiple API calls timing out
- Network connectivity issues
- Server maintenance

**Solutions**:
- Use smaller date ranges initially
- Check internet speed
- Try during off-peak hours
- Contact support if persistent

#### 📱 Mobile Display Issues
**Mobile-specific solutions**:
- Rotate device for better chart viewing
- Use two-finger zoom for detailed data
- Switch to desktop for complex analysis
- Update mobile browser to latest version

## FAQs

### General Questions

**Q: How often is data updated?**
A: Live data refreshes every 5 minutes automatically. PDF data updates immediately upon upload. You can also manually refresh anytime using the refresh button.

**Q: Can I export data from the dashboard?**
A: Export functionality is coming in a future update. Currently, you can take screenshots or copy individual values. For raw data, use the API endpoints documented at `/api-docs`.

**Q: Why do I see mock data instead of real numbers?**
A: Mock data appears when live APIs are temporarily unavailable or during initial setup. It's clearly labeled with orange "Mock Data" badges. This ensures the dashboard remains functional even during API outages.

**Q: How do I connect my Google Ads account?**
A: Google Ads integration is configured at the system level by your administrator. Contact support for setup assistance or to troubleshoot connection issues.

**Q: Can multiple team members access the same account?**
A: Currently, each user has their own account with private PDF upload data. Google Analytics data is shared across all users in the MVP version. Team management features are planned for future releases.

### Data and Privacy

**Q: Is my data secure and private?**
A: Yes! We use industry-standard security measures:
- All data encrypted in transit and at rest
- Row-level security ensures user data isolation
- PDF files stored securely with access controls
- Regular security audits and monitoring
- Supabase handles authentication with enterprise-grade security

**Q: How long is my data stored?**
A: 
- **Dashboard metrics**: 90 days of historical data
- **PDF files**: Stored indefinitely until manually deleted
- **Cache data**: 1 hour automatic expiration
- **User accounts**: Active until account deletion

**Q: Can I delete my uploaded PDFs?**  
A: Yes, you can delete uploaded PDF files from the Upload History page. This removes both the file and associated spending data from your dashboard.

### Technical Questions

**Q: What browsers are supported?**
A: The dashboard works best with modern browsers:
- ✅ **Chrome** 90+ (Recommended)
- ✅ **Firefox** 88+
- ✅ **Safari** 14+
- ✅ **Edge** 90+
- ❌ Internet Explorer (not supported)

**Q: Does the dashboard work on mobile devices?**
A: Yes! The dashboard is fully responsive and optimized for:
- 📱 **Smartphones** (375px+)
- 🖥️ **Tablets** (768px+)
- 💻 **Laptops** (1024px+)
- 🖥️ **Desktops** (1440px+)

**Q: What PDF formats are supported for upload?**
A: We support standard PDF invoices from major advertising platforms:
- Google Ads billing statements
- Facebook Ads invoices
- Microsoft Advertising reports
- Any PDF with tabular spending data
- Text must be selectable (not scanned images)

**Q: How accurate is the spending data?**
A: Accuracy depends on data source:
- **PDF uploads**: 100% accurate (actual billed amounts)
- **Google Ads API**: ~95% accurate (real-time estimates)
- **Mock data**: For demonstration only, clearly labeled

**Q: Can I integrate this with other tools?**
A: Yes! We provide a comprehensive API:
- RESTful endpoints for all dashboard data
- JWT authentication via Supabase
- Interactive documentation at `/api-docs`
- Rate limiting: 100 requests/15 minutes
- Support for webhooks (coming soon)

### Billing and Costs

**Q: What does this dashboard cost to use?**
A: Pricing depends on your deployment model. Contact your administrator or our sales team for pricing information.

**Q: Are there usage limits?**
A: Current limits per user:
- **PDF uploads**: 10MB per file, 100 files per month
- **API calls**: 100 requests per 15-minute window
- **Data retention**: 90 days of historical metrics
- **Concurrent sessions**: 5 active sessions per user

## Support

### Getting Help

#### 📧 **Email Support**
- **Address**: support@your-domain.com  
- **Response time**: 24-48 hours
- **Best for**: Account issues, technical problems, feature requests

#### 📚 **Documentation**
- **User Guide**: This document
- **API Documentation**: `/api-docs` (interactive)
- **Technical specs**: Available on request

#### 🎥 **Video Tutorials** (Coming Soon)
- Dashboard overview walkthrough
- PDF upload best practices  
- Advanced analytics techniques
- Troubleshooting common issues

#### 💬 **Community** (Coming Soon)
- User forum for tips and tricks
- Feature requests and voting
- Community-contributed guides

### Before Contacting Support

Please gather this information to help us assist you faster:

1. **Browser and version** (found in browser settings)
2. **Operating system** (Windows, Mac, mobile)
3. **Screenshot** of any error messages
4. **Steps to reproduce** the issue
5. **Date and time** when problem occurred
6. **Your user email** (for account-specific issues)

### Feature Requests

We welcome suggestions for new features! Please include:
- **Use case**: What problem would this solve?
- **Expected behavior**: How should it work?
- **Priority**: How important is this to your workflow?
- **Alternatives**: What workarounds are you currently using?

Submit requests to support@your-domain.com with "Feature Request" in the subject line.

---

## Quick Reference Card

### Essential Shortcuts
- **Refresh data**: Click 🔄 button or wait 5 minutes
- **Change dates**: Click date picker in top-right
- **Upload PDF**: Click "Upload PDF" in navigation
- **Get help**: Look for ❓ icons throughout the interface
- **Access API docs**: Visit `/api-docs`

### Data Source Badges
- 🟢 **Live**: Real-time API data
- 📄 **PDF**: From uploaded files  
- 🔄 **Mock**: Sample data (ignore for decisions)
- ⚡ **Cached**: Recently fetched data

### Metric Explanations
- **Campaigns**: Active advertising campaigns
- **Impressions**: Ad views/displays
- **Click Rate**: Impressions → Clicks percentage
- **Sessions**: Website visits from ads
- **Users**: Unique visitors from ads
- **Bounce Rate**: Single-page visit percentage
- **Conversions**: Completed goals/purchases
- **Spend**: Total advertising costs

*Last updated: August 2025 | Version 1.0*