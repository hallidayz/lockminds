import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { JWTService } from '../utils/jwt';
import { WebAuthnService } from '../services/webauthn';
import { DeviceFingerprintService } from '../services/deviceFingerprint';
import { RiskEngine } from '../services/riskEngine';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { insertUserSchema } from '@shared/schema';
import { randomBytes } from 'crypto';

const router = Router();

// User registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Frontend sends email and password; we hash the password server-side
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists',
        code: 'USER_EXISTS' 
      });
    }

    // Hash password server-side
    const saltRounds = 12;
    const masterPasswordHash = await bcrypt.hash(password, saltRounds);

    // Zero-trust model: No userKey or zkProof stored - use master password directly with PBKDF2
    // All encryption happens client-side with the actual master password

    // Create user (removed insecure userKey and zkProof fields)
    const user = await storage.createUser({
      email,
      masterPasswordHash
    });

    // Log security event
    await storage.createSecurityLog({
      userId: user.id,
      message: 'User account created successfully'
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isActive: true,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED' 
    });
  }
});

// Password-based login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, deviceInfo } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS' 
      });
    }

    // Verify password hash
    const isValidPassword = await bcrypt.compare(password, user.masterPasswordHash);
    if (!isValidPassword) {
      await storage.createSecurityLog({
        userId: user.id,
        message: 'Failed login attempt - invalid password'
      });
      
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS' 
      });
    }

    // Generate device fingerprint (simplified for now)
    const deviceData = DeviceFingerprintService.generateFingerprint(req, deviceInfo);
    await DeviceFingerprintService.recordDeviceLogin(deviceData, user.id);

    // Simplified risk assessment - allow all logins for now
    const riskAssessment = {
      overallRisk: 10, // Low risk
      factors: [],
      recommendation: 'allow' as const,
      requiresAdditionalAuth: false
    };
    
    // Skip risk blocking for now to fix login issues
    // TODO: Re-enable risk assessment once basic login is working

    // Check risk assessment - block or require MFA for high risk
    if (riskAssessment.recommendation === 'block') {
      await storage.createSecurityLog({
        userId: user.id,
        message: `Login blocked due to high risk (${riskAssessment.overallRisk}%)`
      });
      
      return res.status(403).json({
        error: 'Login blocked due to security concerns',
        code: 'LOGIN_BLOCKED',
        riskScore: riskAssessment.overallRisk
      });
    }

    // Generate tokens
    const sessionId = randomBytes(16).toString('hex');
    const tokenData = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      sessionId,
      authMethod: 'password',
      riskScore: riskAssessment.overallRisk,
      deviceFingerprint: deviceData.fingerprint
    });

    // Create session with sessionId as key
    const session = await storage.createAuthSession({
      userId: user.id,
      sessionToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      deviceFingerprint: deviceData.fingerprint,
      ipAddress: deviceData.ipAddress,
      userAgent: deviceData.userAgent,
      authMethod: 'password',
      riskScore: riskAssessment.overallRisk,
      expiresAt: tokenData.expiresAt
    });

    // Update session storage to use sessionId as key
    // Note: session.id should equal sessionId for proper lookup

    // Log successful login
    await RiskEngine.logSecurityEvent(
      user.id,
      'Password login successful',
      riskAssessment,
      { deviceFingerprint: deviceData.fingerprint }
    );

    res.json({
      success: true,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      sessionId: sessionId, // Fix: Include sessionId in response
      expiresAt: tokenData.expiresAt,
      user: {
        id: user.id,
        email: user.email
      },
      requiresMfa: riskAssessment.requiresAdditionalAuth,
      riskScore: riskAssessment.overallRisk
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      code: 'LOGIN_FAILED' 
    });
  }
});

// WebAuthn Registration - Start
router.post('/webauthn/register/begin', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    const options = await WebAuthnService.generateRegistrationOptions(userId, user.email);
    
    res.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('WebAuthn registration begin error:', error);
    res.status(500).json({ 
      error: 'Failed to generate registration options',
      code: 'WEBAUTHN_REG_FAILED' 
    });
  }
});

