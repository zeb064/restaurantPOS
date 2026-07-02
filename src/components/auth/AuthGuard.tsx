"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader, Center } from "@mantine/core";
import { useAuthStore } from "@/lib/store/auth-store";
import { createClient } from "@/lib/supabase/client";

interface Props {
  children: ReactNode;
  requiredRole?: string[];
  fallback?: ReactNode;
}

export function AuthGuard({ children, requiredRole, fallback }: Props) {
  const router = useRouter();
  const { isAuthenticated, rol, plan } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
      }
    });
  }, [router]);

  if (!isAuthenticated) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (requiredRole && rol && !requiredRole.includes(rol)) {
    if (fallback) return <>{fallback}</>;
    return (
      <Center h="100vh">
        <p>No tienes permisos para acceder a esta página.</p>
      </Center>
    );
  }

  return <>{children}</>;
}
