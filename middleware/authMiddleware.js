const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from Authorization header in format "Bearer token"
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1].trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user id (or whole decoded payload if preferred)
    req.user = decoded.id || decoded;

    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};