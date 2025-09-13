import { Router, Request, Response } from 'express';
import { PushNotificationService } from '../services/pushNotification';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { DeviceFingerprintService } from '../services/deviceFingerprint';
import { RateLimiter } from '../middleware/rateLimiter';
import { MFASecurityService } from '../utils/mfaSecurity';

const router = Router();

// Register push token for MFA notifications
router.post('/register', 
  RateLimiter.createRateLimiter('tokenRegistration'),
  authenticateToken, 
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token, platform, deviceName } = req.body;
    const userId = req.user!.userId;

    if (!token || !platform) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate platform
    const validPlatforms = ['ios', 'android', 'web'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid platform. Supported: ios, android, web',
        code: 'INVALID_PLATFORM'
      });
    }

    await PushNotificationService.registerPushToken(
      userId,
      token,
      platform.toLowerCase(),
      deviceName
    );

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    console.error('Push token registration error:', error);
    res.status(500).json({
      error: 'Failed to register push token',
      code: 'REGISTRATION_FAILED'
    });
  }
});

// Send MFA challenge via push notification (REQUIRES AUTHENTICATION)
router.post('/mfa/challenge', 
  RateLimiter.createRateLimiter('mfaChallenge'),
  authenticateToken, 
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deviceName, ipAddress, location, expiresIn = 300 } = req.body;
    const userId = req.user!.userId; // Always use authenticated user ID
    
    // Security: Only authenticated users can send MFA challenges for themselves

    const challengeCode = await PushNotificationService.sendMFAChallenge(
      userId,
      {
        deviceName,
        ipAddress,
        location,
        expiresIn
      }
    );

    // Generate approval challenge for secure approval
    const deviceFingerprint = DeviceFingerprintService.generateFingerprint(req);
    const approvalChallenge = MFASecurityService.generateApprovalChallenge(challengeCode, userId);

    res.json({
      success: true,
      challengeCode,
      expiresIn,
      approvalChallenge: approvalChallenge.challenge
    });
  } catch (error) {
    console.error('MFA challenge error:', error);
    
    if (error instanceof Error && error.message.includes('No push tokens')) {
      return res.status(404).json({
        error: 'No push tokens registered for user',
        code: 'NO_PUSH_TOKENS'
      });
    }

    res.status(500).json({
      error: 'Failed to send MFA challenge',
      code: 'CHALLENGE_FAILED'
    });
  }
});

// Check MFA challenge status (REQUIRES AUTHENTICATION)
router.get('/mfa/challenge/:challengeCode', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeCode } = req.params;

    if (!challengeCode) {
      return res.status(400).json({
        error: 'Challenge code is required',
        code: 'MISSING_CHALLENGE_CODE'
      });
    }

    const status = await PushNotificationService.checkMFAChallenge(challengeCode, req.user!.userId);

    if (!status.exists) {
      return res.status(404).json({
        error: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      approved: status.approved,
      expired: status.expired
    });
  } catch (error) {
    console.error('MFA challenge check error:', error);
    res.status(500).json({
      error: 'Failed to check challenge status',
      code: 'CHECK_FAILED'
    });
  }
});

// Approve MFA challenge (REQUIRES AUTHENTICATION & SIGNED ASSERTION)
router.post('/mfa/challenge/:challengeCode/approve', 
  RateLimiter.createRateLimiter('mfaApproval'),
  authenticateToken, 
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeCode } = req.params;
    const { approvalToken, challenge, solution } = req.body;
    const userId = req.user!.userId;

    if (!challengeCode) {
      return res.status(400).json({
        error: 'Challenge code is required',
        code: 'MISSING_CHALLENGE_CODE'
      });
    }

    // Security: Verify approval authentication (either token or challenge/solution)
    let approvalVerified = false;
    
    if (approvalToken) {
      // Verify approval token (for web/API clients)
      const deviceFingerprint = DeviceFingerprintService.generateFingerprint(req);
      const tokenResult = MFASecurityService.verifyApprovalToken(
        approvalToken, 
        challengeCode, 
        userId
      );
      
      if (!tokenResult.valid) {
        return res.status(400).json({
          error: `Approval token verification failed: ${tokenResult.error}`,
          code: 'INVALID_APPROVAL_TOKEN'
        });
      }
      approvalVerified = true;
    } else if (challenge && solution) {
      // Verify challenge/solution (for mobile apps)
      const challengeResult = MFASecurityService.verifyApprovalChallenge(
        challenge, 
        solution
      );
      
      if (!challengeResult.valid || challengeResult.challengeCode !== challengeCode || challengeResult.userId !== userId) {
        return res.status(400).json({
          error: `Challenge verification failed: ${challengeResult.error}`,
          code: 'INVALID_CHALLENGE_SOLUTION'
        });
      }
      approvalVerified = true;
    } else {
      return res.status(400).json({
        error: 'Either approvalToken or challenge/solution is required',
        code: 'MISSING_APPROVAL_PROOF'
      });
    }

    const success = await PushNotificationService.approveMFAChallenge(challengeCode, userId);

    if (!success) {
      return res.status(400).json({
        error: 'Failed to approve challenge. It may be expired or already used.',
        code: 'APPROVAL_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Challenge approved successfully'
    });
  } catch (error) {
    console.error('MFA challenge approval error:', error);
    res.status(500).json({
      error: 'Failed to approve challenge',
      code: 'APPROVAL_FAILED'
    });
  }
});

// Unregister push token (REQUIRES AUTHENTICATION)
router.delete('/unregister', 
  RateLimiter.createRateLimiter('default'),
  authenticateToken, 
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Push token is required',
        code: 'MISSING_TOKEN'
      });
    }

    await PushNotificationService.unregisterPushToken(token, req.user!.userId);

    res.json({
      success: true,
      message: 'Push token unregistered successfully'
    });
  } catch (error) {
    console.error('Push token unregister error:', error);
    res.status(500).json({
      error: 'Failed to unregister push token',
      code: 'UNREGISTER_FAILED'
    });
  }
});

// Get mock notifications (for testing/development)
router.get('/mock/notifications', (req: Request, res: Response) => {
  try {
    const notifications = Array.from(PushNotificationService.getMockNotifications().entries()).map(
      ([token, notification]) => ({
        token: token.substring(0, 10) + '...',
        ...notification
      })
    );

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Get mock notifications error:', error);
    res.status(500).json({
      error: 'Failed to retrieve mock notifications',
      code: 'GET_NOTIFICATIONS_FAILED'
    });
  }
});

// Clear mock notifications (for testing/development)
router.delete('/mock/notifications', (req: Request, res: Response) => {
  try {
    PushNotificationService.clearMockNotifications();

    res.json({
      success: true,
      message: 'Mock notifications cleared'
    });
  } catch (error) {
    console.error('Clear mock notifications error:', error);
    res.status(500).json({
      error: 'Failed to clear mock notifications',
      code: 'CLEAR_NOTIFICATIONS_FAILED'
    });
  }
});

export default router;