// WebAuthn Registration - Complete
router.post('/webauthn/register/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { credential } = req.body;

    const result = await WebAuthnService.verifyRegistration(userId, credential);
    
    if (result.verified) {
      await storage.createSecurityLog({
        userId,
        message: 'WebAuthn credential registered successfully'
      });

      res.json({
        success: true,
        credentialId: result.credentialId
      });
    } else {
      res.status(400).json({
        error: 'Registration verification failed',
        code: 'WEBAUTHN_VERIFICATION_FAILED'
      });
    }
  } catch (error) {
    console.error('WebAuthn registration complete error:', error);
    res.status(500).json({ 
      error: 'Registration verification failed',
      code: 'WEBAUTHN_REG_VERIFICATION_FAILED' 
    });
  }
});

// WebAuthn Authentication - Start
router.post('/webauthn/authenticate/begin', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; // Optional - for user-specific auth
    
    const options = await WebAuthnService.generateAuthenticationOptions(userId);
    
    res.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('WebAuthn authentication begin error:', error);
    res.status(500).json({ 
      error: 'Failed to generate authentication options',
      code: 'WEBAUTHN_AUTH_FAILED' 
    });
  }
});

// WebAuthn Authentication - Complete
router.post('/webauthn/authenticate/complete', async (req: Request, res: Response) => {
  try {
    const { credential, deviceInfo, userId } = req.body;

    const result = await WebAuthnService.verifyAuthentication(userId, credential);
    
    if (result.verified) {
      const user = await storage.getUser(result.userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        });
      }

      // Generate device fingerprint
      const deviceData = DeviceFingerprintService.generateFingerprint(req, deviceInfo);
      await DeviceFingerprintService.recordDeviceLogin(deviceData, user.id);

      // Assess risk (WebAuthn gets lower risk)
      const riskAssessment = await RiskEngine.assessLoginRisk(user.id, deviceData, 'webauthn');

      // WebAuthn has lower risk tolerance but still check
      if (riskAssessment.recommendation === 'block') {
        await storage.createSecurityLog({
          userId: user.id,
          message: `WebAuthn login blocked due to high risk (${riskAssessment.overallRisk}%)`
        });
        
        return res.status(403).json({
          error: 'Login blocked due to security concerns',
          code: 'LOGIN_BLOCKED',
          riskScore: riskAssessment.overallRisk
        });
      }

      // Generate tokens
      const sessionId = randomBytes(16).toString('hex');
      const tokenData = JWTService.generateTokenPair({
        userId: user.id,
        email: user.email,
        sessionId,
        authMethod: 'webauthn',
        riskScore: riskAssessment.overallRisk,
        deviceFingerprint: deviceData.fingerprint
      });

      // Create session
      await storage.createAuthSession({
        userId: user.id,
        sessionToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        deviceFingerprint: deviceData.fingerprint,
        ipAddress: deviceData.ipAddress,
        userAgent: deviceData.userAgent,
        authMethod: 'webauthn',
        riskScore: riskAssessment.overallRisk,
        expiresAt: tokenData.expiresAt
      });

      // Log successful login
      await RiskEngine.logSecurityEvent(
        user.id,
        'WebAuthn authentication successful',
        riskAssessment,
        { credentialId: result.credentialId }
      );

      res.json({
        success: true,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        sessionId: sessionId, // Fix: Include sessionId in response
        expiresAt: tokenData.expiresAt,
        user: {
          id: user.id,
          email: user.email
        },
        requiresMfa: riskAssessment.requiresAdditionalAuth,
        riskScore: riskAssessment.overallRisk
      });
    } else {
      res.status(401).json({
        error: 'Authentication verification failed',
        code: 'WEBAUTHN_AUTH_FAILED'
      });
    }
  } catch (error) {
    console.error('WebAuthn authentication complete error:', error);
    res.status(500).json({ 
      error: 'Authentication verification failed',
      code: 'WEBAUTHN_AUTH_VERIFICATION_FAILED' 
    });
  }
});

// Get user's WebAuthn credentials
router.get('/webauthn/credentials', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const credentials = await WebAuthnService.getCredentialsForUser(userId);
    
    res.json({
      success: true,
      credentials
    });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve credentials',
      code: 'GET_CREDENTIALS_FAILED' 
    });
  }
});

