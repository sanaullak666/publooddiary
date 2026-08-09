function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  
  // If API request, return 401 JSON
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      message: 'Session expired due to inactivity. Please log in again.'
    });
  }

  // Else redirect to admin login page
  return res.redirect('/admin/login?reason=session_expired');
}

module.exports = {
  requireAdmin
};
