import { useState } from "react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/page-header";
import { CategoryFilterTabs } from "@/components/category-filter-tabs";
import { ScenarioCard } from "@/components/scenario-card";
import { useSimulation } from "@/contexts/simulation-context";
import { SCENARIOS, type ScenarioCategory, type Scenario } from "@/lib/scenarios";

type FilterValue = "All" | ScenarioCategory;

export default function ScenariosPage() {
  const [filter, setFilter] = useState<FilterValue>("All");
  const [, navigate] = useLocation();
  const { startSimulation } = useSimulation();

  const filtered =
    filter === "All" ? SCENARIOS : SCENARIOS.filter((s) => s.category === filter);

  const handleRun = (scenario: Scenario) => {
    startSimulation({
      userId: scenario.userId,
      deviceId: scenario.deviceId,
      action: scenario.action,
    });
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Scenario Library"
        description="Pre-built Zero Trust scenarios to explore policy interactions and learn security concepts."
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <CategoryFilterTabs value={filter} onChange={setFilter} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} onRun={handleRun} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No scenarios in this category.
          </div>
        )}
      </div>
    </div>
  );
}
