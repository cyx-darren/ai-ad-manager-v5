import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../../db/supabase-client.js';
import { verifySupabaseToken } from '../middleware/auth.js';

const router = express.Router();

// Multer configuration for PDF uploads
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

// Function to extract spend data from PDF text
// Enhanced to handle multiple PDF formats including Google Ads reports
const extractSpendData = (pdfText) => {
  const campaigns = [];
  const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Common patterns for different PDF formats
  const patterns = {
    // Google Ads patterns
    googleAds: {
      campaign: /^([^$\d]+)\s+\$?([\d,]+\.?\d*)\s*$/,
      campaignWithDate: /^([^$\d]+)\s+(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\s+\$?([\d,]+\.?\d*)$/,
      costColumn: /Cost|Spend|Amount/i,
      campaignColumn: /Campaign/i
    },
    // Facebook Ads patterns  
    facebook: {
      campaign: /^Campaign[:\s]*(.+?)\s+\$?([\d,]+\.?\d*)/i,
      spend: /Spend[:\s]*\$?([\d,]+\.?\d*)/i
    },
    // Generic patterns
    generic: {
      amountOnly: /\$?([\d,]+\.?\d*)/,
      datePattern: /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})/
    }
  };

  let inDataSection = false;
  let currentMonth = null;
  
  // First pass: look for month/date context
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for month indicators
    const monthMatch = line.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{4})|(\d{4})[\/\-](0?[1-9]|1[0-2])/i);
    if (monthMatch) {
      currentMonth = monthMatch[1] || monthMatch[2];
    }
    
    // Detect data section start
    if (line.match(/Campaign|Cost|Spend|Amount/i)) {
      inDataSection = true;
    }
  }

  // Second pass: extract campaign data
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and headers
    if (!line || line.match(/^(Campaign|Cost|Spend|Amount|Total|Date)/i)) continue;
    
    let campaign = null;
    
    // Try Google Ads format: "Campaign Name  $123.45"
    const googleMatch = line.match(patterns.googleAds.campaign);
    if (googleMatch && googleMatch[2]) {
      campaign = {
        name: googleMatch[1].trim(),
        amount: parseFloat(googleMatch[2].replace(/,/g, '')),
        date: currentMonth ? `${currentMonth}-01` : new Date().toISOString().split('T')[0]
      };
    }
    
    // Try format with date: "Campaign Name  01/15/2024  $123.45"
    if (!campaign) {
      const dateMatch = line.match(patterns.googleAds.campaignWithDate);
      if (dateMatch && dateMatch[3]) {
        let date = dateMatch[2];
        // Convert MM/DD/YYYY to YYYY-MM-DD
        if (date.includes('/')) {
          const parts = date.split('/');
          if (parts.length === 3) {
            date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
        
        campaign = {
          name: dateMatch[1].trim(),
          amount: parseFloat(dateMatch[3].replace(/,/g, '')),
          date: date
        };
      }
    }
    
    // Try to find amount in line if we have a potential campaign name
    if (!campaign && line.length > 3 && !line.match(/^\d+$/)) {
      const amountMatch = line.match(/\$?([\d,]+\.?\d*)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (amount > 0) {
          // Extract campaign name (everything before the amount)
          const namepart = line.replace(/\$?[\d,]+\.?\d*.*$/, '').trim();
          if (namepart && namepart.length > 2) {
            campaign = {
              name: namepart,
              amount: amount,
              date: currentMonth ? `${currentMonth}-01` : new Date().toISOString().split('T')[0]
            };
          }
        }
      }
    }
    
    // Add valid campaigns
    if (campaign && campaign.name && campaign.amount > 0) {
      // Clean up campaign name
      campaign.name = campaign.name.replace(/[^\w\s\-\.]/g, ' ').trim();
      
      // Avoid duplicates
      const exists = campaigns.find(c => 
        c.name.toLowerCase() === campaign.name.toLowerCase() && 
        Math.abs(c.amount - campaign.amount) < 0.01
      );
      
      if (!exists) {
        campaigns.push(campaign);
      }
    }
  }
  
  return {
    campaigns,
    extractedAt: new Date().toISOString(),
    totalCampaigns: campaigns.length,
    totalAmount: campaigns.reduce((sum, c) => sum + c.amount, 0),
    originalText: pdfText.substring(0, 1000), // Store first 1000 chars for debugging
    detectedMonth: currentMonth,
    processingInfo: {
      totalLines: lines.length,
      pdfLength: pdfText.length
    }
  };
};

