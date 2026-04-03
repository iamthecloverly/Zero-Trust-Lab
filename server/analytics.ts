import type { User, Device, Connection, Policy } from "../shared/schema";
import { POLICY_CONFIG } from "./constants";

export interface AnalyticsData {
  totalConnections: number;
  allowCount: number;
  denyCount: number;
  challengeCount: number;
  allowRate: number;
  denyRate: number;
  challengeRate: number;
  avgTrustScore: number;
  policyViolations: Array<{ policyType: "mfa" | "device" | "geo" | "role"; violationCount: number }>;
  trustScoreDistribution: Array<{ range: string; count: number }>;
  recentTrend: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    verdict: string;
    trustScore: number;
    timestamp: string;
    action: string;
  }>;
}

export function computeAnalytics(
  connections: Connection[],
  users: User[],
  devices: Device[],
  policies: Policy[]
): AnalyticsData {
  const total = connections.length;
  const allowCount = connections.filter((c) => c.verdict === "ALLOW").length;
  const denyCount = connections.filter((c) => c.verdict === "DENY").length;
  const challengeCount = connections.filter((c) => c.verdict === "CHALLENGE_MFA").length;

  const avgTrustScore =
    total > 0 ? Math.round(connections.reduce((sum, c) => sum + c.trustScore, 0) / total) : 0;

  const distribution = [
    { range: "0–39 (Deny)", count: connections.filter((c) => c.trustScore <= 39).length },
    {
      range: "40–69 (Challenge)",
      count: connections.filter((c) => c.trustScore >= 40 && c.trustScore <= 69).length,
    },
    { range: "70–100 (Allow)", count: connections.filter((c) => c.trustScore >= 70).length },
  ];

  const userMap = new Map(users.map((u) => [u.id, u]));
  const deviceMap = new Map(devices.map((d) => [d.id, d]));
  const activePolicies = policies.filter((p) => p.enabled);

  const policyViolations = [
    { policyType: "mfa" as const, violationCount: 0 },
    { policyType: "device" as const, violationCount: 0 },
    { policyType: "geo" as const, violationCount: 0 },
    { policyType: "role" as const, violationCount: 0 },
  ];

  for (const conn of connections) {
    const user = userMap.get(conn.sourceId);
    const device = deviceMap.get(conn.targetId);
    if (!user || !device) {
      console.warn(`analytics: skipping connection ${conn.id} — missing user "${conn.sourceId}" or device "${conn.targetId}"`);
      continue;
    }

    if (activePolicies.some((p) => p.type === "mfa") && !user.mfaEnabled)
      policyViolations[0].violationCount++;
    if (activePolicies.some((p) => p.type === "device") && !device.verified)
      policyViolations[1].violationCount++;
    if (activePolicies.some((p) => p.type === "geo") && !(POLICY_CONFIG.allowedRegions as readonly string[]).includes(device.location))
      policyViolations[2].violationCount++;
    if (
      activePolicies.some((p) => p.type === "role") &&
      device.type === POLICY_CONFIG.serverDeviceType &&
      user.role !== POLICY_CONFIG.adminRole
    )
      policyViolations[3].violationCount++;
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
    trustScoreDistribution: distribution,
    recentTrend,
  };
}
