function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  
  // If API request, return 401 JSON
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access. Please login as administrator.'
    });
  }

  // Else redirect to admin login page
  return res.redirect('/admin/login');
}

module.exports = {
  requireAdmin
};
