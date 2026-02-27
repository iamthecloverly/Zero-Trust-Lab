import { cn } from "@/lib/utils";
import type { ScenarioCategory } from "@/lib/scenarios";
import { SCENARIO_CATEGORIES } from "@/lib/scenarios";

type FilterValue = "All" | ScenarioCategory;

interface CategoryFilterTabsProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

const allOptions: FilterValue[] = ["All", ...SCENARIO_CATEGORIES];

export function CategoryFilterTabs({ value, onChange }: CategoryFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {allOptions.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === option
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
