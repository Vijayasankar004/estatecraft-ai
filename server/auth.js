import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'estatecraft_production_jwt_secret_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Hash a plain text password with salt rounds = 10
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword) return null;
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare plain password with bcrypt hash
 */
export async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate signed JWT token
 */
export function generateToken(userPayload) {
  const payload = {
    id: userPayload.id,
    email: userPayload.email,
    role: userPayload.role || 'buyer',
    name: userPayload.name,
    agency: userPayload.agency
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Express Authentication Middleware
 * Checks Authorization: Bearer <token>
 * Backward compatible with x-agent-id / x-agent-email headers for demo profiles
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }

  // Backward compatible fallback for demo profiles
  const fallbackId = req.headers['x-agent-id'] || req.headers['x-user-id'] || req.body?.agentId;
  const fallbackEmail = req.headers['x-agent-email'] || req.headers['x-user-email'] || req.body?.agentEmail;

  if (fallbackId || fallbackEmail) {
    req.user = {
      id: fallbackId || 'usr_demo',
      email: fallbackEmail || 'demo@estatecraft.in',
      role: req.headers['x-agent-id'] ? 'agent' : 'buyer'
    };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Authentication required. Please provide a valid Bearer token.'
  });
}
