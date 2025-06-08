const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from Authorization header (Bearer token)
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded user info (like user id) to req.user
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.status(401).json({ message: 'Invalid token, authorization denied' });
  }
};