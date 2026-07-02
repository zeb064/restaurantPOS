"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import type { UserRole } from "@/types/plans";
import { ROLE_HIERARCHY } from "@/types/plans";

interface Props {
  children: ReactNode;
  requiredRole: UserRole;
  fallback?: ReactNode;
}

export function RoleGuard({ children, requiredRole, fallback }: Props) {
  const { rol } = useAuthStore();

  if (!rol) return null;

  const userLevel = ROLE_HIERARCHY[rol] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

  if (userLevel < requiredLevel) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
