import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  masterPasswordHash: text("master_password_hash").notNull(),
  userKey: text("user_key").notNull(),
  zkProof: text("zk_proof").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vaultEntries = pgTable("vault_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  url: text("url"),
  username: text("username"),
  password: text("password"),
  type: text("type").notNull(), // "login" or "payment"
  twoFA: text("two_fa"),
  cardNumber: text("card_number"),
  expiryDate: text("expiry_date"),
  cvv: text("cvv"),
  encryptedData: text("encrypted_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const securityLogs = pgTable("security_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  masterPasswordHash: true,
  userKey: true,
  zkProof: true,
});

export const insertVaultEntrySchema = createInsertSchema(vaultEntries).pick({
  name: true,
  url: true,
  username: true,
  password: true,
  type: true,
  twoFA: true,
  cardNumber: true,
  expiryDate: true,
  cvv: true,
  encryptedData: true,
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).pick({
  message: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VaultEntry = typeof vaultEntries.$inferSelect;
export type InsertVaultEntry = z.infer<typeof insertVaultEntrySchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;