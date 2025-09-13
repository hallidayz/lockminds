import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse 
} from '@simplewebauthn/server';
import { randomBytes } from 'crypto';
import { storage } from '../storage';

// Replace with your actual domain in production
const RP_NAME = 'LockMind Security Platform';
const RP_ID = 'localhost';
const ORIGIN = 'http://localhost:5000';

export class WebAuthnService {
  static async generateRegistrationOptions(userId: string, userEmail: string) {
    // Get existing authenticators for this user
    const existingCredentials = await storage.getWebauthnCredentials(userId);
    
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: userId,
      userName: userEmail,
      userDisplayName: userEmail,
      timeout: 60000,
      attestationType: 'none', // 'direct' for production
      excludeCredentials: existingCredentials.map(cred => ({
        id: Buffer.from(cred.credentialId, 'base64url'),
        type: 'public-key',
        // Don't trust client-provided transports, use secure defaults
        transports: ['internal', 'usb', 'nfc', 'ble']
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform' // Prefer platform authenticators (Face ID, Touch ID, Windows Hello)
      },
      supportedAlgorithmIDs: [-7, -257] // ES256 and RS256
    });

    // Store the challenge
    await storage.createAuthChallenge({
      challenge: options.challenge,
      type: 'webauthn_register',
      userId,
      expiresAt: new Date(Date.now() + 60000), // 1 minute
      data: { options }
    });

    return options;
  }

  static async verifyRegistration(userId: string, response: any) {
    // Get the stored challenge from the clientDataJSON
    const clientDataJSON = JSON.parse(Buffer.from(response.response.clientDataJSON, 'base64').toString());
    const challengeRecord = await storage.getAuthChallenge(clientDataJSON.challenge);
    if (!challengeRecord || challengeRecord.userId !== userId) {
      throw new Error('Invalid challenge');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true
    });

    if (verification.verified && verification.registrationInfo) {
      const regInfo = verification.registrationInfo;

      // Store the new credential
      const credentialId = Buffer.from(regInfo.credentialID).toString('base64url');
      await storage.createWebauthnCredential({
        userId,
        credentialId,
        publicKey: Buffer.from(regInfo.credentialPublicKey).toString('base64'),
        counter: regInfo.counter,
        aaguid: regInfo.aaguid ? Buffer.from(regInfo.aaguid).toString('hex') : null,
        deviceType: 'platform', // Assume platform for biometric auth
        transports: ['internal'], // Don't trust client transports
        displayName: `${regInfo.userVerified ? 'Biometric' : 'Security Key'} Authentication`
      });

      // Mark challenge as used
      await storage.markChallengeUsed(challengeRecord.challenge);

      return { verified: true, credentialId };
    }

    return { verified: false };
  }

  static async generateAuthenticationOptions(userId?: string) {
    let allowCredentials: { id: string, type: 'public-key', transports?: string[] }[] = [];

    if (userId) {
      const userCredentials = await storage.getWebauthnCredentials(userId);
      allowCredentials = userCredentials.map(cred => ({
        id: Buffer.from(cred.credentialId, 'base64url'),
        type: 'public-key' as const,
        transports: ['internal', 'usb', 'nfc', 'ble'] // Use secure defaults
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      timeout: 60000,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      userVerification: 'preferred'
    });

    // Store the challenge
    await storage.createAuthChallenge({
      challenge: options.challenge,
      type: 'webauthn_auth',
      userId,
      expiresAt: new Date(Date.now() + 60000), // 1 minute
      data: { options }
    });

    return options;
  }

  static async verifyAuthentication(userId: string | undefined, response: any) {
    const clientDataJSON = JSON.parse(Buffer.from(response.response.clientDataJSON, 'base64').toString());
    const challengeRecord = await storage.getAuthChallenge(clientDataJSON.challenge);
    if (!challengeRecord) {
      throw new Error('Invalid challenge');
    }

    // Get the credential from the response  
    const credentialId = Buffer.from(response.rawId).toString('base64url');
    const credential = await storage.getWebauthnCredentialByCredentialId(credentialId);
    
    if (!credential) {
      throw new Error('Credential not found');
    }

    // If userId is provided, verify it matches the credential
    if (userId && credential.userId !== userId) {
      throw new Error('Credential does not belong to user');
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: Buffer.from(credential.credentialId, 'base64url'),
        publicKey: Buffer.from(credential.publicKey, 'base64'),
        counter: credential.counter
      },
      requireUserVerification: true
    });

    if (verification.verified) {
      // Update counter
      await storage.updateWebauthnCredentialCounter(credentialId, verification.authenticationInfo.newCounter);
      
      // Mark challenge as used
      await storage.markChallengeUsed(challengeRecord.challenge);

      return { 
        verified: true, 
        userId: credential.userId,
        credentialId,
        authenticationInfo: verification.authenticationInfo
      };
    }

    return { verified: false };
  }

  static async getCredentialsForUser(userId: string) {
    const credentials = await storage.getWebauthnCredentials(userId);
    
    return credentials.map(cred => ({
      id: cred.id,
      credentialId: cred.credentialId,
      displayName: cred.displayName,
      deviceType: cred.deviceType,
      transports: cred.transports,
      createdAt: cred.createdAt,
      lastUsed: cred.lastUsed
    }));
  }

  static async deleteCredential(userId: string, credentialId: string): Promise<boolean> {
    const credential = await storage.getWebauthnCredentialByCredentialId(credentialId);
    if (!credential || credential.userId !== userId) {
      return false;
    }

    return await storage.deleteWebauthnCredential(credentialId);
  }
}