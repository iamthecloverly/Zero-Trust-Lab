export type ScenarioDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type ScenarioCategory =
  | "Identity & Access"
  | "Device Trust"
  | "Geographic Risk"
  | "Least Privilege";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  userId: string;
  deviceId: string;
  action: string;
  expectedVerdict: "ALLOW" | "CHALLENGE_MFA" | "DENY";
  learningObjective: string;
  tags: string[];
}

export const SCENARIO_CATEGORIES: ScenarioCategory[] = [
  "Identity & Access",
  "Device Trust",
  "Geographic Risk",
  "Least Privilege",
];

export const SCENARIOS: Scenario[] = [
  {
    id: "sc-001",
    title: "Admin with Full Trust",
    description:
      "An Admin user on a verified US laptop with MFA enabled attempts to access a server. This represents the ideal Zero Trust configuration where all controls are satisfied.",
    category: "Identity & Access",
    difficulty: "Beginner",
    userId: "U1-Admin",
    deviceId: "D2-Server",
    action: "access",
    expectedVerdict: "ALLOW",
    learningObjective:
      "Understand that Zero Trust ALLOW verdicts require all active policies to pass simultaneously — MFA enabled, device verified, location allowed, and role sufficient.",
    tags: ["mfa", "admin", "verified-device", "us-location"],
  },
  {
    id: "sc-002",
    title: "Contractor Without MFA",
    description:
      "A Contractor user has not enabled MFA. With the MFA policy active, this triggers a trust score deduction of 30 points, landing in the CHALLENGE_MFA zone.",
    category: "Identity & Access",
    difficulty: "Beginner",
    userId: "U3-Contractor",
    deviceId: "D1-Laptop",
    action: "read",
    expectedVerdict: "CHALLENGE_MFA",
    learningObjective:
      "See how a missing MFA configuration immediately reduces trust. Challenge responses force additional verification as a compensating control.",
    tags: ["mfa", "contractor", "challenge"],
  },
  {
    id: "sc-003",
    title: "Unverified Device Access",
    description:
      "An Engineer with MFA enabled attempts access on an unverified mobile device. Device verification failure deducts 40 points — the largest single penalty in the policy engine.",
    category: "Device Trust",
    difficulty: "Beginner",
    userId: "U2-Engineer",
    deviceId: "D3-Mobile",
    action: "write",
    expectedVerdict: "CHALLENGE_MFA",
    learningObjective:
      "Device posture checking is the highest-weight policy. Even a trusted user is challenged when their device is unverified, demonstrating 'never trust the device implicitly'.",
    tags: ["device-trust", "unverified", "engineer"],
  },
  {
    id: "sc-004",
    title: "India-Based Device — Geo Restriction",
    description:
      "An Admin user attempts access from a Desktop located in India (IN), which falls outside the allowed US/CA region. Geo policy deducts 20 points.",
    category: "Geographic Risk",
    difficulty: "Beginner",
    userId: "U1-Admin",
    deviceId: "D4-Desktop",
    action: "read",
    expectedVerdict: "CHALLENGE_MFA",
    learningObjective:
      "Geographic restrictions operationalize the Zero Trust assumption that location is not inherently trustworthy. Access from unusual regions triggers additional scrutiny.",
    tags: ["geo", "india", "admin", "challenge"],
  },
  {
    id: "sc-005",
    title: "Intern Accessing Production Server",
    description:
      "An Intern attempts admin-level access on the production server. Role policy requires Admin role for Server device type. Combined with MFA and device violations this leads to a deny.",
    category: "Least Privilege",
    difficulty: "Intermediate",
    userId: "U4-Intern",
    deviceId: "D2-Server",
    action: "admin",
    expectedVerdict: "DENY",
    learningObjective:
      "Least-privilege enforcement prevents lateral movement and privilege escalation. The role policy is the principle of 'need-to-know' operationalized at the infrastructure level.",
    tags: ["role", "intern", "server", "deny", "least-privilege"],
  },
  {
    id: "sc-006",
    title: "Triple Violation — Maximum Threat",
    description:
      "The perfect storm: an Intern (no MFA, wrong role) on an unverified desktop in India attempts server admin access. All four policy checks fail, producing a near-zero trust score.",
    category: "Least Privilege",
    difficulty: "Advanced",
    userId: "U4-Intern",
    deviceId: "D4-Desktop",
    action: "admin",
    expectedVerdict: "DENY",
    learningObjective:
      "Policy layers compound. When MFA (-30), device verification (-40), geo (-20), and role (-10) all fail simultaneously, the cumulative deduction illustrates defense in depth versus single-layer security.",
    tags: ["deny", "all-policies", "advanced", "compound-violation"],
  },
  {
    id: "sc-007",
    title: "UK Tablet — Borderline Geography",
    description:
      "An Engineer with MFA enabled connects from a verified UK Tablet. The UK location is not in the allowed US/CA region. Tests whether the geo policy alone triggers a challenge.",
    category: "Geographic Risk",
    difficulty: "Intermediate",
    userId: "U2-Engineer",
    deviceId: "D5-Tablet",
    action: "read",
    expectedVerdict: "CHALLENGE_MFA",
    learningObjective:
      "The UK is not inherently unsafe, but Zero Trust does not use 'safer country' exceptions. Geographic policy is binary: allowed regions or not. Security models must be explicit, not implicit.",
    tags: ["geo", "uk", "tablet", "verified", "challenge"],
  },
  {
    id: "sc-008",
    title: "Contractor Bypass Attempt",
    description:
      "A Contractor (no MFA) on an unverified mobile from Canada attempts to write data. Canada IS in the allowed region, so only 2 policies fail (MFA -30, device -40). Trust score: 30 — DENY.",
    category: "Identity & Access",
    difficulty: "Advanced",
    userId: "U3-Contractor",
    deviceId: "D3-Mobile",
    action: "write",
    expectedVerdict: "DENY",
    learningObjective:
      "Even an 'allowed' geographic location cannot compensate for identity and device failures. This reinforces why Zero Trust mandates verification at every layer rather than relying on network perimeter assumptions.",
    tags: ["deny", "contractor", "canada", "unverified", "mfa-missing"],
  },
];
