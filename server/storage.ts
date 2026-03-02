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
} from "../shared/schema";
import { randomUUID } from "crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { SAMPLE_USERS, SAMPLE_DEVICES, SAMPLE_POLICIES } from "./constants";

type StorageInterface = {
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
  close?(): Promise<void>;
};

/** In-memory storage for development and Vercel deployments */
function createMemStorage(): StorageInterface {
  const users_ = new Map<string, User>();
  const devices_ = new Map<string, Device>();
  const connections_ = new Map<string, Connection>();
  const policies_ = new Map<string, Policy>();

  // Initialize sample data
  for (const user of SAMPLE_USERS) {
    const newUser: User = { ...user, mfaEnabled: user.mfaEnabled ?? false };
    users_.set(newUser.id, newUser);
  }
  for (const device of SAMPLE_DEVICES) {
    const newDevice: Device = { ...device, verified: device.verified ?? false };
    devices_.set(newDevice.id, newDevice);
  }
  for (const policy of SAMPLE_POLICIES) {
    const id = randomUUID();
    const newPolicy: Policy = { ...policy, id, enabled: policy.enabled ?? true };
    policies_.set(id, newPolicy);
  }

  return {
    getUsers: () => Promise.resolve(Array.from(users_.values())),
    getUser: (id: string) => Promise.resolve(users_.get(id)),
    createUser: (user: InsertUser) => {
      const newUser: User = { ...user, mfaEnabled: user.mfaEnabled ?? false };
      users_.set(newUser.id, newUser);
      return Promise.resolve(newUser);
    },

    getDevices: () => Promise.resolve(Array.from(devices_.values())),
    getDevice: (id: string) => Promise.resolve(devices_.get(id)),
    createDevice: (device: InsertDevice) => {
      const newDevice: Device = { ...device, verified: device.verified ?? false };
      devices_.set(newDevice.id, newDevice);
      return Promise.resolve(newDevice);
    },

    getConnections: () => Promise.resolve(Array.from(connections_.values())),
    getConnection: (id: string) => Promise.resolve(connections_.get(id)),
    createConnection: (connection: InsertConnection) => {
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
      connections_.set(id, newConnection);
      return Promise.resolve(newConnection);
    },
    updateConnectionMFA: (id: string, verified: boolean) => {
      const connection = connections_.get(id);
      if (!connection) return Promise.resolve(undefined);
      const updated: Connection = { ...connection, mfaVerified: verified };
      connections_.set(id, updated);
      return Promise.resolve({ ...updated });
    },
    clearConnections: () => {
      connections_.clear();
      return Promise.resolve();
    },

    getPolicies: () => Promise.resolve(Array.from(policies_.values())),
    getPolicy: (id: string) => Promise.resolve(policies_.get(id)),
    updatePolicy: (id: string, enabled: boolean) => {
      const policy = policies_.get(id);
      if (!policy) return Promise.resolve(undefined);
      const updated: Policy = { ...policy, enabled };
      policies_.set(id, updated);
      return Promise.resolve({ ...updated });
    },
    createPolicy: (policy: InsertPolicy) => {
      const id = randomUUID();
      const newPolicy: Policy = { ...policy, id, enabled: policy.enabled ?? true };
      policies_.set(id, newPolicy);
      return Promise.resolve(newPolicy);
    },
  };
}

/** Database storage using Postgres and Drizzle ORM */
function createDbStorage(): StorageInterface {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  return {
    getUsers: () => db.select().from(users),
    getUser: (id: string) => db.select().from(users).where(eq(users.id, id)).then((r) => r[0]),
    createUser: (user: InsertUser) => db.insert(users).values(user).returning().then((r) => r[0]),

    getDevices: () => db.select().from(devices),
    getDevice: (id: string) => db.select().from(devices).where(eq(devices.id, id)).then((r) => r[0]),
    createDevice: (device: InsertDevice) => db.insert(devices).values(device).returning().then((r) => r[0]),

    getConnections: () => db.select().from(connections),
    getConnection: (id: string) => db.select().from(connections).where(eq(connections.id, id)).then((r) => r[0]),
    createConnection: (connection: InsertConnection) => {
      const id = randomUUID();
      const timestamp = new Date().toISOString();
      const mfaChallenged = connection.verdict === "CHALLENGE_MFA";
      const newConnection = { ...connection, id, timestamp, mfaChallenged, mfaVerified: null };
      return db.insert(connections).values(newConnection).returning().then((r) => r[0]);
    },
    updateConnectionMFA: (id: string, verified: boolean) =>
      db.update(connections).set({ mfaVerified: verified }).where(eq(connections.id, id)).returning().then((r) => r[0]),
    clearConnections: () => db.delete(connections).then(() => {}),

    getPolicies: () => db.select().from(policies),
    getPolicy: (id: string) => db.select().from(policies).where(eq(policies.id, id)).then((r) => r[0]),
    updatePolicy: (id: string, enabled: boolean) =>
      db.update(policies).set({ enabled }).where(eq(policies.id, id)).returning().then((r) => r[0]),
    createPolicy: (policy: InsertPolicy) => {
      const id = randomUUID();
      const newPolicy = { ...policy, id };
      return db.insert(policies).values(newPolicy).returning().then((r) => r[0]);
    },

    close: () => client.end(),
  };
}
let storage: StorageInterface;
let dbClient: StorageInterface | null = null;

try {
  const useDatabase = process.env.DATABASE_URL && process.env.USE_DATABASE === "true";
  if (useDatabase) {
    console.log("Using database storage with DATABASE_URL");
    dbClient = createDbStorage();
    storage = dbClient;
  } else {
    console.log("Using in-memory storage");
    storage = createMemStorage();
  }
} catch (error) {
  console.warn("Failed to initialize database storage, falling back to in-memory storage:", error);
  storage = createMemStorage();
}

export { storage };

// Gracefully close DB connection pool on process exit
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("SIGTERM", async () => {
    if (dbClient && "close" in dbClient) {
      await (dbClient as { close(): Promise<void> }).close();
    }
  });
}
