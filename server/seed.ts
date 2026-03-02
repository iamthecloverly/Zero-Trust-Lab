import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, devices, policies } from "../shared/schema";
import { randomUUID } from "crypto";
import { SAMPLE_USERS, SAMPLE_DEVICES, SAMPLE_POLICIES } from "./constants";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  const samplePoliciesWithIds = SAMPLE_POLICIES.map(p => ({
    ...p,
    id: randomUUID(),
  }));

  try {
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("Inserting users...");
      await db.insert(users).values(SAMPLE_USERS);
    } else {
      console.log("Users already exist, skipping...");
    }

    const existingDevices = await db.select().from(devices);
    if (existingDevices.length === 0) {
      console.log("Inserting devices...");
      await db.insert(devices).values(SAMPLE_DEVICES);
    } else {
      console.log("Devices already exist, skipping...");
    }

    const existingPolicies = await db.select().from(policies);
    if (existingPolicies.length === 0) {
      console.log("Inserting policies...");
      await db.insert(policies).values(samplePoliciesWithIds);
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
