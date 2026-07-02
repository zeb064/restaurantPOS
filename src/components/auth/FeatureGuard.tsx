"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { canAccessFeature } from "@/lib/utils/plan-utils";
import type { PlanPermissions } from "@/types/plans";

interface Props {
  children: ReactNode;
  feature: keyof PlanPermissions;
  fallback?: ReactNode;
}

export function FeatureGuard({ children, feature, fallback }: Props) {
  const { plan } = useAuthStore();

  if (!canAccessFeature(plan, feature)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
