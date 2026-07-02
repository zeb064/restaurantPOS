"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth-store";
import type { UserRole, PlanType } from "@/types/plans";

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const [initialLoading, setInitialLoading] = useState(true);

  const {
    isAuthenticated,
    userId,
    restauranteId,
    nombre,
    rol,
    plan,
    setSession,
    clearSession,
  } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setInitialLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadProfile(session.user.id);
        router.refresh();
      }

      if (event === "TOKEN_REFRESHED" && session?.user) {
        const store = useAuthStore.getState();
        if (!store.isAuthenticated) {
          await loadProfile(session.user.id);
        }
      }

      if (event === "SIGNED_OUT") {
        clearSession();
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("*, restaurante:restaurantes(*)")
      .eq("usuario_id", userId)
      .single();

    if (perfil) {
      setSession({
        userId,
        restauranteId: perfil.restaurante_id,
        nombre: perfil.nombre,
        rol: perfil.rol as UserRole,
        plan: (perfil.restaurante?.plan ?? "basico") as PlanType,
      });
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearSession();
    router.push("/login");
  };

  return {
    isAuthenticated,
    initialLoading,
    userId,
    restauranteId,
    nombre,
    rol,
    plan,
    login,
    logout,
  };
}
