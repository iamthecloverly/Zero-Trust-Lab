import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, devices, policies } from "@shared/schema";
import { randomUUID } from "crypto";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  const sampleUsers = [
    { id: "U1-Admin", role: "Admin", mfaEnabled: true },
    { id: "U2-Engineer", role: "Engineer", mfaEnabled: true },
    { id: "U3-Contractor", role: "Contractor", mfaEnabled: false },
    { id: "U4-Intern", role: "Intern", mfaEnabled: false },
  ];

  const sampleDevices = [
    { id: "D1-Laptop", type: "Laptop", location: "US", verified: true },
    { id: "D2-Server", type: "Server", location: "US", verified: true },
    { id: "D3-Mobile", type: "Mobile", location: "CA", verified: false },
    { id: "D4-Desktop", type: "Desktop", location: "IN", verified: false },
    { id: "D5-Tablet", type: "Tablet", location: "UK", verified: true },
  ];

  const samplePolicies = [
    { id: randomUUID(), name: "Require MFA for All Users", enabled: true, type: "mfa" },
    { id: randomUUID(), name: "Enforce Device Verification", enabled: true, type: "device" },
    { id: randomUUID(), name: "Restrict Access to US/CA Only", enabled: true, type: "geo" },
    { id: randomUUID(), name: "Admin Role Required for Servers", enabled: true, type: "role" },
  ];

  try {
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("Inserting users...");
      await db.insert(users).values(sampleUsers);
    } else {
      console.log("Users already exist, skipping...");
    }

    const existingDevices = await db.select().from(devices);
    if (existingDevices.length === 0) {
      console.log("Inserting devices...");
      await db.insert(devices).values(sampleDevices);
    } else {
      console.log("Devices already exist, skipping...");
    }

    const existingPolicies = await db.select().from(policies);
    if (existingPolicies.length === 0) {
      console.log("Inserting policies...");
      await db.insert(policies).values(samplePolicies);
    } else {
      console.log("Policies already exist, skipping...");
    }

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed();
