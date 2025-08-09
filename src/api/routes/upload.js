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
// This is a basic implementation - customize based on your PDF format
const extractSpendData = (pdfText) => {
  // Simple extraction logic - this should be customized based on actual PDF format
  const campaigns = [];
  const lines = pdfText.split('\n');
  
  let currentCampaign = null;
  
  for (const line of lines) {
    // Look for campaign names
    const campaignMatch = line.match(/Campaign[:\s]*["']?([^"'\n\r]+)["']?$/i);
    if (campaignMatch) {
      currentCampaign = {
        name: campaignMatch[1].trim().replace(/['"]/g, ''),
        amount: 0,
        date: null
      };
      continue;
    }
    
    // Look for date lines
    if (currentCampaign && line.match(/Date[:\s]*(\d{4}-\d{2}-\d{2})/i)) {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        currentCampaign.date = dateMatch[1];
      }
      continue;
    }
    
    // Look for spend amounts
    if (currentCampaign && line.match(/Spend[:\s]*\$?([\d,]+\.?\d*)/i)) {
      const spendMatch = line.match(/\$?([\d,]+\.?\d*)/);
      if (spendMatch) {
        currentCampaign.amount = parseFloat(spendMatch[1].replace(/,/g, ''));
        // If we have name, date, and amount, save the campaign
        if (currentCampaign.name && currentCampaign.date) {
          campaigns.push({...currentCampaign});
        }
        currentCampaign = null;
      }
    }
    
    // Alternative pattern: Line contains all info
    const fullMatch = line.match(/Campaign[:\s]*["']?([^"']+)["']?.*?(\d{4}-\d{2}-\d{2}).*?\$?([\d,]+\.?\d*)/i);
    if (fullMatch) {
      campaigns.push({
        name: fullMatch[1].trim().replace(/['"]/g, ''),
        amount: parseFloat(fullMatch[3].replace(/,/g, '')),
        date: fullMatch[2]
      });
    }
  }
  
  return {
    campaigns,
    extractedAt: new Date().toISOString(),
    totalCampaigns: campaigns.length,
    totalAmount: campaigns.reduce((sum, c) => sum + c.amount, 0),
    originalText: pdfText.substring(0, 500) // Store first 500 chars for debugging
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
    
    // For MVP, we'll store the PDF without parsing the contents
    // In a real implementation, you would parse the PDF here
    const extractedData = {
      campaigns: [],
      extractedAt: new Date().toISOString(),
      totalCampaigns: 0,
      totalAmount: 0,
      originalText: "PDF parsing will be implemented in future version"
    };
    
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