import type { User, Device, Policy, TrustEvaluation } from "../shared/schema";
import { POLICY_CONFIG, POLICY_PENALTIES, TRUST_SCORE_THRESHOLDS } from "./constants";

// Type-safe penalty constants for policy violations
const penalties = POLICY_PENALTIES;

export class ZeroTrustPolicyEngine {
  evaluateConnection(
    user: User,
    device: Device,
    action: string,
    policies: Policy[]
  ): TrustEvaluation {
    let trustScore = 100;
    const breakdown: TrustEvaluation["breakdown"] = [
      { label: "Base Trust Level", points: 100, icon: "check" },
    ];

    const enabledPolicies = policies.filter((p) => p.enabled);

    const mfaPolicy = enabledPolicies.find((p) => p.type === "mfa");
    if (mfaPolicy && !user.mfaEnabled) {
      trustScore += penalties.MFA_NOT_ENABLED;
      breakdown.push({
        label: "MFA Not Enabled",
        points: penalties.MFA_NOT_ENABLED,
        icon: "shield-alert",
      });
    }

    const devicePolicy = enabledPolicies.find((p) => p.type === "device");
    if (devicePolicy && !device.verified) {
      trustScore += penalties.DEVICE_NOT_VERIFIED;
      breakdown.push({
        label: "Device Not Verified",
        points: penalties.DEVICE_NOT_VERIFIED,
        icon: "lock",
      });
    }

    const geoPolicy = enabledPolicies.find((p) => p.type === "geo");
    if (geoPolicy && !POLICY_CONFIG.allowedRegions.includes(device.location as "US" | "CA")) {
      trustScore += penalties.GEO_RESTRICTED;
      breakdown.push({
        label: "Restricted Geographic Location",
        points: penalties.GEO_RESTRICTED,
        icon: "map-pin",
      });
    }

    const rolePolicy = enabledPolicies.find((p) => p.type === "role");
    const isServerAccess = device.type === POLICY_CONFIG.serverDeviceType;
    const isAdmin = user.role === POLICY_CONFIG.adminRole;
    if (rolePolicy && isServerAccess && !isAdmin) {
      trustScore += penalties.INSUFFICIENT_ROLE;
      breakdown.push({
        label: "Insufficient Role Permissions",
        points: penalties.INSUFFICIENT_ROLE,
        icon: "user-x",
      });
    }

    const finalScore = Math.max(0, trustScore);

    let verdict: TrustEvaluation["verdict"];
    if (finalScore >= TRUST_SCORE_THRESHOLDS.ALLOW) {
      verdict = "ALLOW";
    } else if (finalScore >= TRUST_SCORE_THRESHOLDS.CHALLENGE_MFA) {
      verdict = "CHALLENGE_MFA";
    } else {
      verdict = "DENY";
    }

    return {
      verdict,
      trustScore: finalScore,
      breakdown,
    };
  }

  buildNetworkGraph(
    users: User[],
    devices: Device[],
    connections: Array<{ sourceId: string; targetId: string; verdict: string; trustScore: number }>
  ) {
    const nodes = [
      ...users.map((u) => ({
        id: u.id,
        label: u.id,
        type: "user" as const,
      })),
      ...devices.map((d) => ({
        id: d.id,
        label: d.id,
        type: "device" as const,
      })),
    ];

    // Keep only the most recent verdict per user→device pair to avoid duplicate edge IDs
    const latestByPair = new Map<string, typeof connections[0]>();
    for (const conn of connections) {
      latestByPair.set(`${conn.sourceId}-${conn.targetId}`, conn);
    }

    const edges = Array.from(latestByPair.values()).map((conn) => {
      let color: string;
      let dashes = false;

      let width = 2;
      if (conn.verdict === "ALLOW") {
        color = "#22c55e";
        width = 3;
      } else if (conn.verdict === "CHALLENGE_MFA") {
        color = "#f59e0b";
        dashes = true;
      } else {
        color = "#ef4444";
        dashes = true;
      }

      const shortLabel =
        conn.verdict === "ALLOW"
          ? "✓ ALLOW"
          : conn.verdict === "CHALLENGE_MFA"
            ? "⚠ MFA"
            : "✕ DENY";

      return {
        from: conn.sourceId,
        to: conn.targetId,
        label: shortLabel,
        color,
        dashes,
        width,
      };
    });

    return { nodes, edges };
  }
}

export const policyEngine = new ZeroTrustPolicyEngine();
