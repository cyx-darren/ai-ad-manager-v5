import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const HelpButton = ({ topic = 'general' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const helpTopics = {
    general: {
      title: 'Dashboard Help',
      content: `
        <h3>Welcome to the Analytics Dashboard!</h3>
        <p>This dashboard provides comprehensive insights into your advertising performance across Google Ads and Google Analytics.</p>
        
        <h4>Key Features:</h4>
        <ul>
          <li><strong>Real-time Metrics:</strong> View 8 key performance indicators updated every 5 minutes</li>
          <li><strong>Interactive Charts:</strong> Explore traffic sources, device breakdown, and campaign performance</li>
          <li><strong>PDF Upload:</strong> Upload advertising bills for accurate spending data</li>
          <li><strong>Date Range Selection:</strong> Analyze performance across custom time periods</li>
        </ul>
        
        <h4>Getting Started:</h4>
        <ol>
          <li>Use the date picker to select your analysis period</li>
          <li>Review the 8 metric cards for key insights</li>
          <li>Explore the 4 interactive charts for detailed breakdowns</li>
          <li>Upload PDF bills for accurate spending data</li>
        </ol>
        
        <p>Need more help? Check out our <a href="/USER_GUIDE.md" target="_blank">complete user guide</a>.</p>
      `
    },
    metrics: {
      title: 'Understanding Metrics',
      content: `
        <h3>Dashboard Metrics Explained</h3>
        
        <h4>📊 Total Campaigns</h4>
        <p>Number of active advertising campaigns from Google Analytics 4. Updates every 5 minutes.</p>
        
        <h4>👁️ Total Impressions</h4>
        <p>Total ad views across all campaigns. Data from Google Ads API with mock data fallback indicated by badges.</p>
        
        <h4>🖱️ Click Rate</h4>
        <p>Percentage of impressions that resulted in clicks. Formula: (Clicks ÷ Impressions) × 100</p>
        
        <h4>🎯 Total Sessions</h4>
        <p>Website visits from paid advertising channels including Paid Search, Display, Social, and Video traffic.</p>
        
        <h4>👥 Total Users</h4>
        <p>Unique visitors from paid advertising. Note that users may have multiple sessions.</p>
        
        <h4>📈 Average Bounce Rate</h4>
        <p>Percentage of single-page sessions. Lower is better and indicates more engaged visitors.</p>
        
        <h4>🎯 Conversions</h4>
        <p>Completed goal actions (purchases, sign-ups, etc.) from Google Analytics 4 goals/events.</p>
        
        <h4>💰 Total Spend</h4>
        <p>Your total advertising expenditure from PDF uploads (primary) and Google Ads API (secondary), automatically converted to USD.</p>
      `
    },
    upload: {
      title: 'PDF Upload Help',
      content: `
        <h3>Uploading PDF Bills</h3>
        
        <h4>Why Upload PDFs?</h4>
        <p>PDF billing statements provide the most accurate spending data, overriding API estimates and ensuring your dashboard reflects actual charges.</p>
        
        <h4>Supported File Types</h4>
        <ul>
          <li>Google Ads billing statements (.pdf)</li>
          <li>Facebook Ads invoices (.pdf)</li>
          <li>Microsoft Ads billing reports (.pdf)</li>
          <li>Other platforms with standard invoice formats</li>
        </ul>
        
        <h4>How to Upload</h4>
        <ol>
          <li>Click the upload area or drag & drop your PDF</li>
          <li>Maximum file size: 10MB, only PDF format accepted</li>
          <li>File uploads automatically and processes in 5-10 seconds</li>
          <li>Review parsed campaigns and spending amounts</li>
          <li>Edit any incorrect values if needed</li>
          <li>Click "Confirm" to save the data</li>
        </ol>
        
        <h4>Tips for Better Parsing</h4>
        <ul>
          <li>✅ Use text-based PDFs (not scanned images)</li>
          <li>✅ Upload complete bills with all pages</li>
          <li>✅ Check currency settings match your account</li>
          <li>✅ Verify campaign names are recognizable</li>
          <li>❌ Avoid password-protected PDFs</li>
          <li>❌ Don't upload incomplete statements</li>
        </ul>
      `
    },
    charts: {
      title: 'Interactive Charts Guide',
      content: `
        <h3>Understanding Your Charts</h3>
        
        <h4>1. Traffic Sources Distribution</h4>
        <p><strong>Type:</strong> Donut chart showing where your paid traffic originates</p>
        <ul>
          <li><strong>Paid Search:</strong> Google Ads search campaigns, high intent traffic</li>
          <li><strong>Display:</strong> Banner ads on websites, visual appeal with broader reach</li>
          <li><strong>Paid Social:</strong> Facebook & Instagram ads, social engagement and brand awareness</li>
          <li><strong>Paid Video:</strong> YouTube advertising, engaging content with storytelling</li>
        </ul>
        
        <h4>2. Device Breakdown</h4>
        <p><strong>Type:</strong> Donut chart showing user device preferences</p>
        <ul>
          <li><strong>Desktop:</strong> Often highest conversion rates, better for complex purchases</li>
          <li><strong>Mobile:</strong> Growing share of traffic, quick impulse decisions</li>
          <li><strong>Tablet:</strong> Between mobile and desktop behavior, good for browsing</li>
        </ul>
        
        <h4>3. Geographic Distribution</h4>
        <p><strong>Type:</strong> Donut chart showing user locations by country/region based on IP addresses</p>
        
        <h4>4. Campaign Performance</h4>
        <p><strong>Type:</strong> Donut chart showing individual campaign spending and performance, sorted by total spend</p>
        
        <h4>Chart Interactions</h4>
        <ul>
          <li>Hover over segments for detailed tooltips</li>
          <li>Data updates in real-time with traffic changes</li>
          <li>Combines PDF uploads with API data for accuracy</li>
        </ul>
      `
    },
    troubleshooting: {
      title: 'Troubleshooting',
      content: `
        <h3>Common Issues and Solutions</h3>
        
        <h4>🚨 Dashboard Not Loading</h4>
        <p><strong>Solutions:</strong></p>
        <ol>
          <li>Check internet connection</li>
          <li>Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)</li>
          <li>Try different browser (Chrome, Firefox, or Safari)</li>
          <li>Disable browser extensions that might interfere</li>
          <li>Log out and back in to refresh authentication</li>
        </ol>
        
        <h4>📄 PDF Upload Fails</h4>
        <p><strong>Solutions:</strong></p>
        <ol>
          <li>Check file size (must be under 10MB)</li>
          <li>Verify PDF format (only .pdf files accepted)</li>
          <li>Remove password protection</li>
          <li>Try different PDF or re-download from original source</li>
          <li>Contact support if problem persists</li>
        </ol>
        
        <h4>🔄 Data Not Updating</h4>
        <p><strong>Solutions:</strong></p>
        <ol>
          <li>Verify date range includes recent activity</li>
          <li>Click the manual refresh button</li>
          <li>Clear browser cache</li>
          <li>Check API status (temporary disruptions possible)</li>
          <li>Wait 5-10 minutes for automatic refresh</li>
        </ol>
        
        <h4>📊 Incorrect Metrics</h4>
        <p><strong>Solutions:</strong></p>
        <ol>
          <li>Review data sources (PDF vs. API badges)</li>
          <li>Verify date ranges are consistent</li>
          <li>Check currency conversion rates</li>
          <li>Compare methodologies with other tools</li>
          <li>Upload recent PDFs to override API estimates</li>
        </ol>
        
        <h4>Need More Help?</h4>
        <p>Contact support at support@your-domain.com or check our <a href="/USER_GUIDE.md" target="_blank">complete user guide</a>.</p>
      `
    }
  };

  const loadHelpContent = async (topic) => {
    setLoading(true);
    try {
      // For now, use the built-in content
      // In the future, this could fetch from /api/help/${topic}
      const helpData = helpTopics[topic] || helpTopics.general;
      setContent(helpData);
    } catch (error) {
      console.error('Failed to load help content:', error);
      setContent({
        title: 'Help Unavailable',
        content: '<p>Sorry, help content is temporarily unavailable. Please try again later.</p>'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!content) {
      loadHelpContent(topic);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Help Button */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
        title="Get help with this section"
        aria-label="Get help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {content?.title || 'Help'}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close help"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading help content...</span>
                </div>
              ) : content ? (
                <div 
                  className="prose prose-sm max-w-none help-content"
                  dangerouslySetInnerHTML={{ __html: content.content }}
                />
              ) : (
                <p className="text-gray-500">Help content not available.</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom styles for help content */}
      <style jsx>{`
        .help-content h3 {
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          margin-top: 1.5rem;
        }
        .help-content h3:first-child {
          margin-top: 0;
        }
        .help-content h4 {
          color: #374151;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          margin-top: 1.25rem;
        }
        .help-content p {
          color: #6b7280;
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        .help-content ul, .help-content ol {
          color: #6b7280;
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .help-content li {
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }
        .help-content strong {
          color: #374151;
          font-weight: 600;
        }
        .help-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .help-content a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </>
  );
};

export default HelpButton;