import type { Producto } from "./database";

export interface CartItem {
  producto: Producto;
  cantidad: number;
  nota?: string;
}

export interface POSState {
  cart: CartItem[];
  clienteNombre?: string;
  tipo: "mostrador" | "mesa" | "delivery";
  mesaId?: string;
  nota?: string;
}

export interface PaymentState {
  metodo: "efectivo" | "tarjeta" | "transferencia" | "billetera_digital" | "credito";
  monto: number;
  referencia?: string;
  propina: number;
  descuento: number;
}

export interface MesaWithOrden {
  id: string;
  numero: number;
  nombre?: string;
  capacidad: number;
  estado: "libre" | "ocupada" | "pidiendo" | "cuenta_pedida";
  ordenActiva?: {
    id: string;
    total: number;
    mesero: string;
  };
}
