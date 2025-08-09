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
  
  // Look for patterns like: Campaign Name: $123.45 on 2025-08-01
  const lines = pdfText.split('\n');
  
  for (const line of lines) {
    // Basic pattern matching - customize this based on your PDF structure
    const campaignMatch = line.match(/Campaign[:\s]+(.+?)[:\s]+\$(\d+\.?\d*)[:\s]+(\d{4}-\d{2}-\d{2})/i);
    if (campaignMatch) {
      campaigns.push({
        name: campaignMatch[1].trim(),
        amount: parseFloat(campaignMatch[2]),
        date: campaignMatch[3]
      });
    }
  }
  
  return {
    campaigns,
    extractedAt: new Date().toISOString(),
    totalCampaigns: campaigns.length,
    totalAmount: campaigns.reduce((sum, c) => sum + c.amount, 0)
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
    
    // Parse PDF
    const pdfParse = await import('pdf-parse');
    const pdfData = await pdfParse.default(file.buffer);
    
    // Extract spend data (customize based on your PDF format)
    const extractedData = extractSpendData(pdfData.text);
    
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
    
    res.json({
      success: true,
      uploads: data || [],
      count: data ? data.length : 0
    });
    
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