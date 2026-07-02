import { createClient } from "@/lib/supabase/client";
import { usePOSStore } from "@/lib/store/pos-store";

export interface CrearOrdenInput {
  restauranteId: string;
  usuarioId: string;
  tipo: "mostrador" | "mesa" | "delivery";
  mesaId?: string | null;
  clienteNombre?: string;
  propina: number;
  descuento: number;
  nota?: string;
}

export function calcularTotales() {
  const { cart, payment } = usePOSStore.getState();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.producto.precio_venta * item.cantidad,
    0
  );

  let impuesto = 0;
  let impoconsumo = 0;

  for (const item of cart) {
    const itemSubtotal = item.producto.precio_venta * item.cantidad;
    impuesto += itemSubtotal * (item.producto.impuesto / 100);
    impoconsumo += itemSubtotal * (item.producto.impoconsumo / 100);
  }

  const total = subtotal + impuesto + impoconsumo + payment.propina - payment.descuento;

  return { subtotal, impuesto, impoconsumo, total };
}

export async function crearOrden(input: CrearOrdenInput) {
  const supabase = createClient();
  const { cart, payment } = usePOSStore.getState();
  const { subtotal, impuesto, impoconsumo, total } = calcularTotales();

  const { data: orden, error: ordenError } = await supabase
    .from("ordenes")
    .insert({
      restaurante_id: input.restauranteId,
      usuario_id: input.usuarioId,
      tipo: input.tipo,
      mesa_id: input.mesaId || null,
      cliente_nombre: input.clienteNombre || null,
      subtotal,
      impuesto,
      impoconsumo,
      propina: payment.propina,
      descuento: payment.descuento,
      total,
      nota: input.nota || null,
      estado: "pendiente",
    })
    .select()
    .single();

  if (ordenError) throw ordenError;

  const detalles = cart.map((item) => ({
    orden_id: orden.id,
    producto_id: item.producto.id,
    producto_nombre: item.producto.nombre,
    cantidad: item.cantidad,
    precio_unitario: item.producto.precio_venta,
    impuesto: item.producto.impuesto,
    impoconsumo: item.producto.impoconsumo,
    nota: item.nota || null,
  }));

  const { error: detError } = await supabase
    .from("detalles_orden")
    .insert(detalles);

  if (detError) {
    await supabase.from("ordenes").delete().eq("id", orden.id);
    throw detError;
  }

  const { error: pagoError } = await supabase.from("pagos").insert({
    orden_id: orden.id,
    metodo: payment.metodo,
    monto: total,
    referencia: payment.referencia || null,
  });

  if (pagoError) {
    await supabase.from("detalles_orden").delete().eq("orden_id", orden.id);
    await supabase.from("ordenes").delete().eq("id", orden.id);
    throw pagoError;
  }

  return orden;
}

export async function fetchOrdenes(restauranteId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ordenes")
    .select("*, detalles:detalles_orden(*), pagos:pagos(*)")
    .eq("restaurante_id", restauranteId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function actualizarEstadoOrden(ordenId: string, estado: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ordenes")
    .update({ estado })
    .eq("id", ordenId);

  if (error) throw error;
}

export function generarEnlaceWhatsApp(ordenId: string, telefono: string) {
  const { cart } = usePOSStore.getState();
  const { subtotal, impuesto, total } = calcularTotales();

  let mensaje = "*FACTURA DE VENTA*%0A";
  mensaje += `Orden: #${ordenId.slice(0, 8).toUpperCase()}%0A`;
  mensaje += `Fecha: ${new Date().toLocaleDateString("es-CO")}%0A%0A`;
  mensaje += "*DETALLE:*%0A";

  for (const item of cart) {
    const itemTotal = item.producto.precio_venta * item.cantidad;
    mensaje += `${item.cantidad}x ${item.producto.nombre} - $${itemTotal.toLocaleString("es-CO")}%0A`;
  }

  mensaje += `%0A*Subtotal:* $${subtotal.toLocaleString("es-CO")}`;
  mensaje += `%0A*Impuesto:* $${impuesto.toLocaleString("es-CO")}`;
  mensaje += `%0A*Total:* $${total.toLocaleString("es-CO")}`;
  mensaje += `%0A%0A¡Gracias por tu compra!`;

  const telefonoLimpio = telefono.replace(/[^0-9]/g, "");
  return `https://wa.me/${telefonoLimpio || "57"}?text=${mensaje}`;
}
