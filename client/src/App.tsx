import { Switch, Route } from "wouter";
import { Component, type ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SimulationProvider } from "@/contexts/simulation-context";
import { TopNav } from "@/components/top-nav";
import Dashboard from "@/pages/dashboard";
import ScenariosPage from "@/pages/scenarios";
import AnalyticsPage from "@/pages/analytics";
import PoliciesPage from "@/pages/policies";
import NotFound from "@/pages/not-found";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center text-center p-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <main className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/scenarios" component={ScenariosPage} />
            <Route path="/analytics" component={AnalyticsPage} />
            <Route path="/policies" component={PoliciesPage} />
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SimulationProvider>
            <AppShell />
            <Toaster />
          </SimulationProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