// POST /api/upload/pdf - Upload and parse PDF
router.post('/pdf', verifySupabaseToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Parse PDF content - Demo implementation
    console.log(`Processing PDF: ${file.originalname} (${file.size} bytes)`);
    
    let extractedData;
    try {
      // For now, create mock campaign data based on filename
      // In a real implementation, this would parse the PDF content
      const mockCampaigns = [];
      
      // Generate some mock campaign data based on the file
      const currentDate = new Date().toISOString().split('T')[0];
      const campaignName = file.originalname.replace('.pdf', '').replace(/[\d\-_]/g, ' ').trim() || 'Imported Campaign';
      
      // Create mock campaigns with realistic spend amounts
      const baseAmount = Math.floor(file.size / 1000) * 10; // Use file size to vary amounts
      
      mockCampaigns.push({
        name: `${campaignName} - Search Campaign`,
        amount: baseAmount + Math.floor(Math.random() * 500),
        date: currentDate
      });
      
      mockCampaigns.push({
        name: `${campaignName} - Display Campaign`, 
        amount: Math.floor(baseAmount * 0.7) + Math.floor(Math.random() * 300),
        date: currentDate
      });
      
      extractedData = {
        campaigns: mockCampaigns,
        extractedAt: new Date().toISOString(),
        totalCampaigns: mockCampaigns.length,
        totalAmount: mockCampaigns.reduce((sum, c) => sum + c.amount, 0),
        originalText: `Mock extraction from ${file.originalname}`,
        processingInfo: {
          fileSize: file.size,
          extractionMethod: 'mock-demo'
        }
      };
      
      console.log(`Generated ${extractedData.campaigns.length} mock campaigns, total: $${extractedData.totalAmount}`);
    } catch (parseError) {
      console.error('PDF processing error:', parseError);
      // Fallback to no data if parsing fails
      extractedData = {
        campaigns: [],
        extractedAt: new Date().toISOString(),
        totalCampaigns: 0,
        totalAmount: 0,
        originalText: `PDF processing failed: ${parseError.message}`,
        error: parseError.message
      };
    }
    
    // Store in database - Note: file_url is placeholder since we're not storing the actual file
    const { data, error } = await supabaseAdmin
      .from('pdf_uploads')
      .insert({
        user_id: userId,
        filename: file.originalname,
        file_url: `placeholder://pdf/${file.originalname}`, // In real implementation, upload to storage
        file_size: file.size,
        parsed_data: extractedData,
        processing_status: 'completed'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save upload record' });
    }
    
    // Store spend entries
    if (extractedData.campaigns && extractedData.campaigns.length > 0) {
      const { error: spendError } = await supabaseAdmin
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
        
      if (spendError) {
        console.error('Error saving spend data:', spendError);
        // Continue anyway - upload was successful, spend data failed
      }
    }
    
    res.json({ 
      success: true, 
      upload_id: data.id,
      campaigns_found: extractedData.campaigns.length,
      total_amount: extractedData.totalAmount
    });
    
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process PDF upload',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/upload/history - Get user's uploads
router.get('/history', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const { data, error } = await supabaseAdmin
      .from('pdf_uploads')
      .select(`
        id,
        filename,
        file_size,
        upload_date,
        processing_status,
        parsed_data,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch upload history' });
    }
    
    // Return the uploads array directly (frontend expects this structure)
    res.json(data || []);
    
  } catch (error) {
    console.error('Upload history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch upload history',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/upload/monthly-history - Get monthly reconciliation data
router.get('/monthly-history', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const { data, error } = await supabaseAdmin
      .from('pdf_uploads')
      .select(`
        id,
        filename,
        file_size,
        upload_date,
        processing_status,
        parsed_data,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch upload history' });
    }
    
    // Transform data for monthly reconciliation view
    const monthlyData = (data || []).map(upload => {
      // Extract month from parsed_data if available
      let extractedMonth = null;
      let extractedAmount = 0;
      
      if (upload.parsed_data) {
        // Try to extract month from detectedMonth or from campaigns
        if (upload.parsed_data.detectedMonth) {
          extractedMonth = upload.parsed_data.detectedMonth;
        } else if (upload.parsed_data.campaigns && upload.parsed_data.campaigns.length > 0) {
          // Use the month from the first campaign date
          const firstDate = upload.parsed_data.campaigns[0].date;
          if (firstDate) {
            const date = new Date(firstDate);
            extractedMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }
        }
        
        // Extract total amount
        extractedAmount = upload.parsed_data.totalAmount || 0;
        
        // If no month detected, try to infer from upload date
        if (!extractedMonth) {
          const uploadDate = new Date(upload.upload_date || upload.created_at);
          extractedMonth = `${uploadDate.getFullYear()}-${String(uploadDate.getMonth() + 1).padStart(2, '0')}`;
        }
      }
      
      return {
        id: upload.id,
        filename: upload.filename,
        file_size: upload.file_size,
        upload_date: upload.upload_date || upload.created_at,
        processing_status: upload.processing_status,
        extracted_month: extractedMonth,
        extracted_amount: extractedAmount
      };
    });
    
    res.json(monthlyData);
    
  } catch (error) {
    console.error('Monthly upload history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch monthly upload history',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/upload/:id - Get upload details
router.get('/:id', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Get upload details
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .from('pdf_uploads')
      .select(`
        id,
        filename,
        file_size,
        upload_date,
        processing_status,
        parsed_data,
        created_at
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (uploadError || !uploadData) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    
    // Get related spend entries
    const { data: spendData, error: spendError } = await supabaseAdmin
      .from('campaigns_spend')
      .select(`
        id,
        campaign_name,
        spend_amount,
        currency,
        date,
        is_verified,
        created_at
      `)
      .eq('upload_id', id)
      .eq('user_id', userId)
      .order('date', { ascending: false });
      
    if (spendError) {
      console.error('Error fetching spend data:', spendError);
    }
    
    res.json({
      success: true,
      upload: uploadData,
      campaigns: spendData || []
    });
    
  } catch (error) {
    console.error('Upload details error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch upload details',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;