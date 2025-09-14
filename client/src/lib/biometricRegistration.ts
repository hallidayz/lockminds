// Biometric registration utilities for different platforms
// Handles WebAuthn credential registration for Windows Hello, Touch ID, and Linux fprint

import { PlatformDetection, PlatformInfo } from './platformDetection';

export interface BiometricRegistrationResult {
  success: boolean;
  credentialId?: string;
  error?: string;
  platform: string;
}

export class BiometricRegistration {
  /**
   * Register a biometric credential for the specified platform
   */
  static async registerBiometric(
    userId: string,
    userEmail: string,
    platform: string
  ): Promise<BiometricRegistrationResult> {
    try {
      const platformInfo = PlatformDetection.detectPlatform();
      
      // Check if the platform is supported
      if (!PlatformDetection.isBiometricOptionAvailable(platform, platformInfo)) {
        return {
          success: false,
          error: `${platform} is not available on your current platform`,
          platform: platformInfo.os
        };
      }

      // Check WebAuthn support
      if (!platformInfo.supportsWebAuthn) {
        return {
          success: false,
          error: 'WebAuthn is not supported in this browser',
          platform: platformInfo.os
        };
      }

      // Generate registration options
      const options = await this.generateRegistrationOptions(userId, userEmail, platform);
      
      // Create the credential
      const credential = await navigator.credentials.create({
        publicKey: options
      });

      if (!credential) {
        return {
          success: false,
          error: 'Failed to create biometric credential',
          platform: platformInfo.os
        };
      }

      // Send credential to server for verification and storage
      const result = await this.verifyAndStoreCredential(credential, userId, platform);

      return {
        success: result.success,
        credentialId: result.credentialId,
        error: result.error,
        platform: platformInfo.os
      };

    } catch (error) {
      console.error('Biometric registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        platform: 'unknown'
      };
    }
  }

  /**
   * Generate WebAuthn registration options for the specified platform
   */
  private static async generateRegistrationOptions(
    userId: string,
    userEmail: string,
    platform: string
  ): Promise<PublicKeyCredentialCreationOptions> {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const options: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'LockingMiNDS',
        id: window.location.hostname
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userEmail
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Force platform authenticator
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 60000,
      attestation: 'direct'
    };

    // Platform-specific configurations
    switch (platform) {
      case 'windows-hello':
        options.authenticatorSelection!.authenticatorAttachment = 'platform';
        break;
      case 'macos-touchid':
        options.authenticatorSelection!.authenticatorAttachment = 'platform';
        break;
      case 'linux-fprint':
        options.authenticatorSelection!.authenticatorAttachment = 'platform';
        break;
    }

    return options;
  }

  /**
   * Verify and store the credential on the server
   */
  private static async verifyAndStoreCredential(
    credential: Credential,
    userId: string,
    platform: string
  ): Promise<{ success: boolean; credentialId?: string; error?: string }> {
    try {
      const response = await fetch('/api/auth/webauthn/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credential,
          userId: userId,
          platform: platform
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Server verification failed'
        };
      }

      return {
        success: true,
        credentialId: result.credentialId
      };

    } catch (error) {
      console.error('Credential verification failed:', error);
      return {
        success: false,
        error: 'Failed to verify credential with server'
      };
    }
  }

  /**
   * Check if biometric authentication is already set up for the user
   */
  static async isBiometricSetup(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/auth/webauthn/credentials/${userId}`);
      const result = await response.json();
      
      return result.credentials && result.credentials.length > 0;
    } catch (error) {
      console.error('Failed to check biometric setup:', error);
      return false;
    }
  }

  /**
   * Get available biometric options for the current platform
   */
  static getAvailableOptions(): string[] {
    const platformInfo = PlatformDetection.detectPlatform();
    return PlatformDetection.getAvailableBiometricOptions(platformInfo);
  }

  /**
   * Get the recommended biometric option for the current platform
   */
  static getRecommendedOption(): string | null {
    const platformInfo = PlatformDetection.detectPlatform();
    return PlatformDetection.getRecommendedBiometricOption(platformInfo);
  }

  /**
   * Test biometric authentication
   */
  static async testBiometric(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/webauthn/authenticate/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const challenge = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: challenge.error || 'Failed to get authentication challenge'
        };
      }

      // Create authentication options
      const options: PublicKeyCredentialRequestOptions = {
        challenge: new Uint8Array(Object.values(challenge.challenge)),
        allowCredentials: challenge.allowCredentials || [],
        userVerification: 'required',
        timeout: 60000
      };

      // Get the credential
      const credential = await navigator.credentials.get({
        publicKey: options
      });

      if (!credential) {
        return {
          success: false,
          error: 'Biometric authentication failed'
        };
      }

      // Verify with server
      const verifyResponse = await fetch('/api/auth/webauthn/authenticate/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credential,
          userId: userId
        })
      });

      const result = await verifyResponse.json();

      return {
        success: verifyResponse.ok,
        error: result.error
      };

    } catch (error) {
      console.error('Biometric test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
