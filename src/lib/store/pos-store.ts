import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, PaymentState } from "@/types/pos";
import type { Orden } from "@/types/database";

interface POSStore {
  cart: CartItem[];
  tipo: "mostrador" | "mesa" | "delivery";
  mesaId: string | null;
  clienteNombre: string;
  ordenActiva: Orden | null;
  payment: PaymentState;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productoId: string) => void;
  updateCantidad: (productoId: string, cantidad: number) => void;
  updateNota: (productoId: string, nota: string) => void;
  clearCart: () => void;
  setTipo: (tipo: "mostrador" | "mesa" | "delivery") => void;
  setMesaId: (mesaId: string | null) => void;
  setClienteNombre: (nombre: string) => void;
  setOrdenActiva: (orden: Orden | null) => void;
  setPayment: (payment: Partial<PaymentState>) => void;
  resetPayment: () => void;
  reset: () => void;
}

const initialPayment: PaymentState = {
  metodo: "efectivo",
  monto: 0,
  propina: 0,
  descuento: 0,
};

export const usePOSStore = create<POSStore>()(
  persist(
    (set) => ({
      cart: [],
      tipo: "mostrador",
      mesaId: null,
      clienteNombre: "",
      ordenActiva: null,
      payment: { ...initialPayment },
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find(
            (ci) => ci.producto.id === item.producto.id
          );
          if (existing) {
            return {
              cart: state.cart.map((ci) =>
                ci.producto.id === item.producto.id
                  ? { ...ci, cantidad: ci.cantidad + item.cantidad }
                  : ci
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (productoId) =>
        set((state) => ({
          cart: state.cart.filter((ci) => ci.producto.id !== productoId),
        })),
      updateCantidad: (productoId, cantidad) =>
        set((state) => ({
          cart: state.cart.map((ci) =>
            ci.producto.id === productoId ? { ...ci, cantidad } : ci
          ),
        })),
      updateNota: (productoId, nota) =>
        set((state) => ({
          cart: state.cart.map((ci) =>
            ci.producto.id === productoId ? { ...ci, nota } : ci
          ),
        })),
      clearCart: () => set({ cart: [] }),
      setTipo: (tipo) => set({ tipo }),
      setMesaId: (mesaId) => set({ mesaId }),
      setClienteNombre: (nombre) => set({ clienteNombre: nombre }),
      setOrdenActiva: (orden) => set({ ordenActiva: orden }),
      setPayment: (payment) =>
        set((state) => ({
          payment: { ...state.payment, ...payment },
        })),
      resetPayment: () => set({ payment: { ...initialPayment } }),
      reset: () =>
        set({
          cart: [],
          tipo: "mostrador",
          mesaId: null,
          ordenActiva: null,
          payment: { ...initialPayment },
        }),
    }),
    {
      name: "pos-storage",
      partialize: (state) => ({
        cart: state.cart,
        tipo: state.tipo,
        mesaId: state.mesaId,
        payment: state.payment,
      }),
    }
  )
);
