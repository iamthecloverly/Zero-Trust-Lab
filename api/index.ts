type User = { id: string; role: string; mfaEnabled: boolean };
type Device = { id: string; type: string; location: string; verified: boolean };
type Policy = { id: string; name: string; type: "mfa" | "device" | "geo" | "role"; enabled: boolean };
type Connection = {
  id: string;
  sourceId: string;
  targetId: string;
  action: string;
  verdict: "ALLOW" | "CHALLENGE_MFA" | "DENY";
  trustScore: number;
  timestamp: string;
  mfaChallenged: boolean;
  mfaVerified: boolean | null;
};

type NodeReq = {
  method?: string;
  url?: string;
  body?: unknown;
  on?: (event: string, callback: (chunk?: unknown) => void) => void;
};

type NodeRes = {
  statusCode?: number;
  setHeader?: (name: string, value: string) => void;
  end?: (body?: string) => void;
};

function uid() {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const users: User[] = [
  { id: "U1-Admin", role: "Admin", mfaEnabled: true },
  { id: "U2-Engineer", role: "Engineer", mfaEnabled: true },
  { id: "U3-Contractor", role: "Contractor", mfaEnabled: false },
  { id: "U4-Intern", role: "Intern", mfaEnabled: false },
];

const devices: Device[] = [
  { id: "D1-Laptop", type: "Laptop", location: "US", verified: true },
  { id: "D2-Server", type: "Server", location: "US", verified: true },
  { id: "D3-Mobile", type: "Mobile", location: "CA", verified: false },
  { id: "D4-Desktop", type: "Desktop", location: "IN", verified: false },
  { id: "D5-Tablet", type: "Tablet", location: "UK", verified: true },
];

const policies: Policy[] = [
  { id: uid(), name: "Require MFA for All Users", type: "mfa", enabled: true },
  { id: uid(), name: "Enforce Device Verification", type: "device", enabled: true },
  { id: uid(), name: "Restrict Access to US/CA Only", type: "geo", enabled: true },
  { id: uid(), name: "Admin Role Required for Servers", type: "role", enabled: true },
];

const connections: Connection[] = [];

function nodeJson(res: NodeRes, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader?.("Content-Type", "application/json");
  res.end?.(JSON.stringify(payload));
}

function webJson(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isWebRequest(req: unknown): req is Request {
  return typeof Request !== "undefined" && req instanceof Request;
}

async function parseBody(req: NodeReq | Request): Promise<Record<string, unknown>> {
  if (isWebRequest(req)) {
    try {
      return (await req.json()) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof req.on !== "function") return {};

  return await new Promise((resolve) => {
    let data = "";
    req.on?.("data", (chunk) => {
      data += String(chunk ?? "");
    });
    req.on?.("end", () => {
      try {
        resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function evaluateConnection(user: User, device: Device, action: string) {
  const enabledPolicies = policies.filter((p) => p.enabled);
  let trustScore = 100;
  const breakdown: Array<{ label: string; points: number; icon: string }> = [
    { label: "Base Trust Level", points: 100, icon: "check" },
  ];

  if (enabledPolicies.some((p) => p.type === "mfa") && !user.mfaEnabled) {
    trustScore -= 30;
    breakdown.push({ label: "MFA Not Enabled", points: -30, icon: "shield-alert" });
  }
  if (enabledPolicies.some((p) => p.type === "device") && !device.verified) {
    trustScore -= 40;
    breakdown.push({ label: "Device Not Verified", points: -40, icon: "lock" });
  }
  if (enabledPolicies.some((p) => p.type === "geo") && !["US", "CA"].includes(device.location)) {
    trustScore -= 20;
    breakdown.push({ label: "Restricted Geographic Location", points: -20, icon: "map-pin" });
  }
  if (enabledPolicies.some((p) => p.type === "role") && device.type === "Server" && user.role !== "Admin") {
    trustScore -= 10;
    breakdown.push({ label: "Insufficient Role Permissions", points: -10, icon: "user-x" });
  }

  const finalScore = Math.max(0, trustScore);
  const verdict: Connection["verdict"] = finalScore >= 70 ? "ALLOW" : finalScore >= 40 ? "CHALLENGE_MFA" : "DENY";
  return { verdict, trustScore: finalScore, breakdown, action };
}

function buildGraph() {
  const nodes = [
    ...users.map((u) => ({ id: u.id, label: u.id, type: "user" as const })),
    ...devices.map((d) => ({ id: d.id, label: d.id, type: "device" as const })),
  ];

  const latestByPair = new Map<string, Connection>();
  for (const conn of connections) latestByPair.set(`${conn.sourceId}-${conn.targetId}`, conn);

  const edges = Array.from(latestByPair.values()).map((conn) => ({
    from: conn.sourceId,
    to: conn.targetId,
    label: conn.verdict === "ALLOW" ? "✓ ALLOW" : conn.verdict === "CHALLENGE_MFA" ? "⚠ MFA" : "✕ DENY",
    color: conn.verdict === "ALLOW" ? "#22c55e" : conn.verdict === "CHALLENGE_MFA" ? "#f59e0b" : "#ef4444",
    dashes: conn.verdict !== "ALLOW",
    width: conn.verdict === "ALLOW" ? 3 : 2,
  }));

  return { nodes, edges };
}

function analytics() {
  const total = connections.length;
  const allowCount = connections.filter((c) => c.verdict === "ALLOW").length;
  const denyCount = connections.filter((c) => c.verdict === "DENY").length;
  const challengeCount = connections.filter((c) => c.verdict === "CHALLENGE_MFA").length;
  const avgTrustScore = total > 0 ? Math.round(connections.reduce((sum, c) => sum + c.trustScore, 0) / total) : 0;

  const policyViolations = [
    { policyType: "mfa", violationCount: 0 },
    { policyType: "device", violationCount: 0 },
    { policyType: "geo", violationCount: 0 },
    { policyType: "role", violationCount: 0 },
  ];

  for (const conn of connections) {
    const user = users.find((u) => u.id === conn.sourceId);
    const device = devices.find((d) => d.id === conn.targetId);
    if (!user || !device) continue;
    if (policies.some((p) => p.enabled && p.type === "mfa") && !user.mfaEnabled) policyViolations[0].violationCount++;
    if (policies.some((p) => p.enabled && p.type === "device") && !device.verified) policyViolations[1].violationCount++;
    if (policies.some((p) => p.enabled && p.type === "geo") && !["US", "CA"].includes(device.location)) policyViolations[2].violationCount++;
    if (policies.some((p) => p.enabled && p.type === "role") && device.type === "Server" && user.role !== "Admin") policyViolations[3].violationCount++;
  }

  const recentTrend = [...connections]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-5)
    .map((c) => ({
      id: c.id,
      sourceId: c.sourceId,
      targetId: c.targetId,
      verdict: c.verdict,
      trustScore: c.trustScore,
      timestamp: c.timestamp,
      action: c.action,
    }));

  return {
    totalConnections: total,
    allowCount,
    denyCount,
    challengeCount,
    allowRate: total > 0 ? Math.round((allowCount / total) * 100) : 0,
    denyRate: total > 0 ? Math.round((denyCount / total) * 100) : 0,
    challengeRate: total > 0 ? Math.round((challengeCount / total) * 100) : 0,
    avgTrustScore,
    policyViolations,
    trustScoreDistribution: [
      { range: "0–39 (Deny)", count: connections.filter((c) => c.trustScore <= 39).length },
      { range: "40–69 (Challenge)", count: connections.filter((c) => c.trustScore >= 40 && c.trustScore <= 69).length },
      { range: "70–100 (Allow)", count: connections.filter((c) => c.trustScore >= 70).length },
    ],
    recentTrend,
  };
}

async function route(method: string, pathname: string, req: NodeReq | Request) {
  if (pathname === "/api/users" && method === "GET") return { status: 200, body: users };
  if (pathname === "/api/devices" && method === "GET") return { status: 200, body: devices };
  if (pathname === "/api/connections" && method === "GET") return { status: 200, body: connections };
  if (pathname === "/api/policies" && method === "GET") return { status: 200, body: policies };
  if (pathname === "/api/network/graph" && method === "GET") return { status: 200, body: buildGraph() };
  if (pathname === "/api/analytics" && method === "GET") return { status: 200, body: analytics() };

  if (pathname === "/api/network/reset" && method === "POST") {
    connections.splice(0, connections.length);
    return { status: 200, body: { success: true } };
  }

  if (pathname === "/api/simulate" && method === "POST") {
    const body = await parseBody(req);
    const userId = typeof body.userId === "string" ? body.userId : "";
    const deviceId = typeof body.deviceId === "string" ? body.deviceId : "";
    const action = typeof body.action === "string" ? body.action : "";
    if (!userId || !deviceId || !action) return { status: 400, body: { error: "Missing required fields" } };

    const user = users.find((u) => u.id === userId);
    const device = devices.find((d) => d.id === deviceId);
    if (!user || !device) return { status: 404, body: { error: "User or device not found" } };

    const evaluation = evaluateConnection(user, device, action);
    const connection: Connection = {
      id: uid(),
      sourceId: userId,
      targetId: deviceId,
      action,
      verdict: evaluation.verdict,
      trustScore: evaluation.trustScore,
      timestamp: new Date().toISOString(),
      mfaChallenged: evaluation.verdict === "CHALLENGE_MFA",
      mfaVerified: null,
    };

    connections.push(connection);
    return {
      status: 200,
      body: {
        connection,
        evaluation: {
          verdict: evaluation.verdict,
          trustScore: evaluation.trustScore,
          breakdown: evaluation.breakdown,
        },
        graph: buildGraph(),
      },
    };
  }

  if (pathname === "/api/verify-mfa" && method === "POST") {
    const body = await parseBody(req);
    const connectionId = typeof body.connectionId === "string" ? body.connectionId : "";
    const code = typeof body.code === "string" ? body.code : "";
    const connectionData = typeof body.connection === "object" && body.connection !== null ? body.connection as Connection : null;
    
    if (!connectionId || !code) return { status: 400, body: { error: "Missing required fields" } };
    if (!/^\d{6}$/.test(code)) return { status: 400, body: { error: "Invalid code format" } };

    let connection = connections.find((c) => c.id === connectionId);
    
    // Serverless recovery: If connection not in memory (cold start), restore from client-provided data
    // This handles cases where the serverless function instance restarts between simulate and verify-mfa
    if (!connection && connectionData?.id === connectionId) {
      connections.push(connectionData);
      connection = connectionData;
    }
    
    if (!connection) return { status: 404, body: { error: "Connection not found" } };
    if (!connection.mfaChallenged) return { status: 400, body: { error: "MFA not required for this connection" } };

    const verified = code === "123456" || code === "000000";
    connection.mfaVerified = verified;
    return { status: 200, body: { verified, connection } };
  }

  if (pathname.startsWith("/api/policies/") && method === "PATCH") {
    const id = pathname.replace("/api/policies/", "");
    const body = await parseBody(req);
    if (typeof body.enabled !== "boolean") return { status: 400, body: { error: "enabled must be a boolean" } };
    const policy = policies.find((p) => p.id === id);
    if (!policy) return { status: 404, body: { error: "Policy not found" } };
    policy.enabled = body.enabled;
    return { status: 200, body: policy };
  }

  if (pathname.startsWith("/api/policies/") && method === "GET") {
    const id = pathname.replace("/api/policies/", "");
    const policy = policies.find((p) => p.id === id);
    return policy ? { status: 200, body: policy } : { status: 404, body: { error: "Policy not found" } };
  }

  if (pathname.startsWith("/api/connections/") && pathname.endsWith("/evaluation") && method === "GET") {
    const id = pathname.replace("/api/connections/", "").replace("/evaluation", "");
    const connection = connections.find((c) => c.id === id);
    if (!connection) return { status: 404, body: { error: "Connection not found" } };

    const user = users.find((u) => u.id === connection.sourceId);
    const device = devices.find((d) => d.id === connection.targetId);
    if (!user || !device) return { status: 404, body: { error: "User or device not found" } };

    const evaluation = evaluateConnection(user, device, connection.action);
    return { status: 200, body: { verdict: evaluation.verdict, trustScore: evaluation.trustScore, breakdown: evaluation.breakdown } };
  }

  return { status: 404, body: { error: "Not found" } };
}

export default async function handler(req: NodeReq | Request, res?: NodeRes) {
  try {
    const method = isWebRequest(req) ? req.method.toUpperCase() : (req.method ?? "GET").toUpperCase();
    const urlText = isWebRequest(req) ? req.url : req.url ?? "/";
    const pathname = new URL(urlText, "https://zero-trust-lab.vercel.app").pathname;
    const result = await route(method, pathname, req);

    if (res && typeof res.end === "function") {
      nodeJson(res, result.status, result.body);
      return;
    }

    return webJson(result.status, result.body);
  } catch (error) {
    console.error("Serverless API fatal error:", error);
    if (res && typeof res.end === "function") {
      nodeJson(res, 500, { error: "Internal server error" });
      return;
    }
    return webJson(500, { error: "Internal server error" });
  }
}