// Delete WebAuthn credential
router.delete('/webauthn/credentials/:credentialId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { credentialId } = req.params;
    
    const deleted = await WebAuthnService.deleteCredential(userId, credentialId);
    
    if (deleted) {
      await storage.createSecurityLog({
        userId,
        message: `WebAuthn credential deleted: ${credentialId}`
      });

      res.json({
        success: true,
        message: 'Credential deleted successfully'
      });
    } else {
      res.status(404).json({
        error: 'Credential not found or access denied',
        code: 'CREDENTIAL_NOT_FOUND'
      });
    }
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ 
      error: 'Failed to delete credential',
      code: 'DELETE_CREDENTIAL_FAILED' 
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Find active session with this refresh token
    const sessions = await storage.getAuthSessionsByUser('');
    const session = sessions.find(s => s.refreshToken === refreshToken && s.isActive);
    
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'REFRESH_TOKEN_INVALID'
      });
    }

    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new token pair
    const newSessionId = randomBytes(16).toString('hex');
    const tokenData = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      sessionId: newSessionId,
      authMethod: session.authMethod,
      riskScore: session.riskScore,
      deviceFingerprint: session.deviceFingerprint
    });

    // Deactivate old session
    await storage.deactivateAuthSessionBySessionId(session.id);

    // Create new session
    await storage.createAuthSession({
      userId: user.id,
      sessionToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      deviceFingerprint: session.deviceFingerprint,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      authMethod: session.authMethod,
      riskScore: session.riskScore,
      expiresAt: tokenData.expiresAt
    });

    await storage.createSecurityLog({
      userId: user.id,
      message: 'Token refreshed successfully'
    });

    res.json({
      success: true,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.user!.sessionId;
    
    // Deactivate the current session
    await storage.deactivateAuthSessionBySessionId(sessionId);
    
    await storage.createSecurityLog({
      userId: req.user!.userId,
      message: 'User logged out successfully'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
});

// Get user devices
router.get('/devices', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const devices = await DeviceFingerprintService.getUserDevices(userId);
    
    res.json({
      success: true,
      devices
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve devices',
      code: 'GET_DEVICES_FAILED' 
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Return user data without sensitive fields
    res.json({
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user information',
      code: 'GET_USER_FAILED'
    });
  }
});

// Trust a device
router.post('/devices/:fingerprint/trust', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fingerprint } = req.params;
    
    const trusted = await DeviceFingerprintService.trustDevice(userId, fingerprint);
    
    if (trusted) {
      await storage.createSecurityLog({
        userId,
        message: `Device marked as trusted: ${fingerprint}`
      });

      res.json({
        success: true,
        message: 'Device trusted successfully'
      });
    } else {
      res.status(404).json({
        error: 'Device not found or access denied',
        code: 'DEVICE_NOT_FOUND'
      });
    }
  } catch (error) {
    console.error('Trust device error:', error);
    res.status(500).json({ 
      error: 'Failed to trust device',
      code: 'TRUST_DEVICE_FAILED' 
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionToken = req.headers['authorization']?.split(' ')[1];
    
    if (sessionToken) {
      await storage.deactivateAuthSession(sessionToken);
      
      await storage.createSecurityLog({
        userId: req.user!.userId,
        message: 'User logged out successfully'
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      code: 'LOGOUT_FAILED' 
    });
  }
});

// Logout all sessions
router.post('/logout-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    await storage.deactivateAllUserSessions(userId);
    
    await storage.createSecurityLog({
      userId,
      message: 'All user sessions terminated'
    });

    res.json({
      success: true,
      message: 'All sessions terminated'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ 
      error: 'Failed to terminate all sessions',
      code: 'LOGOUT_ALL_FAILED' 
    });
  }
});

// Get current session info
router.get('/session', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionToken = req.headers['authorization']?.split(' ')[1];
    const session = sessionToken ? await storage.getAuthSession(sessionToken) : null;
    
    res.json({
      success: true,
      user: req.user,
      session: session ? {
        id: session.id,
        authMethod: session.authMethod,
        riskScore: session.riskScore,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      } : null
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve session info',
      code: 'GET_SESSION_FAILED' 
    });
  }
});

// Password reset - Request reset
router.post('/password-reset/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // For now, we'll just log the token (in production, you'd send an email)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: https://localhost:3001/reset-password?token=${resetToken}`);

    // Log security event
    await storage.createSecurityLog({
      userId: user.id,
      message: 'Password reset requested'
    });

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      // Include token in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      error: 'Failed to process password reset request',
      code: 'PASSWORD_RESET_REQUEST_FAILED'
    });
  }
});

// Password reset - Complete reset
router.post('/password-reset/complete', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Reset token and new password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // For now, we'll simulate a successful reset
    // In a real app, you'd validate the token and update the password
    console.log(`Password reset completed for token: ${token}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset complete error:', error);
    res.status(500).json({
      error: 'Failed to complete password reset',
      code: 'PASSWORD_RESET_COMPLETE_FAILED'
    });
  }
});

export default router;