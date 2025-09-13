import { storage } from '../storage';
import { DeviceFingerprintService, DeviceFingerprintData } from './deviceFingerprint';

export interface RiskAssessment {
  overallRisk: number; // 0-100
  factors: RiskFactor[];
  recommendation: 'allow' | 'mfa_required' | 'block';
  requiresAdditionalAuth: boolean;
}

export interface RiskFactor {
  type: 'device' | 'location' | 'behavior' | 'time' | 'frequency';
  risk: number; // 0-100
  description: string;
  weight: number; // How much this factor contributes to overall risk
}

export class RiskEngine {
  static async assessLoginRisk(
    userId: string,
    deviceData: DeviceFingerprintData,
    authMethod: string
  ): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];

    try {
      // Device risk assessment
      const deviceRisk = await DeviceFingerprintService.analyzeRisk(deviceData, userId);
      factors.push({
        type: 'device',
        risk: deviceRisk,
        description: deviceRisk > 70 ? 'Unknown or suspicious device' : 
                    deviceRisk > 40 ? 'Unrecognized device' : 'Known device',
        weight: 0.4
      });

      // Behavioral risk assessment
      const behaviorRisk = await this.analyzeBehaviorRisk(userId);
      factors.push({
        type: 'behavior',
        risk: behaviorRisk,
        description: behaviorRisk > 70 ? 'Unusual login pattern detected' :
                    behaviorRisk > 40 ? 'Slightly different from normal pattern' : 'Normal behavior pattern',
        weight: 0.3
      });

      // Time-based risk assessment
      const timeRisk = this.analyzeTimeRisk();
      factors.push({
        type: 'time',
        risk: timeRisk,
        description: timeRisk > 50 ? 'Login outside normal hours' : 'Login during normal hours',
        weight: 0.1
      });

      // Location risk (based on IP)
      const locationRisk = await this.analyzeLocationRisk(userId, deviceData.ipAddress);
      factors.push({
        type: 'location',
        risk: locationRisk,
        description: locationRisk > 70 ? 'Login from new location' :
                    locationRisk > 40 ? 'Login from infrequent location' : 'Login from known location',
        weight: 0.2
      });

      // Calculate weighted overall risk
      const overallRisk = Math.round(
        factors.reduce((sum, factor) => sum + (factor.risk * factor.weight), 0)
      );

      // Determine recommendation based on risk and auth method
      let recommendation: 'allow' | 'mfa_required' | 'block';
      let requiresAdditionalAuth = false;

      if (overallRisk >= 90) {
        recommendation = 'block';
        requiresAdditionalAuth = true;
      } else if (overallRisk >= 60 || authMethod === 'password') {
        recommendation = 'mfa_required';
        requiresAdditionalAuth = true;
      } else if (overallRisk >= 40 && authMethod !== 'webauthn') {
        recommendation = 'mfa_required';
        requiresAdditionalAuth = true;
      } else {
        recommendation = 'allow';
      }

      // WebAuthn/biometric auth gets risk reduction
      if (authMethod === 'webauthn' || authMethod === 'biometric') {
        const adjustedRisk = Math.max(0, overallRisk - 20);
        if (adjustedRisk < 40) {
          recommendation = 'allow';
          requiresAdditionalAuth = false;
        }
      }

      return {
        overallRisk,
        factors,
        recommendation,
        requiresAdditionalAuth
      };
    } catch (error) {
      console.error('Risk assessment error:', error);
      // Default to high risk on error
      return {
        overallRisk: 80,
        factors: [{
          type: 'behavior',
          risk: 80,
          description: 'Risk assessment unavailable',
          weight: 1.0
        }],
        recommendation: 'mfa_required',
        requiresAdditionalAuth: true
      };
    }
  }

  private static async analyzeBehaviorRisk(userId: string): Promise<number> {
    try {
      const userSessions = await storage.getAuthSessionsByUser(userId);
      
      if (userSessions.length === 0) {
        return 50; // Neutral risk for new user
      }

      // Analyze login frequency
      const recentSessions = userSessions.filter(
        session => session.createdAt && session.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      const avgDailyLogins = recentSessions.length / 7;
      
      // Very frequent logins might indicate compromise
      if (avgDailyLogins > 20) {
        return 75;
      }

      // Check for unusual authentication methods
      const authMethods = recentSessions.map(s => s.authMethod);
      const methodCounts = authMethods.reduce((acc, method) => {
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // If suddenly using different auth method, increase risk
      const mostCommonMethod = Object.keys(methodCounts).sort((a, b) => methodCounts[b] - methodCounts[a])[0];
      const recentAuthMethods = recentSessions.slice(0, 5).map(s => s.authMethod);
      
      if (recentAuthMethods.every(method => method !== mostCommonMethod)) {
        return 60; // Moderate risk for auth method change
      }

      return 20; // Low risk for normal behavior
    } catch (error) {
      return 40; // Moderate risk on error
    }
  }

  private static analyzeTimeRisk(): number {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Higher risk during unusual hours
    if (hour >= 2 && hour <= 6) {
      return 60; // Late night/early morning
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 30; // Weekend - slightly higher risk
    }

    return 10; // Normal business hours
  }

  private static async analyzeLocationRisk(userId: string, currentIp: string): Promise<number> {
    try {
      const userDevices = await storage.getDeviceFingerprints(userId);
      const knownIPs = userDevices.map(d => d.ipAddress);

      if (knownIPs.includes(currentIp)) {
        return 10; // Known IP - low risk
      }

      // Check if IP is from same subnet as known IPs
      const currentSubnet = currentIp.split('.').slice(0, 3).join('.');
      const hasKnownSubnet = knownIPs.some(ip => 
        ip.split('.').slice(0, 3).join('.') === currentSubnet
      );

      if (hasKnownSubnet) {
        return 30; // Same subnet - moderate risk
      }

      return 70; // Completely new IP - high risk
    } catch (error) {
      return 50; // Neutral risk on error
    }
  }

  static async logSecurityEvent(
    userId: string,
    event: string,
    riskAssessment: RiskAssessment,
    additionalData?: any
  ): Promise<void> {
    try {
      const message = `${event} - Risk: ${riskAssessment.overallRisk}% (${riskAssessment.recommendation}) - Factors: ${
        riskAssessment.factors.map(f => `${f.type}:${f.risk}%`).join(', ')
      }`;

      await storage.createSecurityLog({
        userId,
        message: message + (additionalData ? ` - Data: ${JSON.stringify(additionalData)}` : '')
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
}