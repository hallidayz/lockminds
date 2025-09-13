import { Router, Request, Response } from 'express';
import { URL } from 'url';
import { createHash, randomBytes } from 'crypto';
import { OIDCService } from '../services/oidc';
import { storage } from '../storage';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { DeviceFingerprintService } from '../services/deviceFingerprint';
import { RiskEngine } from '../services/riskEngine';

const router = Router();

// Note: Discovery document is now handled in main routes.ts to avoid double-mounting

// JWKS endpoint
router.get('/jwks', async (req: Request, res: Response) => {
  try {
    console.log('JWKS endpoint called - attempting to get JWKS...');
    const jwks = await OIDCService.getJWKS();
    console.log('JWKS generated successfully:', JSON.stringify(jwks, null, 2));
    res.json(jwks);
  } catch (error) {
    console.error('JWKS generation error:', error);
    console.error('Error stack:', (error as Error).stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Authorization endpoint
router.get('/authorize', async (req: Request, res: Response) => {
  try {
    const {
      response_type,
      client_id,
      redirect_uri,
      scope = 'openid',
      state,
      nonce,
      code_challenge,
      code_challenge_method,
      prompt
    } = req.query as Record<string, string>;

    // Validate required parameters
    if (!response_type || !client_id || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters'
      });
    }

    // Validate client
    const client = OIDCService.getClient(client_id);
    if (!client) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Invalid client_id'
      });
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirect_uri)) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Invalid redirect_uri'
      });
    }

    // Validate response type
    if (!client.responseTypes.includes(response_type)) {
      return res.status(400).json({
        error: 'unsupported_response_type',
        error_description: 'Response type not supported for this client'
      });
    }

    // For now, redirect to LockMiNDS login page with OIDC context
    // In production, this would be a proper consent screen
    const authParams = new URLSearchParams({
      client_id,
      redirect_uri,
      scope,
      state: state || '',
      nonce: nonce || '',
      code_challenge: code_challenge || '',
      code_challenge_method: code_challenge_method || ''
    });

    // Redirect to LockMiNDS login with OIDC context
    const loginUrl = `/?oidc=true&${authParams.toString()}`;
    res.redirect(loginUrl);
  } catch (error) {
    console.error('OIDC authorize error:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

// Authorization callback (after user authenticates)
router.post('/authorize/callback', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      client_id,
      redirect_uri,
      scope = 'openid',
      state,
      nonce,
      code_challenge,
      code_challenge_method
    } = req.body;

    const userId = req.user!.userId;

    // Validate client and redirect URI
    const client = OIDCService.getClient(client_id);
    if (!client || !client.redirectUris.includes(redirect_uri)) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Invalid client or redirect URI'
      });
    }

    // Generate authorization code
    const authCode = OIDCService.generateAuthorizationCode(
      client_id,
      userId,
      redirect_uri,
      scope,
      code_challenge,
      code_challenge_method
    );

    // Log security event
    await storage.createSecurityLog({
      userId,
      message: `OIDC authorization granted for client: ${client.name}`
    });

    // Build callback URL
    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set('code', authCode);
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }

    res.json({
      success: true,
      redirectUrl: callbackUrl.toString()
    });
  } catch (error) {
    console.error('OIDC authorize callback error:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

// Token endpoint
router.post('/token', async (req: Request, res: Response) => {
  try {
    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      code_verifier
    } = req.body;

    // Validate grant type
    if (grant_type !== 'authorization_code') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant type is supported'
      });
    }

    // Validate required parameters
    if (!code || !client_id || !client_secret) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters'
      });
    }

    // Validate client
    const client = OIDCService.getClient(client_id);
    if (!client || client.clientSecret !== client_secret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    // Consume authorization code
    const authCode = OIDCService.consumeAuthorizationCode(code);
    if (!authCode) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code'
      });
    }

    // Validate authorization code
    if (authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code validation failed'
      });
    }

    // Validate PKCE if used
    if (authCode.codeChallenge && authCode.codeChallengeMethod === 'S256') {
      if (!code_verifier) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Code verifier required'
        });
      }

      const challenge = createHash('sha256')
        .update(code_verifier)
        .digest('base64url');

      if (challenge !== authCode.codeChallenge) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Code verifier validation failed'
        });
      }
    }

    // Generate device fingerprint for security logging
    const deviceData = DeviceFingerprintService.generateFingerprint(req);
    await DeviceFingerprintService.recordDeviceLogin(deviceData, authCode.userId);

    // Generate tokens
    const tokens = await OIDCService.generateTokens(
      authCode.userId,
      client_id,
      authCode.scope
    );

    // Create session
    await storage.createAuthSession({
      userId: authCode.userId,
      sessionToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      deviceFingerprint: deviceData.fingerprint,
      ipAddress: deviceData.ipAddress,
      userAgent: deviceData.userAgent,
      authMethod: 'oidc',
      riskScore: 20, // OIDC gets lower risk
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    });

    // Log successful token exchange
    await storage.createSecurityLog({
      userId: authCode.userId,
      message: `OIDC token exchange successful for client: ${client.name}`
    });

    res.json(tokens);
  } catch (error) {
    console.error('OIDC token error:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

// UserInfo endpoint
router.get('/userinfo', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Access token required'
      });
    }

    const userInfo = await OIDCService.getUserInfo(token);
    res.json(userInfo);
  } catch (error) {
    console.error('OIDC userinfo error:', error);
    
    if (error instanceof Error && error.message === 'Invalid access token') {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Invalid or expired access token'
      });
    }
    
    res.status(500).json({ error: 'server_error' });
  }
});

// Client registration endpoint (for development)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      client_name,
      redirect_uris,
      response_types = ['code'],
      grant_types = ['authorization_code']
    } = req.body;

    if (!client_name || !redirect_uris || !Array.isArray(redirect_uris)) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing or invalid parameters'
      });
    }

    // Generate client credentials
    const clientId = `lm_${randomBytes(16).toString('hex')}`;
    const clientSecret = randomBytes(32).toString('hex');

    // Register client
    const client = OIDCService.registerClient({
      clientId,
      clientSecret,
      redirectUris: redirect_uris,
      responseTypes: response_types,
      grantTypes: grant_types,
      name: client_name
    });

    res.status(201).json({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      client_name: client.name,
      redirect_uris: client.redirectUris,
      response_types: client.responseTypes,
      grant_types: client.grantTypes,
      created_at: Math.floor(client.createdAt.getTime() / 1000)
    });
  } catch (error) {
    console.error('OIDC client registration error:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;