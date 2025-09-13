import { storage } from '../storage';
import { randomBytes } from 'crypto';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: any;
  badge?: number;
  sound?: string;
}

interface MFAChallenge {
  challengeCode: string;
  userId: string;
  deviceName?: string;
  ipAddress?: string;
  location?: string;
  expiresIn: number; // seconds
}

export class PushNotificationService {
  // In production, this would integrate with FCM, APNs, or web push services
  private static mockNotifications = new Map<string, any>();

  static async sendMFAChallenge(
    userId: string,
    challengeData: Omit<MFAChallenge, 'challengeCode' | 'userId'>
  ): Promise<string> {
    try {
      // Generate challenge code
      const challengeCode = randomBytes(8).toString('hex').toUpperCase();
      
      // Store MFA challenge
      await storage.createMfaChallenge({
        userId,
        challengeCode,
        type: 'push',
        expiresAt: new Date(Date.now() + challengeData.expiresIn * 1000)
      });

      // Get user's push tokens
      const pushTokens = await storage.getPushTokens(userId);
      
      if (pushTokens.length === 0) {
        throw new Error('No push tokens registered for user');
      }

      const payload: PushNotificationPayload = {
        title: 'LockMind Security Alert',
        body: `Login attempt from ${challengeData.deviceName || 'unknown device'}. Approve or deny this request.`,
        data: {
          type: 'mfa_challenge',
          challengeCode,
          userId,
          deviceName: challengeData.deviceName,
          ipAddress: challengeData.ipAddress,
          location: challengeData.location,
          expiresAt: new Date(Date.now() + challengeData.expiresIn * 1000).toISOString()
        },
        badge: 1,
        sound: 'default'
      };

      // Send to all registered devices
      const sendPromises = pushTokens.map(async (tokenData) => {
        return this.sendPushNotification(tokenData.token, tokenData.platform, payload);
      });

      await Promise.allSettled(sendPromises);

      // Log security event
      await storage.createSecurityLog({
        userId,
        message: `MFA push notification sent for challenge: ${challengeCode}`
      });

      return challengeCode;
    } catch (error) {
      console.error('Failed to send MFA challenge:', error);
      throw error;
    }
  }

  static async sendPushNotification(
    token: string,
    platform: string,
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      // Mock implementation - in production, use real push services
      console.log(`[MOCK PUSH] Sending to ${platform} token:`, {
        token: token.substring(0, 10) + '...',
        payload
      });

      // Store mock notification for testing
      this.mockNotifications.set(token, {
        ...payload,
        timestamp: new Date(),
        platform
      });

      // Simulate push service APIs
      switch (platform.toLowerCase()) {
        case 'ios':
          await this.sendAPNS(token, payload);
          break;
        case 'android':
          await this.sendFCM(token, payload);
          break;
        case 'web':
          await this.sendWebPush(token, payload);
          break;
        default:
          console.warn(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error('Push notification send failed:', error);
      throw error;
    }
  }

  private static async sendAPNS(token: string, payload: PushNotificationPayload): Promise<void> {
    // Mock Apple Push Notification Service
    console.log(`[APNS] Sent to iOS device: ${payload.title}`);
    
    // In production:
    // const apnProvider = new apn.Provider(apnConfig);
    // const note = new apn.Notification();
    // note.alert = { title: payload.title, body: payload.body };
    // note.payload = payload.data;
    // note.badge = payload.badge;
    // note.sound = payload.sound;
    // await apnProvider.send(note, token);
  }

  private static async sendFCM(token: string, payload: PushNotificationPayload): Promise<void> {
    // Mock Firebase Cloud Messaging
    console.log(`[FCM] Sent to Android device: ${payload.title}`);
    
    // In production:
    // const message = {
    //   token,
    //   notification: {
    //     title: payload.title,
    //     body: payload.body
    //   },
    //   data: payload.data,
    //   android: {
    //     notification: {
    //       sound: payload.sound
    //     }
    //   }
    // };
    // await admin.messaging().send(message);
  }

  private static async sendWebPush(token: string, payload: PushNotificationPayload): Promise<void> {
    // Mock Web Push
    console.log(`[WEB_PUSH] Sent to web browser: ${payload.title}`);
    
    // In production:
    // await webpush.sendNotification(
    //   JSON.parse(token),
    //   JSON.stringify({
    //     title: payload.title,
    //     body: payload.body,
    //     data: payload.data,
    //     badge: payload.badge
    //   })
    // );
  }

  static async registerPushToken(
    userId: string,
    token: string,
    platform: string,
    deviceName?: string
  ): Promise<void> {
    try {
      // Store push token
      await storage.createPushToken({
        userId,
        token,
        platform,
        deviceName
      });

      // Log registration
      await storage.createSecurityLog({
        userId,
        message: `Push notification token registered for ${platform} device: ${deviceName || 'unknown'}`
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
      throw error;
    }
  }

  static async unregisterPushToken(token: string, userId?: string): Promise<void> {
    try {
      // Security: Verify token ownership if userId provided
      if (userId) {
        const pushTokens = await storage.getPushTokens(userId);
        const tokenExists = pushTokens.some(t => t.token === token);
        
        if (!tokenExists) {
          throw new Error(`User ${userId} attempted to unregister token they don't own`);
        }
      }

      await storage.deactivatePushToken(token);
      
      // Log security event
      if (userId) {
        await storage.createSecurityLog({
          userId,
          message: `Push notification token unregistered: ${token.substring(0, 10)}...`
        });
      }
      
      console.log('Push token unregistered successfully');
    } catch (error) {
      console.error('Failed to unregister push token:', error);
      throw error;
    }
  }

  static async checkMFAChallenge(challengeCode: string, userId?: string): Promise<{
    exists: boolean;
    approved?: boolean;
    expired?: boolean;
  }> {
    try {
      const challenge = await storage.getMfaChallenge(challengeCode);
      
      if (!challenge) {
        return { exists: false };
      }

      // Security: If userId provided, verify ownership
      if (userId && challenge.userId !== userId) {
        console.warn(`User ${userId} attempted to check challenge for user ${challenge.userId}`);
        return { exists: false };
      }

      const now = new Date();
      const expired = challenge.expiresAt < now;

      return {
        exists: true,
        approved: challenge.isApproved || false,
        expired
      };
    } catch (error) {
      console.error('Failed to check MFA challenge:', error);
      return { exists: false };
    }
  }

  static async approveMFAChallenge(challengeCode: string, userId?: string): Promise<boolean> {
    try {
      // First verify the challenge exists and belongs to the user
      const challenge = await storage.getMfaChallenge(challengeCode);
      
      if (!challenge) {
        console.warn(`Approval attempt for non-existent challenge: ${challengeCode}`);
        return false;
      }

      // Security: Verify user ownership if provided
      if (userId && challenge.userId !== userId) {
        console.warn(`User ${userId} attempted to approve challenge for user ${challenge.userId}`);
        return false;
      }

      // Check if challenge is expired
      if (challenge.expiresAt < new Date()) {
        console.warn(`Approval attempt for expired challenge: ${challengeCode}`);
        return false;
      }

      const success = await storage.approveMfaChallenge(challengeCode);
      
      if (success) {
        await storage.createSecurityLog({
          userId: challenge.userId,
          message: `MFA challenge approved: ${challengeCode} by ${userId || 'authenticated user'}`
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to approve MFA challenge:', error);
      return false;
    }
  }

  // For testing - get mock notifications
  static getMockNotifications(): Map<string, any> {
    return this.mockNotifications;
  }

  static clearMockNotifications(): void {
    this.mockNotifications.clear();
  }
}