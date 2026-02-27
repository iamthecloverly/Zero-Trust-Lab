import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TrustScoreDistribution } from "@shared/schema";

interface TrustScoreBarChartProps {
  data: TrustScoreDistribution[];
}

const BUCKET_COLORS = [
  "hsl(0 72% 60%)",    // 0-39 deny
  "hsl(38 92% 56%)",   // 40-69 challenge
  "hsl(142 71% 52%)",  // 70-100 allow
];

export function TrustScoreBarChart({ data }: TrustScoreBarChartProps) {
  if (!data || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No simulation data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="range"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          }}
          cursor={{ fill: "hsl(var(--muted))" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={BUCKET_COLORS[index % BUCKET_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
