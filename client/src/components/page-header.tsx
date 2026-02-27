import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  right?: ReactNode;
}

export function PageHeader({ title, description, right }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-border bg-card px-6 py-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}
