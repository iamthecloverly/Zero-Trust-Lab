import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { policyEngine } from "./policy-engine";
import type { SimulationResponse } from "@shared/schema";
import { createRateLimiter } from "./middleware/rate-limiter";

// Rate limiters
const generalLimiter = createRateLimiter(60000, 100); // 100 requests per minute
const simulationLimiter = createRateLimiter(60000, 30); // 30 simulations per minute
const mfaLimiter = createRateLimiter(60000, 10); // 10 MFA attempts per minute

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply general rate limiting to all API routes
  app.use('/api', generalLimiter);
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error fetching users' });
    }
  });

  app.get("/api/devices", async (_req, res) => {
    try {
      const devices = await storage.getDevices();
      res.json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ error: 'Internal server error fetching devices' });
    }
  });

  app.get("/api/connections", async (_req, res) => {
    try {
      const connections = await storage.getConnections();
      res.json(connections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      res.status(500).json({ error: 'Internal server error fetching connections' });
    }
  });

  app.get("/api/policies", async (_req, res) => {
    try {
      const policies = await storage.getPolicies();
      res.json(policies);
    } catch (error) {
      console.error('Error fetching policies:', error);
      res.status(500).json({ error: 'Internal server error fetching policies' });
    }
  });

  app.patch("/api/policies/:id", async (req, res) => {
    try {
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
    } catch (error) {
      console.error('Error updating policy:', error);
      res.status(500).json({ error: 'Internal server error updating policy' });
    }
  });

  app.post("/api/simulate", simulationLimiter, async (req, res) => {
    try {
      const { userId, deviceId, action } = req.body;

      if (!userId || !deviceId || !action) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate input types and sanitize
      if (typeof userId !== 'string' || typeof deviceId !== 'string' || typeof action !== 'string') {
        return res.status(400).json({ error: "Invalid input types" });
      }

      if (userId.length > 100 || deviceId.length > 100 || action.length > 100) {
        return res.status(400).json({ error: "Input too long" });
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
    } catch (error) {
      console.error('Error in simulation:', error);
      res.status(500).json({ error: 'Internal server error during simulation' });
    }
  });

  app.get("/api/network/graph", async (_req, res) => {
    try {
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
    } catch (error) {
      console.error('Error building network graph:', error);
      res.status(500).json({ error: 'Internal server error building graph' });
    }
  });

  app.post("/api/network/reset", async (_req, res) => {
    try {
      await storage.clearConnections();
      res.json({ success: true });
    } catch (error) {
      console.error('Error resetting network:', error);
      res.status(500).json({ error: 'Internal server error resetting network' });
    }
  });

  app.post("/api/verify-mfa", mfaLimiter, async (req, res) => {
    try {
      const { connectionId, code } = req.body;

      if (!connectionId || !code) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate input types
      if (typeof connectionId !== 'string' || typeof code !== 'string') {
        return res.status(400).json({ error: "Invalid input types" });
      }

      // Validate code format (should be 6 digits)
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: "Invalid code format" });
      }

      const connection = await storage.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      if (!connection.mfaChallenged) {
        return res.status(400).json({ error: "MFA not required for this connection" });
      }

      // In production, this should verify against a real MFA service
      // For demo purposes, accepting "123456" or "000000"
      const verified = code === "123456" || code === "000000";
      const updated = await storage.updateConnectionMFA(connectionId, verified);

      res.json({
        verified,
        connection: updated,
      });
    } catch (error) {
      console.error('Error in MFA verification:', error);
      res.status(500).json({ error: 'Internal server error during MFA verification' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
