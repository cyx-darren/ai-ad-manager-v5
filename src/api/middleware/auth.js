import { supabase } from '../../db/supabase-client.js';

export const verifySupabaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      error: 'No token provided',
      message: 'Authorization header with Bearer token is required'
    });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Token validation error:', error);
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token validation failed. Please log in again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'No user found for this token. Please log in again.'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Internal authentication error. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};