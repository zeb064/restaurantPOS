import { createClient } from "@/lib/supabase/client";
import type { Compra, DetalleCompra, Inventario } from "@/types/database";

export interface CompraCompleta extends Compra {
  proveedor_nombre?: string;
  detalles: (DetalleCompra & { item_nombre: string })[];
}

const mockCompras: CompraCompleta[] = [
  {
    id: "c1", restaurante_id: "1", proveedor_id: "pr1", numero_factura: "FAC-001",
    subtotal: 120000, impuesto: 22800, total: 142800,
    estado: "completada", created_at: "2026-06-28T10:00:00Z",
    proveedor_nombre: "Distribuidora ABC",
    detalles: [
      { id: "dc1", compra_id: "c1", inventario_id: "i1", cantidad: 10, costo_unitario: 18000, created_at: "", item_nombre: "Carne de Res (kg)" },
      { id: "dc2", compra_id: "c1", inventario_id: "i4", cantidad: 20, costo_unitario: 3000, created_at: "", item_nombre: "Papa (kg)" },
    ],
  },
  {
    id: "c2", restaurante_id: "1", proveedor_id: "pr2", numero_factura: "FAC-002",
    subtotal: 85000, impuesto: 16150, total: 101150,
    estado: "pendiente", created_at: "2026-06-30T14:30:00Z",
    proveedor_nombre: "Bebidas del Valle",
    detalles: [
      { id: "dc3", compra_id: "c2", inventario_id: "i7", cantidad: 24, costo_unitario: 3200, created_at: "", item_nombre: "Coca-Cola 500ml (und)" },
    ],
  },
];

export async function fetchCompras(restauranteId: string): Promise<CompraCompleta[]> {
  try {
    const supabase = createClient();
    const { data: compras, error } = await supabase
      .from("compras")
      .select("*, proveedor:proveedores!left(nombre)")
      .eq("restaurante_id", restauranteId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;
    if (!compras?.length) return mockCompras;

    return await Promise.all(
      compras.map(async (c) => {
        const { data: detalles } = await supabase
          .from("detalles_compra")
          .select("*, inventario:inventario!inner(nombre)")
          .eq("compra_id", c.id);

        return {
          ...c,
          proveedor_nombre: (c as any).proveedor?.nombre ?? "—",
          detalles: (detalles ?? []).map((d: any) => ({
            id: d.id,
            compra_id: d.compra_id,
            inventario_id: d.inventario_id,
            cantidad: Number(d.cantidad),
            costo_unitario: Number(d.costo_unitario),
            created_at: d.created_at,
            item_nombre: d.inventario?.nombre ?? "Desconocido",
          })),
        };
      })
    );
  } catch {
    return mockCompras;
  }
}

export async function crearCompra(input: {
  restauranteId: string;
  proveedorId?: string;
  numeroFactura?: string;
  items: { inventarioId: string; cantidad: number; costoUnitario: number }[];
}) {
  const supabase = createClient();
  const subtotal = input.items.reduce((s, i) => s + i.cantidad * i.costoUnitario, 0);
  const impuesto = subtotal * 0.19;
  const total = subtotal + impuesto;

  const { data: compra, error: compraError } = await supabase
    .from("compras")
    .insert({
      restaurante_id: input.restauranteId,
      proveedor_id: input.proveedorId || null,
      numero_factura: input.numeroFactura || null,
      subtotal,
      impuesto,
      total,
      estado: "pendiente",
    })
    .select()
    .single();

  if (compraError) throw compraError;

  const detalles = input.items.map((item) => ({
    compra_id: compra.id,
    inventario_id: item.inventarioId,
    cantidad: item.cantidad,
    costo_unitario: item.costoUnitario,
  }));

  const { error: detError } = await supabase
    .from("detalles_compra")
    .insert(detalles);

  if (detError) {
    await supabase.from("compras").delete().eq("id", compra.id);
    throw detError;
  }

  return compra;
}

export async function completarCompra(compraId: string) {
  const supabase = createClient();

  const { data: detalles, error: detError } = await supabase
    .from("detalles_compra")
    .select("*")
    .eq("compra_id", compraId);

  if (detError) throw detError;

  for (const det of detalles ?? []) {
    const { data: item } = await supabase
      .from("inventario")
      .select("*")
      .eq("id", det.inventario_id)
      .single();

    if (item) {
      const nuevaCantidad = Number(item.cantidad_actual) + Number(det.cantidad);
      await supabase
        .from("inventario")
        .update({
          cantidad_actual: nuevaCantidad,
          costo_unitario: det.costo_unitario,
        })
        .eq("id", det.inventario_id);
    }
  }

  const { error } = await supabase
    .from("compras")
    .update({ estado: "completada" })
    .eq("id", compraId);

  if (error) throw error;
}
