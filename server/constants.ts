/**
 * Shared constants for Zero Trust Lab
 */

// Trust score thresholds
export const TRUST_SCORE_THRESHOLDS = {
  ALLOW: 70,
  CHALLENGE_MFA: 40,
  DENY: 0,
} as const;

// Policy point deductions
export const POLICY_PENALTIES = {
  MFA_NOT_ENABLED: -30,
  DEVICE_NOT_VERIFIED: -40,
  GEO_RESTRICTED: -20,
  INSUFFICIENT_ROLE: -10,
} as const;

// Geographic policy config
export const POLICY_CONFIG = {
  allowedRegions: ["US", "CA"],
  serverDeviceType: "Server",
  adminRole: "Admin",
} as const;

// Sample data for seeding
export const SAMPLE_USERS = [
  { id: "U1-Admin", role: "Admin", mfaEnabled: true },
  { id: "U2-Engineer", role: "Engineer", mfaEnabled: true },
  { id: "U3-Contractor", role: "Contractor", mfaEnabled: false },
  { id: "U4-Intern", role: "Intern", mfaEnabled: false },
];

export const SAMPLE_DEVICES = [
  { id: "D1-Laptop", type: "Laptop", location: "US", verified: true },
  { id: "D2-Server", type: "Server", location: "US", verified: true },
  { id: "D3-Mobile", type: "Mobile", location: "CA", verified: false },
  { id: "D4-Desktop", type: "Desktop", location: "IN", verified: false },
  { id: "D5-Tablet", type: "Tablet", location: "UK", verified: true },
];

export const SAMPLE_POLICIES = [
  { name: "Require MFA for All Users", enabled: true, type: "mfa" },
  { name: "Enforce Device Verification", enabled: true, type: "device" },
  { name: "Restrict Access to US/CA Only", enabled: true, type: "geo" },
  { name: "Admin Role Required for Servers", enabled: true, type: "role" },
];
