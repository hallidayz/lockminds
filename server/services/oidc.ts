import { randomBytes } from 'crypto';
import { SignJWT, importPKCS8, KeyLike } from 'jose';
import { storage } from '../storage';
import { JWTService } from '../utils/jwt';
import { RSAKeyService } from '../utils/rsaKeys';

// OIDC configuration
const OIDC_ISSUER = process.env.OIDC_ISSUER || 'http://localhost:5000';
const OIDC_BASE_URL = `${OIDC_ISSUER}/api/oidc`;

// Use JWTService for OIDC tokens instead of separate key for simplicity
// In production, use proper RSA key management

interface OIDCClient {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  responseTypes: string[];
  grantTypes: string[];
  name: string;
  createdAt: Date;
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  expiresAt: Date;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

export class OIDCService {
  private static clients = new Map<string, OIDCClient>();
  private static authCodes = new Map<string, AuthorizationCode>();

  static async initialize() {
    // Initialize RSA keys for OIDC
    RSAKeyService.initialize();
    console.log('OIDC service initialized with RSA keypair');
  }

  static registerClient(clientData: Omit<OIDCClient, 'createdAt'>): OIDCClient {
    const client: OIDCClient = {
      ...clientData,
      createdAt: new Date()
    };
    
    this.clients.set(client.clientId, client);
    return client;
  }

  static getClient(clientId: string): OIDCClient | undefined {
    return this.clients.get(clientId);
  }

  static getDiscoveryDocument() {
    return {
      issuer: OIDC_ISSUER,
      authorization_endpoint: `${OIDC_BASE_URL}/authorize`,
      token_endpoint: `${OIDC_BASE_URL}/token`,
      userinfo_endpoint: `${OIDC_BASE_URL}/userinfo`,
      jwks_uri: `${OIDC_BASE_URL}/jwks`,
      response_types_supported: ['code', 'id_token', 'token id_token', 'code id_token', 'code token', 'code token id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      claims_supported: ['sub', 'email', 'email_verified', 'name', 'preferred_username'],
      code_challenge_methods_supported: ['S256'],
      grant_types_supported: ['authorization_code', 'refresh_token']
    };
  }

  static async getJWKS() {
    // Return proper RSA public key in JWKS format
    return await RSAKeyService.getJWKS();
  }

  static generateAuthorizationCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    scope: string,
    codeChallenge?: string,
    codeChallengeMethod?: string
  ): string {
    const code = randomBytes(32).toString('base64url');
    const authCode: AuthorizationCode = {
      code,
      clientId,
      userId,
      redirectUri,
      scope,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      codeChallenge,
      codeChallengeMethod
    };

    this.authCodes.set(code, authCode);
    return code;
  }

  static getAuthorizationCode(code: string): AuthorizationCode | undefined {
    const authCode = this.authCodes.get(code);
    if (!authCode) return undefined;

    // Check if expired
    if (authCode.expiresAt < new Date()) {
      this.authCodes.delete(code);
      return undefined;
    }

    return authCode;
  }

  static consumeAuthorizationCode(code: string): AuthorizationCode | undefined {
    const authCode = this.getAuthorizationCode(code);
    if (authCode) {
      this.authCodes.delete(code);
    }
    return authCode;
  }

  static async generateIDToken(
    userId: string,
    clientId: string,
    nonce?: string,
    authTime?: number
  ): Promise<string> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // OIDC-compliant ID token with proper claims
    const now = Math.floor(Date.now() / 1000);
    const idTokenPayload = {
      // Standard OIDC claims
      iss: OIDC_ISSUER,
      sub: user.id,
      aud: clientId,
      exp: now + 3600, // 1 hour
      iat: now,
      auth_time: authTime || now,
      
      // Optional claims
      nonce,
      email: user.email,
      email_verified: true,
      preferred_username: user.email,
      name: user.email.split('@')[0]
    };

    // Generate using RSA signing for OIDC compliance
    return await RSAKeyService.generateOIDCToken(idTokenPayload);
  }

  static async generateTokens(
    userId: string,
    clientId: string,
    scope: string,
    nonce?: string,
    authTime?: number
  ) {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate access token using existing JWT service
    const sessionId = randomBytes(16).toString('hex');
    const accessTokenData = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      sessionId,
      authMethod: 'oidc',
      riskScore: 20, // OIDC gets lower risk
      deviceFingerprint: 'oidc-federated'
    });

    // Generate ID token if openid scope is requested
    let idToken: string | undefined;
    if (scope.includes('openid')) {
      idToken = await this.generateIDToken(userId, clientId, nonce, authTime);
    }

    return {
      access_token: accessTokenData.accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: accessTokenData.refreshToken,
      id_token: idToken,
      scope
    };
  }

  static async getUserInfo(accessToken: string) {
    const payload = JWTService.verifyAccessToken(accessToken);
    if (!payload) {
      throw new Error('Invalid access token');
    }

    const user = await storage.getUser(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      sub: user.id,
      email: user.email,
      email_verified: true,
      preferred_username: user.email,
      name: user.email.split('@')[0]
    };
  }

  // Cleanup expired authorization codes
  static cleanupExpiredCodes() {
    const now = new Date();
    for (const [code, authCode] of this.authCodes.entries()) {
      if (authCode.expiresAt < now) {
        this.authCodes.delete(code);
      }
    }
  }
}

// Register a default OIDC client for development
OIDCService.registerClient({
  clientId: 'lockmind-dev',
  clientSecret: 'dev-secret-change-in-production',
  redirectUris: ['http://localhost:3000/callback', 'http://localhost:5000/auth/callback'],
  responseTypes: ['code'],
  grantTypes: ['authorization_code', 'refresh_token'],
  name: 'LockingMiNDS Development Client'
});