import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Risk tier -> tailwind classes for badge coloring
export const tierStyles: Record<string, string> = {
  LOW: "bg-tier-lowbg text-tier-low",
  MEDIUM: "bg-tier-mediumbg text-tier-medium",
  HIGH: "bg-tier-highbg text-tier-high",
  CRITICAL: "bg-tier-criticalbg text-tier-critical border border-tier-critical/30",
};

// Vendor status -> human-readable label
export const statusLabels: Record<string, string> = {
  DISCOVERED: "Discovered",
  INVITED: "Invited",
  NDA_SIGNED: "NDA signed",
  QUESTIONNAIRE_SENT: "Questionnaire in progress",
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  REMEDIATION: "Remediation required",
  OFFBOARDED: "Offboarded",
};

export const statusStyles: Record<string, string> = {
  DISCOVERED: "bg-slate-100 text-slate-600",
  INVITED: "bg-blue-50 text-blue-600",
  NDA_SIGNED: "bg-indigo-50 text-indigo-600",
  QUESTIONNAIRE_SENT: "bg-amber-50 text-amber-700",
  PENDING_REVIEW: "bg-purple-50 text-purple-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REMEDIATION: "bg-red-50 text-red-700",
  OFFBOARDED: "bg-slate-100 text-slate-400",
};
