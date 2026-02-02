import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { policyEngine } from "./policy-engine";
import type { SimulationResponse } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/users", async (_req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get("/api/devices", async (_req, res) => {
    const devices = await storage.getDevices();
    res.json(devices);
  });

  app.get("/api/connections", async (_req, res) => {
    const connections = await storage.getConnections();
    res.json(connections);
  });

  app.get("/api/policies", async (_req, res) => {
    const policies = await storage.getPolicies();
    res.json(policies);
  });

  app.patch("/api/policies/:id", async (req, res) => {
    const { id } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "enabled must be a boolean" });
    }

    const policy = await storage.updatePolicy(id, enabled);
    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.json(policy);
  });

  app.post("/api/simulate", async (req, res) => {
    const { userId, deviceId, action } = req.body;

    if (!userId || !deviceId || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await storage.getUser(userId);
    const device = await storage.getDevice(deviceId);

    if (!user || !device) {
      return res.status(404).json({ error: "User or device not found" });
    }

    const policies = await storage.getPolicies();
    const evaluation = policyEngine.evaluateConnection(user, device, action, policies);

    const connection = await storage.createConnection({
      sourceId: userId,
      targetId: deviceId,
      action,
      verdict: evaluation.verdict,
      trustScore: evaluation.trustScore,
    });

    const users = await storage.getUsers();
    const devices = await storage.getDevices();
    const connections = await storage.getConnections();

    const graph = policyEngine.buildNetworkGraph(
      users,
      devices,
      connections.map((c) => ({
        sourceId: c.sourceId,
        targetId: c.targetId,
        verdict: c.verdict,
        trustScore: c.trustScore,
      }))
    );

    const response: SimulationResponse = {
      connection,
      evaluation,
      graph,
    };

    res.json(response);
  });

  app.get("/api/network/graph", async (_req, res) => {
    const users = await storage.getUsers();
    const devices = await storage.getDevices();
    const connections = await storage.getConnections();

    const graph = policyEngine.buildNetworkGraph(
      users,
      devices,
      connections.map((c) => ({
        sourceId: c.sourceId,
        targetId: c.targetId,
        verdict: c.verdict,
        trustScore: c.trustScore,
      }))
    );

    res.json(graph);
  });

  app.post("/api/network/reset", async (_req, res) => {
    await storage.clearConnections();
    res.json({ success: true });
  });

  app.post("/api/verify-mfa", async (req, res) => {
    const { connectionId, code } = req.body;

    if (!connectionId || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const connection = await storage.getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    if (!connection.mfaChallenged) {
      return res.status(400).json({ error: "MFA not required for this connection" });
    }

    const verified = code === "123456";
    const updated = await storage.updateConnectionMFA(connectionId, verified);

    res.json({
      verified,
      connection: updated,
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
