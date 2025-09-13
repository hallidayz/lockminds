import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

interface MFAApprovalToken {
  challengeCode: string;
  userId: string;
  deviceFingerprint: string;
  timestamp: number;
  nonce: string;
}

export class MFASecurityService {
  private static readonly HMAC_SECRET = (() => {
    const secret = process.env.MFA_HMAC_SECRET || process.env.SESSION_SECRET;
    if (!secret || secret === 'fallback-secret-key-change-in-production') {
      console.error('❌ CRITICAL: MFA_HMAC_SECRET or SESSION_SECRET must be set');
      process.exit(1);
    }
    return secret;
  })();
  
  private static readonly TOKEN_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a secure approval token that must be included with MFA approval requests
   */
  static generateApprovalToken(
    challengeCode: string,
    userId: string,
    deviceFingerprint: string
  ): string {
    const timestamp = Date.now();
    const nonce = randomBytes(16).toString('hex');
    
    const payload: MFAApprovalToken = {
      challengeCode,
      userId,
      deviceFingerprint,
      timestamp,
      nonce
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = this.generateHMAC(payloadString);
    
    // Combine payload and signature
    const token = Buffer.from(payloadString).toString('base64') + '.' + signature;
    return token;
  }
  
  /**
   * Verify an approval token and extract its payload
   */
  static verifyApprovalToken(
    token: string,
    expectedChallengeCode: string,
    expectedUserId: string
  ): { valid: boolean; payload?: MFAApprovalToken; error?: string } {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) {
        return { valid: false, error: 'Invalid token format' };
      }
      
      const [encodedPayload, signature] = parts;
      const payloadString = Buffer.from(encodedPayload, 'base64').toString('utf-8');
      
      // Verify HMAC signature
      const expectedSignature = this.generateHMAC(payloadString);
      if (!this.constantTimeCompare(signature, expectedSignature)) {
        return { valid: false, error: 'Invalid signature' };
      }
      
      const payload: MFAApprovalToken = JSON.parse(payloadString);
      
      // Verify timestamp (token expiry)
      const now = Date.now();
      if (now - payload.timestamp > this.TOKEN_VALIDITY_MS) {
        return { valid: false, error: 'Token expired' };
      }
      
      // Verify challenge code and user ID
      if (payload.challengeCode !== expectedChallengeCode) {
        return { valid: false, error: 'Challenge code mismatch' };
      }
      
      if (payload.userId !== expectedUserId) {
        return { valid: false, error: 'User ID mismatch' };
      }
      
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Token parsing failed' };
    }
  }
  
  /**
   * Generate approval challenge for mobile apps
   * This creates a secure challenge that mobile apps must solve to approve MFA
   */
  static generateApprovalChallenge(
    challengeCode: string,
    userId: string
  ): { challenge: string; solution: string } {
    const timestamp = Date.now();
    const nonce = randomBytes(8).toString('hex');
    
    // Challenge includes timestamp and nonce
    const challengeData = `${challengeCode}:${userId}:${timestamp}:${nonce}`;
    const challenge = Buffer.from(challengeData).toString('base64');
    
    // Solution is HMAC of the challenge
    const solution = this.generateHMAC(challengeData);
    
    return { challenge, solution };
  }
  
  /**
   * Verify approval challenge solution
   */
  static verifyApprovalChallenge(
    challenge: string,
    solution: string,
    maxAge: number = 300000 // 5 minutes
  ): { valid: boolean; challengeCode?: string; userId?: string; error?: string } {
    try {
      const challengeData = Buffer.from(challenge, 'base64').toString('utf-8');
      const parts = challengeData.split(':');
      
      if (parts.length !== 4) {
        return { valid: false, error: 'Invalid challenge format' };
      }
      
      const [challengeCode, userId, timestampStr, nonce] = parts;
      const timestamp = parseInt(timestampStr, 10);
      
      // Check timestamp
      const now = Date.now();
      if (now - timestamp > maxAge) {
        return { valid: false, error: 'Challenge expired' };
      }
      
      // Verify solution
      const expectedSolution = this.generateHMAC(challengeData);
      if (!this.constantTimeCompare(solution, expectedSolution)) {
        return { valid: false, error: 'Invalid solution' };
      }
      
      return { valid: true, challengeCode, userId };
    } catch (error) {
      return { valid: false, error: 'Challenge verification failed' };
    }
  }
  
  private static generateHMAC(data: string): string {
    return createHmac('sha256', this.HMAC_SECRET)
      .update(data)
      .digest('hex');
  }
  
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    
    return timingSafeEqual(bufA, bufB);
  }
}