// Platform detection utilities for biometric authentication
// Detects user's operating system and available biometric capabilities

export interface PlatformInfo {
  os: 'windows' | 'macos' | 'linux' | 'unknown';
  version: string;
  supportsWindowsHello: boolean;
  supportsTouchID: boolean;
  supportsLinuxFprint: boolean;
  supportsWebAuthn: boolean;
  supportsPlatformAuthenticator: boolean;
}

export class PlatformDetection {
  /**
   * Detect the user's operating system and capabilities
   */
  static detectPlatform(): PlatformInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';
    
    let os: PlatformInfo['os'] = 'unknown';
    let version = '0.0.0';
    
    // Detect OS
    if (userAgent.includes('windows') || platform.includes('win')) {
      os = 'windows';
      version = this.extractWindowsVersion(userAgent);
    } else if (userAgent.includes('mac') || platform.includes('mac')) {
      os = 'macos';
      version = this.extractMacOSVersion(userAgent);
    } else if (userAgent.includes('linux') || platform.includes('linux')) {
      os = 'linux';
      version = this.extractLinuxVersion(userAgent);
    }

    return {
      os,
      version,
      supportsWindowsHello: this.checkWindowsHelloSupport(os, version),
      supportsTouchID: this.checkTouchIDSupport(os, version),
      supportsLinuxFprint: this.checkLinuxFprintSupport(os),
      supportsWebAuthn: this.checkWebAuthnSupport(),
      supportsPlatformAuthenticator: false // Will be set asynchronously
    };
  }

  /**
   * Extract Windows version from user agent
   */
  private static extractWindowsVersion(userAgent: string): string {
    const match = userAgent.match(/windows nt (\d+\.\d+)/);
    if (match) {
      const version = parseFloat(match[1]);
      if (version >= 10.0) return '10.0';
      if (version >= 6.3) return '8.1';
      if (version >= 6.2) return '8.0';
      if (version >= 6.1) return '7.0';
    }
    return '0.0.0';
  }

  /**
   * Extract macOS version from user agent
   */
  private static extractMacOSVersion(userAgent: string): string {
    const match = userAgent.match(/mac os x (\d+[._]\d+)/);
    if (match) {
      return match[1].replace('_', '.');
    }
    return '0.0.0';
  }

  /**
   * Extract Linux version (generic)
   */
  private static extractLinuxVersion(userAgent: string): string {
    // Linux version detection is complex and varies by distribution
    // For now, return a generic version
    return '1.0.0';
  }

  /**
   * Check if Windows Hello is supported
   */
  private static checkWindowsHelloSupport(os: string, version: string): boolean {
    if (os !== 'windows') return false;
    
    const versionNum = parseFloat(version);
    return versionNum >= 10.0;
  }

  /**
   * Check if Touch ID is supported
   */
  private static checkTouchIDSupport(os: string, version: string): boolean {
    if (os !== 'macos') return false;
    
    const versionNum = parseFloat(version);
    return versionNum >= 10.12;
  }

  /**
   * Check if Linux fprint is supported
   */
  private static checkLinuxFprintSupport(os: string): boolean {
    if (os !== 'linux') return false;
    
    // Check if we're in a browser that supports WebAuthn on Linux
    // This is a simplified check - real implementation would need more sophisticated detection
    return this.checkWebAuthnSupport();
  }

  /**
   * Check if WebAuthn is supported
   */
  private static checkWebAuthnSupport(): boolean {
    return !!(
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential === 'function' &&
      window.navigator.credentials &&
      typeof window.navigator.credentials.create === 'function'
    );
  }

  /**
   * Check if platform authenticator is supported
   */
  private static async checkPlatformAuthenticatorSupport(): Promise<boolean> {
    if (!this.checkWebAuthnSupport()) return false;

    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.warn('Platform authenticator check failed:', error);
      return false;
    }
  }

  /**
   * Get biometric options available for the current platform
   */
  static getAvailableBiometricOptions(platformInfo: PlatformInfo): string[] {
    const options: string[] = [];

    if (platformInfo.supportsWindowsHello) {
      options.push('windows-hello');
    }

    if (platformInfo.supportsTouchID) {
      options.push('macos-touchid');
    }

    if (platformInfo.supportsLinuxFprint) {
      options.push('linux-fprint');
    }

    return options;
  }

  /**
   * Get the recommended biometric option for the current platform
   */
  static getRecommendedBiometricOption(platformInfo: PlatformInfo): string | null {
    const available = this.getAvailableBiometricOptions(platformInfo);
    
    if (available.length === 0) return null;
    
    // Return the first available option (most appropriate for the platform)
    return available[0];
  }

  /**
   * Check if a specific biometric option is available
   */
  static isBiometricOptionAvailable(option: string, platformInfo: PlatformInfo): boolean {
    const available = this.getAvailableBiometricOptions(platformInfo);
    return available.includes(option);
  }
}
