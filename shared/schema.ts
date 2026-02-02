import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  role: text("role").notNull(),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
});

export const devices = pgTable("devices", {
  id: varchar("id").primaryKey(),
  type: text("type").notNull(),
  location: text("location").notNull(),
  verified: boolean("verified").notNull().default(false),
});

export const connections = pgTable("connections", {
  id: varchar("id").primaryKey(),
  sourceId: varchar("source_id").notNull(),
  targetId: varchar("target_id").notNull(),
  action: text("action").notNull(),
  verdict: text("verdict").notNull(),
  trustScore: integer("trust_score").notNull(),
  timestamp: text("timestamp").notNull(),
  mfaChallenged: boolean("mfa_challenged").notNull().default(false),
  mfaVerified: boolean("mfa_verified"),
});

export const policies = pgTable("policies", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  type: text("type").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertDeviceSchema = createInsertSchema(devices);
export const insertConnectionSchema = createInsertSchema(connections).omit({ 
  id: true, 
  timestamp: true,
  mfaChallenged: true,
  mfaVerified: true
});
export const insertPolicySchema = createInsertSchema(policies).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;

export type NetworkNode = {
  id: string;
  label: string;
  type: "user" | "device";
  color?: string;
  shape?: string;
};

export type NetworkEdge = {
  from: string;
  to: string;
  label?: string;
  color?: string;
  dashes?: boolean;
  width?: number;
};

export type NetworkGraph = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};

export type TrustEvaluation = {
  verdict: "ALLOW" | "CHALLENGE_MFA" | "DENY";
  trustScore: number;
  breakdown: {
    label: string;
    points: number;
    icon: string;
  }[];
};

export type SimulationRequest = {
  userId: string;
  deviceId: string;
  action: string;
};

export type SimulationResponse = {
  connection: Connection;
  evaluation: TrustEvaluation;
  graph: NetworkGraph;
};
