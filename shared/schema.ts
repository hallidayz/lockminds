import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  masterPasswordHash: text("master_password_hash").notNull(), // Argon2id hash for verification
  // NOTE: Removed userKey field - was cryptographically weak (32-bit entropy)
  // NOTE: Removed zkProof field - was placeholder, not real zero-knowledge proof
  accountType: text("account_type").notNull().default('free'), // 'free' or 'pro'
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vaultEntries = pgTable("vault_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // "login" or "payment" (not sensitive, for filtering)
  encryptedData: text("encrypted_data").notNull(), // All sensitive data encrypted with AES-GCM
  iv: text("iv").notNull(), // Initialization vector used in encryption
  salt: text("salt").notNull(), // Salt used for PBKDF2 key derivation
  version: text("version").notNull().default('v1'), // Encryption version for future upgrades
  // NOTE: Removed ALL plaintext sensitive fields for zero-trust:
  // name, url, username, password, twoFA, cardNumber, expiryDate, cvv
  // All sensitive data is now encrypted client-side in encryptedData field
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const securityLogs = pgTable("security_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// WebAuthn Credentials for FIDO2/biometric authentication
export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  aaguid: text("aaguid"),
  deviceType: text("device_type").notNull(), // "platform" or "roaming"
  transports: jsonb("transports"), // ["usb", "nfc", "ble", "internal"]
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
});

// Authentication sessions with JWT tokens
export const authSessions = pgTable("auth_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  deviceFingerprint: text("device_fingerprint").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  authMethod: text("auth_method").notNull(), // "password", "webauthn", "biometric", "passwordless"
  riskScore: integer("risk_score").notNull().default(0), // 0-100
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Device fingerprints for risk-based authentication
export const deviceFingerprints = pgTable("device_fingerprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  fingerprint: text("fingerprint").notNull().unique(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  platform: text("platform"),
  browser: text("browser"),
  screenResolution: text("screen_resolution"),
  timezone: text("timezone"),
  language: text("language"),
  isTrusted: boolean("is_trusted").notNull().default(false),
  riskScore: integer("risk_score").notNull().default(50), // 0-100
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  loginCount: integer("login_count").notNull().default(0),
});

// Authentication challenges for WebAuthn and passwordless auth
export const authChallenges = pgTable("auth_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challenge: text("challenge").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // "webauthn_register", "webauthn_auth", "passwordless"
  data: jsonb("data"), // Challenge-specific data
  isUsed: boolean("is_used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Push notification tokens for MFA
export const pushTokens = pgTable("push_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull(), // "ios", "android", "web"
  deviceName: text("device_name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
});

// MFA challenges for push notifications
export const mfaChallenges = pgTable("mfa_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeCode: text("challenge_code").notNull().unique(),
  type: text("type").notNull(), // "push", "totp", "sms"
  isApproved: boolean("is_approved"),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  masterPasswordHash: true,
  // NOTE: Removed userKey and zkProof - were cryptographically insecure
});

export const insertVaultEntrySchema = createInsertSchema(vaultEntries).pick({
  type: true,
  encryptedData: true,
  iv: true,
  salt: true,
  version: true,
  // NOTE: Removed all plaintext fields for zero-trust architecture
  // All sensitive data must be encrypted client-side before storage
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).pick({
  message: true,
});

export const insertWebauthnCredentialSchema = createInsertSchema(webauthnCredentials).pick({
  credentialId: true,
  publicKey: true,
  counter: true,
  aaguid: true,
  deviceType: true,
  transports: true,
  displayName: true,
});

export const insertAuthSessionSchema = createInsertSchema(authSessions).pick({
  sessionToken: true,
  refreshToken: true,
  deviceFingerprint: true,
  ipAddress: true,
  userAgent: true,
  authMethod: true,
  riskScore: true,
  expiresAt: true,
});

export const insertDeviceFingerprintSchema = createInsertSchema(deviceFingerprints).pick({
  fingerprint: true,
  ipAddress: true,
  userAgent: true,
  platform: true,
  browser: true,
  screenResolution: true,
  timezone: true,
  language: true,
  riskScore: true,
});

export const insertAuthChallengeSchema = createInsertSchema(authChallenges).pick({
  challenge: true,
  type: true,
  data: true,
  expiresAt: true,
});

export const insertPushTokenSchema = createInsertSchema(pushTokens).pick({
  token: true,
  platform: true,
  deviceName: true,
});

export const insertMfaChallengeSchema = createInsertSchema(mfaChallenges).pick({
  challengeCode: true,
  type: true,
  expiresAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VaultEntry = typeof vaultEntries.$inferSelect;
export type InsertVaultEntry = z.infer<typeof insertVaultEntrySchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;

export type WebauthnCredential = typeof webauthnCredentials.$inferSelect;
export type InsertWebauthnCredential = z.infer<typeof insertWebauthnCredentialSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;
export type InsertDeviceFingerprint = z.infer<typeof insertDeviceFingerprintSchema>;
export type AuthChallenge = typeof authChallenges.$inferSelect;
export type InsertAuthChallenge = z.infer<typeof insertAuthChallengeSchema>;
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;
export type MfaChallenge = typeof mfaChallenges.$inferSelect;
export type InsertMfaChallenge = z.infer<typeof insertMfaChallengeSchema>;