import { Shield, Activity, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { VerdictDonutChart } from "@/components/charts/verdict-donut-chart";
import { TrustScoreBarChart } from "@/components/charts/trust-score-bar-chart";
import { PolicyViolationsTable } from "@/components/charts/policy-violations-table";
import { RecentTrendList } from "@/components/charts/recent-trend-list";
import { useAnalytics } from "@/lib/analytics";

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading analytics…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Failed to load analytics data.
      </div>
    );
  }

  const totalViolations = data.policyViolations.reduce(
    (sum, v) => sum + v.violationCount,
    0
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Analytics"
        description="Based on all simulations run in this session."
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Metric row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total Simulations"
            value={data.totalConnections}
            icon={<Activity className="h-5 w-5" />}
            sub="all access attempts"
            accent="neutral"
          />
          <MetricCard
            label="Avg Trust Score"
            value={data.totalConnections > 0 ? `${data.avgTrustScore}/100` : "—"}
            icon={<Shield className="h-5 w-5" />}
            sub="across all connections"
            accent={
              data.avgTrustScore >= 70
                ? "allow"
                : data.avgTrustScore >= 40
                ? "challenge"
                : "deny"
            }
          />
          <MetricCard
            label="Policy Violations"
            value={totalViolations}
            icon={<AlertTriangle className="h-5 w-5" />}
            sub={`across ${data.totalConnections} simulation${data.totalConnections !== 1 ? "s" : ""}`}
            accent={totalViolations > 0 ? "deny" : "allow"}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Verdict Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <VerdictDonutChart data={data} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Trust Score Buckets</CardTitle>
            </CardHeader>
            <CardContent>
              <TrustScoreBarChart data={data.trustScoreDistribution} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Policy Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <PolicyViolationsTable
                data={data.policyViolations}
                total={data.totalConnections}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Simulations</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTrendList data={data.recentTrend} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
