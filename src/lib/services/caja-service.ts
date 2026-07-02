import { createClient } from "@/lib/supabase/client";

export interface AbrirCajaInput {
  restauranteId: string;
  usuarioId: string;
  turno: string;
  montoInicial: number;
}

export interface MovimientoInput {
  cajaId: string;
  tipo: "ingreso" | "egreso" | "cortesia";
  concepto: string;
  monto: number;
  referenciaOrdenId?: string;
}

export async function abrirCaja(input: AbrirCajaInput) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cajas")
    .insert({
      restaurante_id: input.restauranteId,
      usuario_id: input.usuarioId,
      turno: input.turno,
      monto_inicial: input.montoInicial,
      estado: "abierta",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cerrarCaja(cajaId: string, observaciones?: string) {
  const supabase = createClient();

  const { data: ventasPeriodo, error: ventasError } = await supabase.rpc(
    "cerrar_caja",
    {
      p_caja_id: cajaId,
      p_observaciones: observaciones || null,
    }
  );

  if (ventasError) throw ventasError;
  return ventasPeriodo;
}

export async function fetchCajaAbierta(restauranteId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cajas")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .eq("estado", "abierta")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

export async function registrarMovimiento(input: MovimientoInput) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("movimientos_caja")
    .insert({
      caja_id: input.cajaId,
      tipo: input.tipo,
      concepto: input.concepto,
      monto: input.monto,
      referencia_orden_id: input.referenciaOrdenId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMovimientos(cajaId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("movimientos_caja")
    .select("*")
    .eq("caja_id", cajaId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function fetchHistorialCajas(restauranteId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cajas")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
