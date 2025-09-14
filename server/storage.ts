import { 
  type User, type InsertUser, 
  type VaultEntry, type InsertVaultEntry, 
  type SecurityLog, type InsertSecurityLog,
  type WebauthnCredential, type InsertWebauthnCredential,
  type AuthSession, type InsertAuthSession,
  type DeviceFingerprint, type InsertDeviceFingerprint,
  type AuthChallenge, type InsertAuthChallenge,
  type PushToken, type InsertPushToken,
  type MfaChallenge, type InsertMfaChallenge
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vault entry operations
  getVaultEntries(userId: string): Promise<VaultEntry[]>;
  getVaultEntry(id: string): Promise<VaultEntry | undefined>;
  createVaultEntry(entry: InsertVaultEntry & { userId: string }): Promise<VaultEntry>;
  updateVaultEntry(id: string, entry: Partial<InsertVaultEntry>): Promise<VaultEntry | undefined>;
  deleteVaultEntry(id: string): Promise<boolean>;
  
  // Security log operations
  getSecurityLogs(userId: string): Promise<SecurityLog[]>;
  createSecurityLog(log: InsertSecurityLog & { userId: string }): Promise<SecurityLog>;

  // WebAuthn credential operations
  getWebauthnCredentials(userId: string): Promise<WebauthnCredential[]>;
  getWebauthnCredentialByCredentialId(credentialId: string): Promise<WebauthnCredential | undefined>;
  createWebauthnCredential(credential: InsertWebauthnCredential & { userId: string }): Promise<WebauthnCredential>;
  updateWebauthnCredentialCounter(credentialId: string, counter: number): Promise<boolean>;
  deleteWebauthnCredential(credentialId: string): Promise<boolean>;

  // Authentication session operations
  getAuthSession(sessionToken: string): Promise<AuthSession | undefined>;
  getAuthSessionBySessionId(sessionId: string): Promise<AuthSession | undefined>;
  getAuthSessionsByUser(userId: string): Promise<AuthSession[]>;
  createAuthSession(session: InsertAuthSession & { userId: string }): Promise<AuthSession>;
  updateAuthSession(sessionToken: string, updates: Partial<InsertAuthSession>): Promise<AuthSession | undefined>;
  deactivateAuthSession(sessionToken: string): Promise<boolean>;
  deactivateAuthSessionBySessionId(sessionId: string): Promise<boolean>;
  deactivateAllUserSessions(userId: string): Promise<boolean>;

  // Device fingerprint operations
  getDeviceFingerprint(fingerprint: string): Promise<DeviceFingerprint | undefined>;
  getDeviceFingerprints(userId?: string): Promise<DeviceFingerprint[]>;
  createDeviceFingerprint(device: InsertDeviceFingerprint & { userId?: string }): Promise<DeviceFingerprint>;
  updateDeviceFingerprint(fingerprint: string, updates: Partial<InsertDeviceFingerprint>): Promise<DeviceFingerprint | undefined>;

  // Authentication challenge operations
  getAuthChallenge(challenge: string): Promise<AuthChallenge | undefined>;
  createAuthChallenge(challenge: InsertAuthChallenge & { userId?: string }): Promise<AuthChallenge>;
  markChallengeUsed(challenge: string): Promise<boolean>;
  cleanupExpiredChallenges(): Promise<number>;

  // Push token operations
  getPushTokens(userId: string): Promise<PushToken[]>;
  createPushToken(token: InsertPushToken & { userId: string }): Promise<PushToken>;
  deactivatePushToken(token: string): Promise<boolean>;

  // MFA challenge operations
  getMfaChallenge(challengeCode: string): Promise<MfaChallenge | undefined>;
  createMfaChallenge(challenge: InsertMfaChallenge & { userId: string }): Promise<MfaChallenge>;
  approveMfaChallenge(challengeCode: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vaultEntries: Map<string, VaultEntry>;
  private securityLogs: Map<string, SecurityLog>;
  private webauthnCredentials: Map<string, WebauthnCredential>;
  private authSessions: Map<string, AuthSession>;
  private deviceFingerprints: Map<string, DeviceFingerprint>;
  private authChallenges: Map<string, AuthChallenge>;
  private pushTokens: Map<string, PushToken>;
  private mfaChallenges: Map<string, MfaChallenge>;

  constructor() {
    this.users = new Map();
    this.vaultEntries = new Map();
    this.securityLogs = new Map();
    this.webauthnCredentials = new Map();
    this.authSessions = new Map();
    this.deviceFingerprints = new Map();
    this.authChallenges = new Map();
    this.pushTokens = new Map();
    this.mfaChallenges = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username, // Use email as username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Vault entry operations
  async getVaultEntries(userId: string): Promise<VaultEntry[]> {
    return Array.from(this.vaultEntries.values()).filter(
      (entry) => entry.userId === userId
    );
  }

  async getVaultEntry(id: string): Promise<VaultEntry | undefined> {
    return this.vaultEntries.get(id);
  }

  async createVaultEntry(entry: InsertVaultEntry & { userId: string }): Promise<VaultEntry> {
    const id = randomUUID();
    const vaultEntry: VaultEntry = { 
      ...entry,
      id, 
      userId: entry.userId,
      createdAt: new Date(), 
      updatedAt: new Date()
      // Remove all plaintext fields - they don't exist in the zero-trust schema
      // All sensitive data is encrypted in the encryptedData field
    };
    this.vaultEntries.set(id, vaultEntry);
    return vaultEntry;
  }

  async updateVaultEntry(id: string, entry: Partial<InsertVaultEntry>): Promise<VaultEntry | undefined> {
    const existing = this.vaultEntries.get(id);
    if (!existing) return undefined;
    
    const updated: VaultEntry = { 
      ...existing, 
      ...entry, 
      updatedAt: new Date() 
    };
    this.vaultEntries.set(id, updated);
    return updated;
  }

  async deleteVaultEntry(id: string): Promise<boolean> {
    return this.vaultEntries.delete(id);
  }

  // Security log operations
  async getSecurityLogs(userId: string): Promise<SecurityLog[]> {
    return Array.from(this.securityLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async createSecurityLog(log: InsertSecurityLog & { userId: string }): Promise<SecurityLog> {
    const id = randomUUID();
    const securityLog: SecurityLog = { 
      ...log, 
      id, 
      timestamp: new Date() 
    };
    this.securityLogs.set(id, securityLog);
    return securityLog;
  }

  // WebAuthn credential operations
  async getWebauthnCredentials(userId: string): Promise<WebauthnCredential[]> {
    return Array.from(this.webauthnCredentials.values()).filter(
      (credential) => credential.userId === userId
    );
  }

  async getWebauthnCredentialByCredentialId(credentialId: string): Promise<WebauthnCredential | undefined> {
    return Array.from(this.webauthnCredentials.values()).find(
      (credential) => credential.credentialId === credentialId
    );
  }

  async createWebauthnCredential(credential: InsertWebauthnCredential & { userId: string }): Promise<WebauthnCredential> {
    const id = randomUUID();
    const webauthnCredential: WebauthnCredential = { 
      ...credential, 
      id, 
      counter: credential.counter || 0,
      aaguid: credential.aaguid || null,
      createdAt: new Date(),
      lastUsed: new Date() 
    };
    this.webauthnCredentials.set(id, webauthnCredential);
    return webauthnCredential;
  }

  async updateWebauthnCredentialCounter(credentialId: string, counter: number): Promise<boolean> {
    const credential = await this.getWebauthnCredentialByCredentialId(credentialId);
    if (!credential) return false;
    
    const updated = { ...credential, counter, lastUsed: new Date() };
    this.webauthnCredentials.set(credential.id, updated);
    return true;
  }

  async deleteWebauthnCredential(credentialId: string): Promise<boolean> {
    const credential = await this.getWebauthnCredentialByCredentialId(credentialId);
    if (!credential) return false;
    
    return this.webauthnCredentials.delete(credential.id);
  }

  // Authentication session operations
  async getAuthSession(sessionToken: string): Promise<AuthSession | undefined> {
    return Array.from(this.authSessions.values()).find(
      (session) => session.sessionToken === sessionToken && session.isActive
    );
  }

  async getAuthSessionBySessionId(sessionId: string): Promise<AuthSession | undefined> {
    return Array.from(this.authSessions.values()).find(
      (session) => session.id === sessionId && session.isActive
    );
  }

  async getAuthSessionsByUser(userId: string): Promise<AuthSession[]> {
    return Array.from(this.authSessions.values()).filter(
      (session) => session.userId === userId && session.isActive
    );
  }

  async createAuthSession(session: InsertAuthSession & { userId: string }): Promise<AuthSession> {
    const id = randomUUID();
    const authSession: AuthSession = { 
      ...session, 
      id, 
      riskScore: session.riskScore || 0,
      isActive: true,
      createdAt: new Date() 
    };
    this.authSessions.set(id, authSession);
    return authSession;
  }

  async updateAuthSession(sessionToken: string, updates: Partial<InsertAuthSession>): Promise<AuthSession | undefined> {
    const session = await this.getAuthSession(sessionToken);
    if (!session) return undefined;
    
    const updated: AuthSession = { ...session, ...updates };
    this.authSessions.set(session.id, updated);
    return updated;
  }

  async deactivateAuthSession(sessionToken: string): Promise<boolean> {
    const session = await this.getAuthSession(sessionToken);
    if (!session) return false;
    
    const updated = { ...session, isActive: false };
    this.authSessions.set(session.id, updated);
    return true;
  }

  async deactivateAuthSessionBySessionId(sessionId: string): Promise<boolean> {
    const session = await this.getAuthSessionBySessionId(sessionId);
    if (!session) return false;
    
    const updated = { ...session, isActive: false };
    this.authSessions.set(session.id, updated);
    return true;
  }

  async deactivateAllUserSessions(userId: string): Promise<boolean> {
    const sessions = await this.getAuthSessionsByUser(userId);
    sessions.forEach(session => {
      const updated = { ...session, isActive: false };
      this.authSessions.set(session.id, updated);
    });
    return true;
  }

  // Device fingerprint operations
  async getDeviceFingerprint(fingerprint: string): Promise<DeviceFingerprint | undefined> {
    return this.deviceFingerprints.get(fingerprint);
  }

  async getDeviceFingerprints(userId?: string): Promise<DeviceFingerprint[]> {
    if (userId) {
      return Array.from(this.deviceFingerprints.values()).filter(
        (device) => device.userId === userId
      );
    }
    return Array.from(this.deviceFingerprints.values());
  }

  async createDeviceFingerprint(device: InsertDeviceFingerprint & { userId?: string }): Promise<DeviceFingerprint> {
    const id = randomUUID();
    const deviceFingerprint: DeviceFingerprint = { 
      ...device, 
      id,
      platform: device.platform || null,
      browser: device.browser || null,
      screenResolution: device.screenResolution || null,
      timezone: device.timezone || null,
      language: device.language || null,
      riskScore: device.riskScore || 50,
      isTrusted: false,
      firstSeen: new Date(),
      lastSeen: new Date(),
      loginCount: 0,
      userId: device.userId ?? null
    };
    this.deviceFingerprints.set(device.fingerprint, deviceFingerprint);
    return deviceFingerprint;
  }

  async updateDeviceFingerprint(fingerprint: string, updates: Partial<InsertDeviceFingerprint>): Promise<DeviceFingerprint | undefined> {
    const device = this.deviceFingerprints.get(fingerprint);
    if (!device) return undefined;
    
    const updated: DeviceFingerprint = { 
      ...device, 
      ...updates, 
      lastSeen: new Date(),
      loginCount: device.loginCount + 1
    };
    this.deviceFingerprints.set(fingerprint, updated);
    return updated;
  }

  // Authentication challenge operations
  async getAuthChallenge(challenge: string): Promise<AuthChallenge | undefined> {
    const authChallenge = this.authChallenges.get(challenge);
    if (authChallenge && authChallenge.expiresAt > new Date() && !authChallenge.isUsed) {
      return authChallenge;
    }
    return undefined;
  }

  async createAuthChallenge(challenge: InsertAuthChallenge & { userId?: string }): Promise<AuthChallenge> {
    const id = randomUUID();
    const authChallenge: AuthChallenge = { 
      ...challenge, 
      id,
      data: challenge.data || null,
      isUsed: false,
      userId: challenge.userId ?? null,
      createdAt: new Date() 
    };
    this.authChallenges.set(challenge.challenge, authChallenge);
    return authChallenge;
  }

  async markChallengeUsed(challenge: string): Promise<boolean> {
    const authChallenge = this.authChallenges.get(challenge);
    if (!authChallenge) return false;
    
    const updated = { ...authChallenge, isUsed: true };
    this.authChallenges.set(challenge, updated);
    return true;
  }

  async cleanupExpiredChallenges(): Promise<number> {
    const now = new Date();
    let deleted = 0;
    
    const entries = Array.from(this.authChallenges.entries());
    for (const [key, challenge] of entries) {
      if (challenge.expiresAt <= now) {
        this.authChallenges.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  // Push token operations
  async getPushTokens(userId: string): Promise<PushToken[]> {
    return Array.from(this.pushTokens.values()).filter(
      (token) => token.userId === userId && token.isActive
    );
  }

  async createPushToken(token: InsertPushToken & { userId: string }): Promise<PushToken> {
    const id = randomUUID();
    const pushToken: PushToken = { 
      ...token, 
      id, 
      deviceName: token.deviceName || null,
      isActive: true,
      createdAt: new Date(),
      lastUsed: new Date() 
    };
    this.pushTokens.set(token.token, pushToken);
    return pushToken;
  }

  async deactivatePushToken(token: string): Promise<boolean> {
    const pushToken = this.pushTokens.get(token);
    if (!pushToken) return false;
    
    const updated = { ...pushToken, isActive: false };
    this.pushTokens.set(token, updated);
    return true;
  }

  // MFA challenge operations
  async getMfaChallenge(challengeCode: string): Promise<MfaChallenge | undefined> {
    const challenge = this.mfaChallenges.get(challengeCode);
    if (challenge && challenge.expiresAt > new Date()) {
      return challenge;
    }
    return undefined;
  }

  async createMfaChallenge(challenge: InsertMfaChallenge & { userId: string }): Promise<MfaChallenge> {
    const id = randomUUID();
    const mfaChallenge: MfaChallenge = { 
      ...challenge, 
      id, 
      isApproved: null,
      approvedAt: null,
      createdAt: new Date() 
    };
    this.mfaChallenges.set(challenge.challengeCode, mfaChallenge);
    return mfaChallenge;
  }

  async approveMfaChallenge(challengeCode: string): Promise<boolean> {
    const challenge = this.mfaChallenges.get(challengeCode);
    if (!challenge || challenge.expiresAt <= new Date()) return false;
    
    const updated = { ...challenge, isApproved: true, approvedAt: new Date() };
    this.mfaChallenges.set(challengeCode, updated);
    return true;
  }
}

export const storage = new MemStorage();
