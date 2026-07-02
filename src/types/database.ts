export interface Perfil {
  id: string;
  usuario_id: string;
  restaurante_id: string;
  rol: string;
  plan: string;
  nombre: string;
  telefono?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Restaurante {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  logo_url?: string;
  plan: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  restaurante_id: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  orden: number;
  activo: boolean;
  created_at: string;
}

export interface Producto {
  id: string;
  restaurante_id: string;
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  precio_venta: number;
  precio_delivery?: number;
  costo_estimado?: number;
  imagen_url?: string;
  codigo_barras?: string;
  unidad_medida: string;
  impuesto: number;
  impoconsumo: number;
  es_combo: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Mesa {
  id: string;
  restaurante_id: string;
  numero: number;
  nombre?: string;
  capacidad: number;
  ubicacion?: string;
  qr_code_url?: string;
  estado: "libre" | "ocupada" | "pidiendo" | "cuenta_pedida";
  created_at: string;
}

export interface Orden {
  id: string;
  restaurante_id: string;
  numero_orden?: string;
  mesa_id?: string;
  usuario_id: string;
  cliente_nombre?: string;
  tipo: "mostrador" | "mesa" | "delivery";
  estado: "pendiente" | "en_preparacion" | "listo" | "entregado" | "cancelado";
  subtotal: number;
  impuesto: number;
  impoconsumo: number;
  propina: number;
  descuento: number;
  total: number;
  nota?: string;
  created_at: string;
  updated_at: string;
}

export interface DetalleOrden {
  id: string;
  orden_id: string;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  impuesto: number;
  impoconsumo: number;
  nota?: string;
  created_at: string;
}

export interface Pago {
  id: string;
  orden_id: string;
  metodo: "efectivo" | "tarjeta" | "transferencia" | "billetera_digital" | "credito";
  monto: number;
  referencia?: string;
  created_at: string;
}

export interface Caja {
  id: string;
  restaurante_id: string;
  usuario_id: string;
  turno: string;
  monto_inicial: number;
  monto_final?: number;
  estado: "abierta" | "cerrada";
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface MovimientoCaja {
  id: string;
  caja_id: string;
  tipo: "ingreso" | "egreso" | "cortesia";
  concepto: string;
  monto: number;
  referencia_orden_id?: string;
  created_at: string;
}

export interface Inventario {
  id: string;
  restaurante_id: string;
  producto_id?: string;
  nombre: string;
  unidad_medida: string;
  cantidad_actual: number;
  cantidad_minima: number;
  costo_unitario: number;
  created_at: string;
  updated_at: string;
}

export interface Receta {
  id: string;
  restaurante_id: string;
  producto_id: string;
  nombre: string;
  porciones: number;
  created_at: string;
  updated_at: string;
}

export interface IngredienteReceta {
  id: string;
  receta_id: string;
  inventario_id: string;
  cantidad: number;
  created_at: string;
}

export interface Compra {
  id: string;
  restaurante_id: string;
  proveedor_id?: string;
  numero_factura?: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: "pendiente" | "completada" | "cancelada";
  created_at: string;
}

export interface DetalleCompra {
  id: string;
  compra_id: string;
  inventario_id: string;
  cantidad: number;
  costo_unitario: number;
  created_at: string;
}

export interface Proveedor {
  id: string;
  restaurante_id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  created_at: string;
  updated_at: string;
}

export interface BajaInventario {
  id: string;
  restaurante_id: string;
  inventario_id: string;
  cantidad: number;
  motivo: string;
  created_at: string;
}

export interface Produccion {
  id: string;
  restaurante_id: string;
  receta_id: string;
  cantidad_producida: number;
  created_at: string;
}

export interface TicketSoporte {
  id: string;
  restaurante_id: string;
  usuario_id: string;
  asunto: string;
  descripcion: string;
  estado: "abierto" | "en_curso" | "resuelto" | "cerrado";
  created_at: string;
  updated_at: string;
}
