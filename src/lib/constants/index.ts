export const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta de Crédito/Débito" },
  { value: "transferencia", label: "Transferencia Bancaria" },
  { value: "billetera_digital", label: "Billetera Digital" },
  { value: "credito", label: "Crédito / Cuenta por Cobrar" },
] as const;

export const ESTADOS_ORDEN = [
  { value: "pendiente", label: "Pendiente", color: "yellow" },
  { value: "en_preparacion", label: "En Preparación", color: "blue" },
  { value: "listo", label: "Listo", color: "green" },
  { value: "entregado", label: "Entregado", color: "gray" },
  { value: "cancelado", label: "Cancelado", color: "red" },
] as const;

export const ESTADOS_MESA = [
  { value: "libre", label: "Libre", color: "green" },
  { value: "ocupada", label: "Ocupada", color: "red" },
  { value: "pidiendo", label: "Pidiendo", color: "blue" },
  { value: "cuenta_pedida", label: "Cuenta Pedida", color: "yellow" },
] as const;

export const TIPOS_ORDEN = [
  { value: "mostrador", label: "Mostrador" },
  { value: "mesa", label: "Mesa" },
  { value: "delivery", label: "Delivery" },
] as const;

export const TURNOS_CAJA = [
  { value: "manana", label: "Mañana (06:00 - 14:00)" },
  { value: "tarde", label: "Tarde (14:00 - 22:00)" },
  { value: "noche", label: "Noche (22:00 - 06:00)" },
] as const;

export const UNIDADES_MEDIDA = [
  { value: "unidad", label: "Unidad" },
  { value: "kilogramo", label: "Kilogramo (kg)" },
  { value: "gramo", label: "Gramo (g)" },
  { value: "litro", label: "Litro (L)" },
  { value: "mililitro", label: "Mililitro (ml)" },
  { value: "libra", label: "Libra (lb)" },
  { value: "onza", label: "Onza (oz)" },
  { value: "docena", label: "Docena" },
  { value: "porcion", label: "Porción" },
] as const;

export const MOTIVOS_CORTESIA = [
  { value: "mercadeo", label: "Mercadeo / Promoción" },
  { value: "error_cocina", label: "Error de Cocina" },
  { value: "error_mesero", label: "Error de Mesero" },
  { value: "cliente_frecuente", label: "Cliente Frecuente" },
  { value: "queja", label: "Queja del Cliente" },
  { value: "otro", label: "Otro" },
] as const;

export const ITEMS_PER_PAGE = 20;
