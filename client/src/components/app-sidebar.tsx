import {
  LayoutDashboard,
  Shield,
  Activity,
  Network,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Policy, Connection } from "@shared/schema";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Network simulation",
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });

  const activePolicies = policies.filter((p) => p.enabled).length;
  const networkActive = connections.length > 0;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">ZeroTrustLab</h1>
            <p className="text-xs text-muted-foreground">Security Simulator</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={isActive ? "bg-sidebar-accent" : ""}
                      data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
          <SidebarGroupContent className="px-3 py-2 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Network className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Network:</span>
              <span 
                className={`font-semibold ${networkActive ? "text-primary" : "text-muted-foreground"}`}
                data-testid="text-network-status"
              >
                {networkActive ? "Active" : "Idle"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Policies:</span>
              <span className="font-semibold" data-testid="text-active-policies">
                {activePolicies} Active
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Connections:</span>
              <span className="font-semibold" data-testid="text-connection-count">
                {connections.length}
              </span>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-6">
        <div className="text-xs text-muted-foreground">
          <p className="font-mono">v1.0.0</p>
          <p className="mt-1">Zero Trust Architecture</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
