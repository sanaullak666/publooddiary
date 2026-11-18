function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  
  // If API request, return 404 JSON to mask admin endpoints
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Not Found'
    });
  }

  // If unauthenticated browser request, redirect to 404 Not Found page
  return res.redirect('/404');
}

module.exports = {
  requireAdmin
};
