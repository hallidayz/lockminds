import { type User, type InsertUser, type VaultEntry, type InsertVaultEntry, type SecurityLog, type InsertSecurityLog } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vaultEntries: Map<string, VaultEntry>;
  private securityLogs: Map<string, SecurityLog>;

  constructor() {
    this.users = new Map();
    this.vaultEntries = new Map();
    this.securityLogs = new Map();
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
      createdAt: new Date(), 
      updatedAt: new Date(),
      // Ensure null instead of undefined for optional fields
      url: entry.url ?? null,
      username: entry.username ?? null,
      password: entry.password ?? null,
      twoFA: entry.twoFA ?? null,
      cardNumber: entry.cardNumber ?? null,
      expiryDate: entry.expiryDate ?? null,
      cvv: entry.cvv ?? null
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
}

export const storage = new MemStorage();
