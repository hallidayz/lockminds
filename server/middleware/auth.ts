import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../utils/jwt';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    sessionId: string;
    authMethod: string;
    riskScore: number;
    deviceFingerprint: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING' 
    });
  }

  try {
    const payload = JWTService.verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID' 
      });
    }

    // Verify session is still active using sessionId from JWT
    const session = await storage.getAuthSessionBySessionId(payload.sessionId);
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return res.status(401).json({ 
        error: 'Session expired or inactive',
        code: 'SESSION_EXPIRED' 
      });
    }

    // Additional security: Verify session belongs to the same user
    if (session.userId !== payload.userId) {
      return res.status(401).json({ 
        error: 'Session/token mismatch',
        code: 'SESSION_MISMATCH' 
      });
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId,
      authMethod: payload.authMethod,
      riskScore: payload.riskScore,
      deviceFingerprint: payload.deviceFingerprint
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      error: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED' 
    });
  }
};

export const requireLowRisk = (maxRiskScore: number = 40) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      });
    }

    if (req.user.riskScore > maxRiskScore) {
      return res.status(403).json({ 
        error: 'Additional authentication required due to elevated risk',
        code: 'HIGH_RISK_DETECTED',
        riskScore: req.user.riskScore,
        requiresMfa: true
      });
    }

    next();
  };
};

export const requireStrongAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED' 
    });
  }

  const strongAuthMethods = ['webauthn', 'biometric'];
  if (!strongAuthMethods.includes(req.user.authMethod)) {
    return res.status(403).json({ 
      error: 'Strong authentication required (WebAuthn/Biometric)',
      code: 'STRONG_AUTH_REQUIRED',
      allowedMethods: strongAuthMethods
    });
  }

  next();
};