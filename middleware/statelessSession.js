const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || 'pu_blood_directory_nss_secret_key_2026';

function signToken(data) {
  const payloadStr = Buffer.from(JSON.stringify(data)).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64url');
  return `${payloadStr}.${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadStr, hmacStr] = parts;
  try {
    const expectedHmac = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64url');
    if (crypto.timingSafeEqual(Buffer.from(hmacStr), Buffer.from(expectedHmac))) {
      const data = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
      if (data.exp && Date.now() > data.exp) return null;
      return data;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const key = parts.shift().trim();
      if (key) {
        list[key] = decodeURIComponent(parts.join('='));
      }
    });
  }
  return list;
}

function statelessSessionMiddleware(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies.admin_session;
  const sessionData = verifyToken(token) || {};

  req.session = sessionData;

  req.session.destroy = (cb) => {
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    const cookieOptions = [
      'admin_session=',
      'Path=/',
      'HttpOnly',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'SameSite=Lax'
    ];
    if (isProduction) cookieOptions.push('Secure');
    res.setHeader('Set-Cookie', cookieOptions.join('; '));
    req.session = {};
    if (cb) cb();
  };

  const setSessionCookie = () => {
    if (req.session && req.session.admin && !res.headersSent) {
      const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
      const tokenPayload = {
        admin: req.session.admin,
        exp: Date.now() + 24 * 60 * 60 * 1000
      };
      const signed = signToken(tokenPayload);
      const cookieOptions = [
        `admin_session=${encodeURIComponent(signed)}`,
        'Path=/',
        'HttpOnly',
        'Max-Age=86400',
        'SameSite=Lax'
      ];
      if (isProduction) {
        cookieOptions.push('Secure');
      }
      res.setHeader('Set-Cookie', cookieOptions.join('; '));
    }
  };

  const origWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    setSessionCookie();
    return origWriteHead.apply(this, args);
  };

  const origJson = res.json;
  res.json = function (body) {
    setSessionCookie();
    return origJson.call(this, body);
  };

  const origSend = res.send;
  res.send = function (body) {
    setSessionCookie();
    return origSend.call(this, body);
  };

  next();
}

module.exports = {
  signToken,
  verifyToken,
  statelessSessionMiddleware
};
