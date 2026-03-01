import {
  type User,
  type Device,
  type Connection,
  type Policy,
  type InsertUser,
  type InsertDevice,
  type InsertConnection,
  type InsertPolicy,
  users,
  devices,
  connections,
  policies,
} from "@shared/schema";
import { randomUUID } from "crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  
  getConnections(): Promise<Connection[]>;
  getConnection(id: string): Promise<Connection | undefined>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionMFA(id: string, verified: boolean): Promise<Connection | undefined>;
  clearConnections(): Promise<void>;
  
  getPolicies(): Promise<Policy[]>;
  getPolicy(id: string): Promise<Policy | undefined>;
  updatePolicy(id: string, enabled: boolean): Promise<Policy | undefined>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private devices: Map<string, Device>;
  private connections: Map<string, Connection>;
  private policies: Map<string, Policy>;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.connections = new Map();
    this.policies = new Map();
    
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleUsers: InsertUser[] = [
      { id: "U1-Admin", role: "Admin", mfaEnabled: true },
      { id: "U2-Engineer", role: "Engineer", mfaEnabled: true },
      { id: "U3-Contractor", role: "Contractor", mfaEnabled: false },
      { id: "U4-Intern", role: "Intern", mfaEnabled: false },
    ];

    const sampleDevices: InsertDevice[] = [
      { id: "D1-Laptop", type: "Laptop", location: "US", verified: true },
      { id: "D2-Server", type: "Server", location: "US", verified: true },
      { id: "D3-Mobile", type: "Mobile", location: "CA", verified: false },
      { id: "D4-Desktop", type: "Desktop", location: "IN", verified: false },
      { id: "D5-Tablet", type: "Tablet", location: "UK", verified: true },
    ];

    const samplePolicies: InsertPolicy[] = [
      { name: "Require MFA for All Users", enabled: true, type: "mfa" },
      { name: "Enforce Device Verification", enabled: true, type: "device" },
      { name: "Restrict Access to US/CA Only", enabled: true, type: "geo" },
      { name: "Admin Role Required for Servers", enabled: true, type: "role" },
    ];

    for (const user of sampleUsers) {
      const newUser: User = { ...user, mfaEnabled: user.mfaEnabled ?? false };
      this.users.set(newUser.id, newUser);
    }

    for (const device of sampleDevices) {
      const newDevice: Device = { ...device, verified: device.verified ?? false };
      this.devices.set(newDevice.id, newDevice);
    }

    for (const policy of samplePolicies) {
      const id = randomUUID();
      const newPolicy: Policy = { ...policy, id, enabled: policy.enabled ?? true };
      this.policies.set(id, newPolicy);
    }
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      mfaEnabled: user.mfaEnabled ?? false,
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: string): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const newDevice: Device = {
      ...device,
      verified: device.verified ?? false,
    };
    this.devices.set(newDevice.id, newDevice);
    return newDevice;
  }

  async getConnections(): Promise<Connection[]> {
    return Array.from(this.connections.values());
  }

  async getConnection(id: string): Promise<Connection | undefined> {
    return this.connections.get(id);
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const mfaChallenged = connection.verdict === "CHALLENGE_MFA";
    const newConnection: Connection = {
      ...connection,
      id,
      timestamp,
      mfaChallenged,
      mfaVerified: null,
    };
    this.connections.set(id, newConnection);
    return newConnection;
  }

  async updateConnectionMFA(id: string, verified: boolean): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;

    const updated: Connection = { ...connection, mfaVerified: verified };
    this.connections.set(id, updated);
    return { ...updated };
  }

  async clearConnections(): Promise<void> {
    this.connections.clear();
  }

  async getPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values());
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    return this.policies.get(id);
  }

  async updatePolicy(id: string, enabled: boolean): Promise<Policy | undefined> {
    const policy = this.policies.get(id);
    if (!policy) return undefined;

    const updated: Policy = { ...policy, enabled };
    this.policies.set(id, updated);
    return { ...updated };
  }

  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    const id = randomUUID();
    const newPolicy: Policy = {
      ...policy,
      id,
      enabled: policy.enabled ?? true,
    };
    this.policies.set(id, newPolicy);
    return newPolicy;
  }
}

export class DbStorage implements IStorage {
  private db;
  private client;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    this.client = postgres(databaseUrl);
    this.db = drizzle(this.client);
  }

  async close(): Promise<void> {
    await this.client.end();
  }

  async getUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async getDevices(): Promise<Device[]> {
    return await this.db.select().from(devices);
  }

  async getDevice(id: string): Promise<Device | undefined> {
    const result = await this.db.select().from(devices).where(eq(devices.id, id));
    return result[0];
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const result = await this.db.insert(devices).values(device).returning();
    return result[0];
  }

  async getConnections(): Promise<Connection[]> {
    return await this.db.select().from(connections);
  }

  async getConnection(id: string): Promise<Connection | undefined> {
    const result = await this.db.select().from(connections).where(eq(connections.id, id));
    return result[0];
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const mfaChallenged = connection.verdict === "CHALLENGE_MFA";
    const newConnection = {
      ...connection,
      id,
      timestamp,
      mfaChallenged,
      mfaVerified: null,
    };
    const result = await this.db.insert(connections).values(newConnection).returning();
    return result[0];
  }

  async updateConnectionMFA(id: string, verified: boolean): Promise<Connection | undefined> {
    const result = await this.db
      .update(connections)
      .set({ mfaVerified: verified })
      .where(eq(connections.id, id))
      .returning();
    return result[0];
  }

  async clearConnections(): Promise<void> {
    await this.db.delete(connections);
  }

  async getPolicies(): Promise<Policy[]> {
    return await this.db.select().from(policies);
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    const result = await this.db.select().from(policies).where(eq(policies.id, id));
    return result[0];
  }

  async updatePolicy(id: string, enabled: boolean): Promise<Policy | undefined> {
    const result = await this.db
      .update(policies)
      .set({ enabled })
      .where(eq(policies.id, id))
      .returning();
    return result[0];
  }

  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    const id = randomUUID();
    const newPolicy = {
      ...policy,
      id,
    };
    const result = await this.db.insert(policies).values(newPolicy).returning();
    return result[0];
  }
}

// Use DbStorage when DATABASE_URL is set, otherwise fall back to in-memory storage
export const storage: IStorage = process.env.DATABASE_URL
  ? new DbStorage()
  : new MemStorage();

// Gracefully close the DB connection pool on process exit
process.on("SIGTERM", async () => {
  if (storage instanceof DbStorage) {
    await storage.close();
  }
});
