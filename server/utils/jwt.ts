import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  authMethod: string;
  riskScore: number;
  deviceFingerprint: string;
}

const JWT_SECRET = (() => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret === 'fallback-secret-key-change-in-production') {
    console.error('❌ CRITICAL: SESSION_SECRET environment variable must be set to a secure value');
    console.error('❌ Application will not start with fallback secret for security reasons');
    process.exit(1);
  }
  return secret;
})();
const TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

export class JWTService {
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
      issuer: 'lockmind-auth',
      audience: 'lockmind-app',
      jwtid: payload.sessionId // Include sessionId as jti claim
    });
  }

  static generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'lockmind-auth',
        audience: 'lockmind-app'
      }) as any;
      
      // Extract sessionId from jti claim
      return {
        userId: payload.userId,
        email: payload.email, 
        sessionId: payload.jti || payload.sessionId,
        authMethod: payload.authMethod,
        riskScore: payload.riskScore,
        deviceFingerprint: payload.deviceFingerprint
      };
    } catch (error) {
      return null;
    }
  }

  static generateTokenPair(payload: JWTPayload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken();
    
    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };
  }
}