import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  targetUrl: text("target_url").notNull(),
  corsEnabled: boolean("cors_enabled").default(true),
  autoExecute: boolean("auto_execute").default(true),
  customHeaders: text("custom_headers").default("[]"), // JSON string of header objects
  customScript: text("custom_script").default(""), // Custom JavaScript code
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLogSchema = createInsertSchema(logs).pick({
  level: true,
  message: true,
});

export const insertConfigSchema = createInsertSchema(configurations).pick({
  targetUrl: true,
  corsEnabled: true,
  autoExecute: true,
  customHeaders: true,
  customScript: true,
});

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertConfig = z.infer<typeof insertConfigSchema>;
export type Config = typeof configurations.$inferSelect;

// User schema (keeping existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
