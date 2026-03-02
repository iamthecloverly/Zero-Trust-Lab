import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { policyEngine } from "./policy-engine";
import { computeAnalytics } from "./analytics";
import type { SimulationResponse } from "../shared/schema";
import { createRateLimiter } from "./middleware/rate-limiter";
import { asyncHandler, errorHandler } from "./middleware/error-handler";

const MAX_FIELD_LENGTH = 100;

// Rate limiters
const generalLimiter = createRateLimiter(60000, 100); // 100 requests per minute
const simulationLimiter = createRateLimiter(60000, 30); // 30 simulations per minute
const mfaLimiter = createRateLimiter(60000, 10); // 10 MFA attempts per minute

export async function setupRoutes(app: Express): Promise<void> {
  // Apply general rate limiting to all API routes
  app.use('/api', generalLimiter);

  // Helper: build network graph from current state
  async function buildCurrentNetworkGraph() {
    const users = await storage.getUsers();
    const devices = await storage.getDevices();
    const connections = await storage.getConnections();
    return policyEngine.buildNetworkGraph(
      users,
      devices,
      connections.map((c) => ({
        sourceId: c.sourceId,
        targetId: c.targetId,
        verdict: c.verdict,
        trustScore: c.trustScore,
      }))
    );
  }

  app.get("/api/users", asyncHandler(async (_req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  }));

  app.get("/api/devices", asyncHandler(async (_req, res) => {
    const devices = await storage.getDevices();
    res.json(devices);
  }));

  app.get("/api/connections", asyncHandler(async (_req, res) => {
    const connections = await storage.getConnections();
    res.json(connections);
  }));

  app.get("/api/policies", asyncHandler(async (_req, res) => {
    const policies = await storage.getPolicies();
    res.json(policies);
  }));

  app.patch("/api/policies/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id.length > MAX_FIELD_LENGTH) return res.status(400).json({ error: "Invalid id" });
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "enabled must be a boolean" });
    }

    const policy = await storage.updatePolicy(id, enabled);
    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.json(policy);
  }));

  app.post("/api/simulate", simulationLimiter, asyncHandler(async (req, res) => {
    const { userId, deviceId, action } = req.body;

    if (!userId || !deviceId || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate input types and sanitize
    if (typeof userId !== 'string' || typeof deviceId !== 'string' || typeof action !== 'string') {
      return res.status(400).json({ error: "Invalid input types" });
    }

    if (!userId.trim() || !deviceId.trim() || !action.trim()) {
      return res.status(400).json({ error: "Fields must not be blank" });
    }

    if (userId.length > MAX_FIELD_LENGTH || deviceId.length > MAX_FIELD_LENGTH || action.length > MAX_FIELD_LENGTH) {
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

    const graph = await buildCurrentNetworkGraph();

    const response: SimulationResponse = {
      connection,
      evaluation,
      graph,
    };

    res.json(response);
  }));

  app.get("/api/network/graph", asyncHandler(async (_req, res) => {
    const graph = await buildCurrentNetworkGraph();
    res.json(graph);
  }));

  app.post("/api/network/reset", asyncHandler(async (_req, res) => {
    await storage.clearConnections();
    res.json({ success: true });
  }));

  app.get("/api/policies/:id", asyncHandler(async (req, res) => {
    if (req.params.id.length > MAX_FIELD_LENGTH) return res.status(400).json({ error: "Invalid id" });
    const policies = await storage.getPolicies();
    const policy = policies.find((p) => p.id === req.params.id);
    if (!policy) return res.status(404).json({ error: "Policy not found" });
    res.json(policy);
  }));

  app.get("/api/analytics", asyncHandler(async (_req, res) => {
    const [connections, users, devices, policies] = await Promise.all([
      storage.getConnections(),
      storage.getUsers(),
      storage.getDevices(),
      storage.getPolicies(),
    ]);
    const analytics = computeAnalytics(connections, users, devices, policies);
    res.json(analytics);
  }));

  // Re-evaluate a past connection with current policies (for history replay)
  app.get("/api/connections/:id/evaluation", asyncHandler(async (req, res) => {
    if (req.params.id.length > MAX_FIELD_LENGTH) return res.status(400).json({ error: "Invalid id" });
    const connection = await storage.getConnection(req.params.id);
    if (!connection) return res.status(404).json({ error: "Connection not found" });

    const user = await storage.getUser(connection.sourceId);
    const device = await storage.getDevice(connection.targetId);
    if (!user || !device) return res.status(404).json({ error: "User or device not found" });

    const policies = await storage.getPolicies();
    const evaluation = policyEngine.evaluateConnection(user, device, connection.action, policies);
    res.json(evaluation);
  }));

  app.post("/api/verify-mfa", mfaLimiter, asyncHandler(async (req, res) => {
    const { connectionId, code, connection: connectionFallback } = req.body;

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

    let connection = await storage.getConnection(connectionId);

    // Fallback to connection data sent from client for serverless recovery
    if (!connection && connectionFallback) {
      connection = connectionFallback;
    }
    
    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    if (!connection.mfaChallenged) {
      return res.status(400).json({ error: "MFA not required for this connection" });
    }

    // Demo mode: In production, replace with TOTP/HOTP library or external MFA provider.
    // Only accept "123456" in demo mode to prevent accidental production use of this code.
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
      return res.status(500).json({ error: "MFA not configured for this environment" });
    }
    const verified = code === "123456";
    const updated = await storage.updateConnectionMFA(connectionId, verified);

    res.json({
      verified,
      connection: updated,
    });
  }));

}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupRoutes(app);
  const httpServer = createServer(app);
  return httpServer;
}
