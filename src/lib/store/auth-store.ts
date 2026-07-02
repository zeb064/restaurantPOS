import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanType, UserRole } from "@/types/plans";

interface AuthState {
  userId: string | null;
  restauranteId: string | null;
  nombre: string | null;
  rol: UserRole | null;
  plan: PlanType | null;
  isAuthenticated: boolean;
  setSession: (session: {
    userId: string;
    restauranteId: string;
    nombre: string;
    rol: UserRole;
    plan: PlanType;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      restauranteId: null,
      nombre: null,
      rol: null,
      plan: null,
      isAuthenticated: false,
      setSession: (session) =>
        set({
          userId: session.userId,
          restauranteId: session.restauranteId,
          nombre: session.nombre,
          rol: session.rol,
          plan: session.plan,
          isAuthenticated: true,
        }),
      clearSession: () =>
        set({
          userId: null,
          restauranteId: null,
          nombre: null,
          rol: null,
          plan: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);
