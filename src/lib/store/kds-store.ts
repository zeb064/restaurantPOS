import { create } from "zustand";
import type { Orden, DetalleOrden } from "@/types/database";

interface OrdenKDS extends Orden {
  detalles: DetalleOrden[];
  tiempoTranscurrido: number;
}

interface KDSStore {
  ordenes: OrdenKDS[];
  filtro: "todas" | "pendiente" | "en_preparacion";
  setOrdenes: (ordenes: OrdenKDS[]) => void;
  setFiltro: (filtro: "todas" | "pendiente" | "en_preparacion") => void;
  actualizarEstado: (ordenId: string, estado: Orden["estado"]) => void;
  agregarOrden: (orden: OrdenKDS) => void;
  removerOrden: (ordenId: string) => void;
}

export const useKDSStore = create<KDSStore>((set) => ({
  ordenes: [],
  filtro: "todas",
  setOrdenes: (ordenes) => set({ ordenes }),
  setFiltro: (filtro) => set({ filtro }),
  actualizarEstado: (ordenId, estado) =>
    set((state) => ({
      ordenes: state.ordenes.map((o) =>
        o.id === ordenId ? { ...o, estado } : o
      ),
    })),
  agregarOrden: (orden) =>
    set((state) => ({ ordenes: [...state.ordenes, orden] })),
  removerOrden: (ordenId) =>
    set((state) => ({
      ordenes: state.ordenes.filter((o) => o.id !== ordenId),
    })),
}));
