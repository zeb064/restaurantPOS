import { PLAN_PERMISSIONS, type PlanType, type PlanPermissions } from "@/types/plans";

export function getPlanPermissions(plan: PlanType | null): PlanPermissions {
  if (!plan) return PLAN_PERMISSIONS.basico;
  return PLAN_PERMISSIONS[plan] ?? PLAN_PERMISSIONS.basico;
}

export function canAccessFeature(
  plan: PlanType | null,
  feature: keyof PlanPermissions
): boolean {
  return getPlanPermissions(plan)[feature];
}

export function getPlanName(plan: PlanType | null): string {
  const names: Record<string, string> = {
    basico: "Básico",
    medio: "Medio",
    avanzado: "Avanzado",
  };
  return plan ? names[plan] ?? "Básico" : "Básico";
}

export function getPlanColor(plan: PlanType | null): string {
  const colors: Record<string, string> = {
    basico: "gray",
    medio: "blue",
    avanzado: "violet",
  };
  return plan ? colors[plan] ?? "gray" : "gray";
}
