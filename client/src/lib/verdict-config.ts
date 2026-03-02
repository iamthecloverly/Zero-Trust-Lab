import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type VerdictKey = "ALLOW" | "CHALLENGE_MFA" | "DENY";

export type VerdictConfig = {
  icon: LucideIcon;
  /** text-* Tailwind class for icon/text coloring */
  textColor: string;
  /** bg-* Tailwind class for badge backgrounds */
  bgColor: string;
  /** "default" | "secondary" | "destructive" — Badge component variant */
  badgeVariant: "default" | "secondary" | "destructive";
  /** Short human-readable label */
  label: string;
};

export const VERDICT_CONFIG: Record<VerdictKey, VerdictConfig> = {
  ALLOW: {
    icon: CheckCircle2,
    textColor: "text-status-allow",
    bgColor: "bg-status-allow",
    badgeVariant: "default",
    label: "ALLOW",
  },
  CHALLENGE_MFA: {
    icon: AlertTriangle,
    textColor: "text-status-challenge",
    bgColor: "bg-status-challenge",
    badgeVariant: "secondary",
    label: "CHALLENGE",
  },
  DENY: {
    icon: XCircle,
    textColor: "text-status-deny",
    bgColor: "bg-status-deny",
    badgeVariant: "destructive",
    label: "DENY",
  },
};
