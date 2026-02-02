import type { User, Device, Policy, TrustEvaluation } from "@shared/schema";

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
      trustScore -= 30;
      breakdown.push({
        label: "MFA Not Enabled",
        points: -30,
        icon: "shield-alert",
      });
    }

    const devicePolicy = enabledPolicies.find((p) => p.type === "device");
    if (devicePolicy && !device.verified) {
      trustScore -= 40;
      breakdown.push({
        label: "Device Not Verified",
        points: -40,
        icon: "lock",
      });
    }

    const geoPolicy = enabledPolicies.find((p) => p.type === "geo");
    const allowedRegions = ["US", "CA"];
    if (geoPolicy && !allowedRegions.includes(device.location)) {
      trustScore -= 20;
      breakdown.push({
        label: "Restricted Geographic Location",
        points: -20,
        icon: "map-pin",
      });
    }

    const rolePolicy = enabledPolicies.find((p) => p.type === "role");
    const isServerAccess = device.type === "Server";
    const isAdmin = user.role === "Admin";
    if (rolePolicy && isServerAccess && !isAdmin) {
      trustScore -= 10;
      breakdown.push({
        label: "Insufficient Role Permissions",
        points: -10,
        icon: "user-x",
      });
    }

    let verdict: TrustEvaluation["verdict"];
    if (trustScore >= 70) {
      verdict = "ALLOW";
    } else if (trustScore >= 40) {
      verdict = "CHALLENGE_MFA";
    } else {
      verdict = "DENY";
    }

    return {
      verdict,
      trustScore: Math.max(0, trustScore),
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

    const edges = connections.map((conn) => {
      let color: string;
      let dashes = false;

      if (conn.verdict === "ALLOW") {
        color = "#22c55e";
      } else if (conn.verdict === "CHALLENGE_MFA") {
        color = "#f59e0b";
        dashes = true;
      } else {
        color = "#ef4444";
        dashes = true;
      }

      return {
        from: conn.sourceId,
        to: conn.targetId,
        label: conn.verdict,
        color,
        dashes,
        width: 2,
      };
    });

    return { nodes, edges };
  }
}

export const policyEngine = new ZeroTrustPolicyEngine();
