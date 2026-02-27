import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "./queryClient";
import type { AnalyticsResponse } from "@shared/schema";

export function useAnalytics() {
  return useQuery<AnalyticsResponse>({
    queryKey: ["/api/analytics"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}
