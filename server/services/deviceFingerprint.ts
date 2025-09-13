import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import { storage } from '../storage';

export interface DeviceFingerprintData {
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
  platform?: string;
  browser?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
}

export class DeviceFingerprintService {
  static generateFingerprint(req: Request, additionalData: Partial<DeviceFingerprintData> = {}): DeviceFingerprintData {
    const ua = new UAParser(req.headers['user-agent']);
    const browser = ua.getBrowser();
    const os = ua.getOS();
    
    // Create fingerprint from various sources
    const fingerprintComponents = [
      req.headers['user-agent'] || '',
      req.ip || req.connection.remoteAddress || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      browser.name || '',
      browser.version || '',
      os.name || '',
      os.version || '',
      additionalData.screenResolution || '',
      additionalData.timezone || '',
    ];

    const fingerprint = crypto
      .createHash('sha256')
      .update(fingerprintComponents.join('|'))
      .digest('hex');

    return {
      fingerprint,
      ipAddress: (req.ip || req.connection.remoteAddress || 'unknown') as string,
      userAgent: req.headers['user-agent'] || '',
      platform: os.name,
      browser: browser.name,
      screenResolution: additionalData.screenResolution,
      timezone: additionalData.timezone,
      language: req.headers['accept-language']?.split(',')[0] || additionalData.language
    };
  }

  static async analyzeRisk(deviceData: DeviceFingerprintData, userId?: string): Promise<number> {
    let riskScore = 30; // Base risk score

    try {
      // Check if device is known
      const existingDevice = await storage.getDeviceFingerprint(deviceData.fingerprint);
      
      if (existingDevice) {
        if (existingDevice.userId === userId) {
          // Known device for this user - low risk
          riskScore = Math.max(5, existingDevice.riskScore - 5);
          
          // Increase trust over time with successful logins
          if (existingDevice.loginCount > 10) {
            riskScore = Math.max(0, riskScore - 10);
          }
        } else if (existingDevice.userId && existingDevice.userId !== userId) {
          // Device used by different user - high risk
          riskScore = 80;
        }
      } else {
        // New device - moderate risk
        riskScore = 60;
      }

      // Analyze IP-based risk
      if (userId) {
        const userDevices = await storage.getDeviceFingerprints(userId);
        const sameIPDevices = userDevices.filter(d => d.ipAddress === deviceData.ipAddress);
        
        if (sameIPDevices.length > 0) {
          // Same IP as other user devices - lower risk
          riskScore = Math.max(10, riskScore - 15);
        }
      }

      // Browser-based risk assessment
      const suspiciousBrowsers = ['unknown', '', null];
      if (suspiciousBrowsers.includes(deviceData.browser?.toLowerCase())) {
        riskScore += 20;
      }

      // Platform-based assessment
      const trustedPlatforms = ['Windows', 'Mac OS', 'iOS', 'Android'];
      if (deviceData.platform && !trustedPlatforms.some(p => deviceData.platform?.includes(p))) {
        riskScore += 15;
      }

      // Cap the risk score
      riskScore = Math.min(100, Math.max(0, riskScore));

      return riskScore;
    } catch (error) {
      console.error('Risk analysis error:', error);
      return 70; // High risk on error
    }
  }

  static async recordDeviceLogin(deviceData: DeviceFingerprintData, userId?: string): Promise<void> {
    try {
      const existingDevice = await storage.getDeviceFingerprint(deviceData.fingerprint);
      
      if (existingDevice) {
        // Update existing device
        await storage.updateDeviceFingerprint(deviceData.fingerprint, {
          ipAddress: deviceData.ipAddress,
          platform: deviceData.platform,
          browser: deviceData.browser,
          screenResolution: deviceData.screenResolution,
          timezone: deviceData.timezone,
          language: deviceData.language
        });
      } else {
        // Create new device record
        const riskScore = await this.analyzeRisk(deviceData, userId);
        await storage.createDeviceFingerprint({
          ...deviceData,
          userId: userId || null,
          riskScore
        });
      }
    } catch (error) {
      console.error('Error recording device login:', error);
    }
  }

  static async getUserDevices(userId: string) {
    const devices = await storage.getDeviceFingerprints(userId);
    
    return devices.map(device => ({
      id: device.id,
      fingerprint: device.fingerprint,
      platform: device.platform,
      browser: device.browser,
      ipAddress: this.maskIpAddress(device.ipAddress),
      isTrusted: device.isTrusted,
      riskScore: device.riskScore,
      loginCount: device.loginCount,
      firstSeen: device.firstSeen,
      lastSeen: device.lastSeen
    }));
  }

  static maskIpAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    // For IPv6 or other formats, show first 2 groups
    const ipv6Parts = ip.split(':');
    if (ipv6Parts.length > 2) {
      return `${ipv6Parts[0]}:${ipv6Parts[1]}::xxxx`;
    }
    return 'xxx.xxx.xxx.xxx';
  }

  static async trustDevice(userId: string, fingerprint: string): Promise<boolean> {
    const device = await storage.getDeviceFingerprint(fingerprint);
    if (!device || device.userId !== userId) {
      return false;
    }

    await storage.updateDeviceFingerprint(fingerprint, {
      riskScore: Math.min(device.riskScore, 10) // Trusted devices get low risk
    });

    // Update the trusted status in the device object (this would need to be added to the schema if we want to persist it)
    device.isTrusted = true;

    return true;
  }
}