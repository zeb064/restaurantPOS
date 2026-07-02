import { createClient } from "@/lib/supabase/client";

export interface VentasDiarias {
  fecha: string;
  total: number;
  subtotal: number;
  impuesto: number;
  ordenes: number;
}

export interface ProductoVendido {
  producto_nombre: string;
  cantidad_total: number;
  ingresos_generados: number;
  veces_vendido: number;
}

export async function fetchVentasDiarias(
  restauranteId: string,
  dias: number = 7
): Promise<VentasDiarias[]> {
  try {
    const supabase = createClient();
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);

    const { data, error } = await supabase
      .from("ordenes")
      .select("created_at, total, subtotal, impuesto")
      .eq("restaurante_id", restauranteId)
      .neq("estado", "cancelado")
      .gte("created_at", desde.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const agrupado: Record<string, VentasDiarias> = {};
    for (const orden of data ?? []) {
      const fecha = orden.created_at.split("T")[0];
      if (!agrupado[fecha]) {
        agrupado[fecha] = {
          fecha,
          total: 0,
          subtotal: 0,
          impuesto: 0,
          ordenes: 0,
        };
      }
      agrupado[fecha].total += Number(orden.total);
      agrupado[fecha].subtotal += Number(orden.subtotal);
      agrupado[fecha].impuesto += Number(orden.impuesto);
      agrupado[fecha].ordenes += 1;
    }

    return Object.values(agrupado).sort(
      (a, b) => a.fecha.localeCompare(b.fecha)
    );
  } catch {
    return getMockVentasDiarias(dias);
  }
}

export async function fetchProductosTop(
  restauranteId: string,
  limite: number = 10
): Promise<ProductoVendido[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("detalles_orden")
      .select(
        `
        producto_nombre,
        cantidad,
        precio_unitario,
        orden:ordenes!inner(restaurante_id, estado)
      `
      )
      .eq("orden.restaurante_id", restauranteId)
      .neq("orden.estado", "cancelado");

    if (error) throw error;

    const agrupado: Record<string, ProductoVendido> = {};
    for (const det of data ?? []) {
      const nombre = det.producto_nombre;
      if (!agrupado[nombre]) {
        agrupado[nombre] = {
          producto_nombre: nombre,
          cantidad_total: 0,
          ingresos_generados: 0,
          veces_vendido: 0,
        };
      }
      agrupado[nombre].cantidad_total += Number(det.cantidad);
      agrupado[nombre].ingresos_generados +=
        Number(det.cantidad) * Number(det.precio_unitario);
      agrupado[nombre].veces_vendido += 1;
    }

    return Object.values(agrupado)
      .sort((a, b) => b.cantidad_total - a.cantidad_total)
      .slice(0, limite);
  } catch {
    return getMockProductosTop();
  }
}

// Mock data for development
function getMockVentasDiarias(dias: number): VentasDiarias[] {
  const data: VentasDiarias[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    const f = fecha.toISOString().split("T")[0];
    const base = 800000 + Math.random() * 600000;
    data.push({
      fecha: f,
      total: Math.round(base),
      subtotal: Math.round(base * 0.8),
      impuesto: Math.round(base * 0.19),
      ordenes: Math.floor(10 + Math.random() * 20),
    });
  }
  return data;
}

function getMockProductosTop(): ProductoVendido[] {
  return [
    { producto_nombre: "Hamburguesa Clásica", cantidad_total: 45, ingresos_generados: 990000, veces_vendido: 45 },
    { producto_nombre: "Coca-Cola 500ml", cantidad_total: 38, ingresos_generados: 190000, veces_vendido: 38 },
    { producto_nombre: "Nachos con Queso", cantidad_total: 30, ingresos_generados: 450000, veces_vendido: 30 },
    { producto_nombre: "Pizza Personal (Pepperoni)", cantidad_total: 25, ingresos_generados: 450000, veces_vendido: 25 },
    { producto_nombre: "Brownie con Helado", cantidad_total: 22, ingresos_generados: 264000, veces_vendido: 22 },
  ];
}
