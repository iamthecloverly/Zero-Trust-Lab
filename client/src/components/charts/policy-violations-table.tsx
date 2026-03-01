import type { PolicyViolation } from "@shared/schema";

interface PolicyViolationsTableProps {
  data: PolicyViolation[];
  total: number;
}

const POLICY_LABELS: Record<PolicyViolation["policyType"], string> = {
  mfa:    "MFA Not Enabled",
  device: "Device Not Verified",
  geo:    "Geographic Restriction",
  role:   "Insufficient Role",
};

export function PolicyViolationsTable({ data, total }: PolicyViolationsTableProps) {
  if (total === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No simulation data yet
      </p>
    );
  }

  const sorted = [...data].sort((a, b) => b.violationCount - a.violationCount);

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Policy</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Violations</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">% of sims</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.policyType} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{POLICY_LABELS[row.policyType] ?? row.policyType}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.violationCount}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {total > 0 ? Math.round((row.violationCount / total) * 100) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
