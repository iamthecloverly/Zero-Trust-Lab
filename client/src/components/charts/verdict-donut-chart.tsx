import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { AnalyticsResponse } from "@shared/schema";

interface VerdictDonutChartProps {
  data: Pick<AnalyticsResponse, "allowCount" | "denyCount" | "challengeCount">;
}

const COLORS = {
  ALLOW:     "hsl(142 71% 52%)",
  CHALLENGE: "hsl(38 92% 56%)",
  DENY:      "hsl(0 72% 60%)",
};

export function VerdictDonutChart({ data }: VerdictDonutChartProps) {
  const chartData = [
    { name: "Allow",     value: data.allowCount,     color: COLORS.ALLOW },
    { name: "Challenge", value: data.challengeCount, color: COLORS.CHALLENGE },
    { name: "Deny",      value: data.denyCount,      color: COLORS.DENY },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No simulation data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
