"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Group,
  Text,
  SimpleGrid,
  SegmentedControl,
  Loader,
  Center,
  Table,
  Badge,
  Tabs,
} from "@mantine/core";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency } from "@/lib/utils/format";
import {
  fetchVentasDiarias,
  fetchProductosTop,
  type VentasDiarias,
  type ProductoVendido,
} from "@/lib/services/analytics-service";
import { fetchProductos } from "@/lib/services/producto-service";
import { fetchRecetas } from "@/lib/services/receta-service";
import type { Producto } from "@/types/database";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function ReportesPage() {
  const { restauranteId } = useAuthStore();
  const [tab, setTab] = useState<string>("ventas");
  const [periodo, setPeriodo] = useState<"7" | "30" | "90">("7");
  const [ventas, setVentas] = useState<VentasDiarias[]>([]);
  const [productos, setProductos] = useState<ProductoVendido[]>([]);
  const [productosCat, setProductosCat] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!restauranteId) return;
      setLoading(true);
      const [v, p] = await Promise.all([
        fetchVentasDiarias(restauranteId, Number(periodo)),
        fetchProductosTop(restauranteId),
      ]);
      setVentas(v);
      setProductos(p);

      if (tab === "rentabilidad") {
        const [pc, rc] = await Promise.all([
          fetchProductos(restauranteId),
          fetchRecetas(restauranteId),
        ]);
        setProductosCat(pc);
        setRecetas(rc);
      }

      setLoading(false);
    };
    load();
  }, [restauranteId, periodo, tab]);

  const totalVentas = ventas.reduce((s, v) => s + v.total, 0);
  const totalOrdenes = ventas.reduce((s, v) => s + v.ordenes, 0);

  const recetaMap = new Map(recetas.map((r) => [r.producto_id, r]));

  const rentabilidadData = productosCat.map((p) => {
    const receta = recetaMap.get(p.id);
    const costo = receta?.costo_total ?? p.costo_estimado ?? 0;
    const ventaTotal = productos
      .filter((vp) => vp.producto_nombre === p.nombre)
      .reduce((s, vp) => s + vp.ingresos_generados, 0);
    const cantVendida = productos
      .filter((vp) => vp.producto_nombre === p.nombre)
      .reduce((s, vp) => s + vp.cantidad_total, 0);
    const costoTotal = costo * (p.es_combo ? 1 : cantVendida);
    const margen = p.precio_venta > 0 ? ((p.precio_venta - costo) / p.precio_venta) * 100 : 0;
    return {
      nombre: p.nombre,
      precio: p.precio_venta,
      costo,
      margen,
      ganancia: p.precio_venta - costo,
      ventaTotal,
      costoTotal,
    };
  });

  const margenPromedio = rentabilidadData.length > 0
    ? rentabilidadData.reduce((s, r) => s + r.margen, 0) / rentabilidadData.length
    : 0;

  const gananciaTotal = rentabilidadData.reduce((s, r) => s + r.ganancia, 0);

  if (loading) {
    return (
      <Center h="50vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Container fluid p="lg">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Reportes</Title>
        <Group>
          <Tabs value={tab} onChange={(v) => setTab(v ?? "ventas")}>
            <Tabs.List>
              <Tabs.Tab value="ventas">Ventas</Tabs.Tab>
              <Tabs.Tab value="rentabilidad">Rentabilidad</Tabs.Tab>
            </Tabs.List>
          </Tabs>
          {tab === "ventas" && (
            <SegmentedControl
              value={periodo}
              onChange={(v) => setPeriodo(v as "7" | "30" | "90")}
              data={[
                { label: "7 días", value: "7" },
                { label: "30 días", value: "30" },
                { label: "90 días", value: "90" },
              ]}
            />
          )}
        </Group>
      </Group>

      {tab === "ventas" ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ventas Totales</Text>
              <Text size="xl" fw={700} c="blue">{formatCurrency(totalVentas)}</Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Órdenes</Text>
              <Text size="xl" fw={700}>{totalOrdenes}</Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ticket Promedio</Text>
              <Text size="xl" fw={700} c="green">
                {formatCurrency(totalOrdenes > 0 ? totalVentas / totalOrdenes : 0)}
              </Text>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mb="lg">
            <Paper withBorder p="md" radius="md">
              <Text fw={600} mb="md">Ventas Diarias</Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Text fw={600} mb="md">Productos Más Vendidos</Text>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productos.slice(0, 6)}
                    dataKey="cantidad_total"
                    nameKey="producto_nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ producto_nombre, percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {productos.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </SimpleGrid>

          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="md">Detalle de Productos más Vendidos</Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Producto</Table.Th>
                  <Table.Th>Cantidad Vendida</Table.Th>
                  <Table.Th>Veces Ordenado</Table.Th>
                  <Table.Th>Ingresos Generados</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {productos.map((prod, i) => (
                  <Table.Tr key={prod.producto_nombre}>
                    <Table.Td>{i + 1}</Table.Td>
                    <Table.Td><Text fw={500}>{prod.producto_nombre}</Text></Table.Td>
                    <Table.Td><Badge size="lg" variant="light">{prod.cantidad_total}</Badge></Table.Td>
                    <Table.Td>{prod.veces_vendido}</Table.Td>
                    <Table.Td><Text fw={600} c="blue">{formatCurrency(prod.ingresos_generados)}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Margen Promedio</Text>
              <Text size="xl" fw={700} c={margenPromedio >= 30 ? "green" : margenPromedio >= 15 ? "yellow" : "red"}>
                {margenPromedio.toFixed(1)}%
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ganancia por Producto</Text>
              <Text size="xl" fw={700} c="green">{formatCurrency(gananciaTotal)}</Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Productos con Receta</Text>
              <Text size="xl" fw={700}>{recetas.length} / {productosCat.length}</Text>
            </Paper>
          </SimpleGrid>

          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="md">Rentabilidad por Producto</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Producto</Table.Th>
                  <Table.Th>Precio Venta</Table.Th>
                  <Table.Th>Costo</Table.Th>
                  <Table.Th>Ganancia</Table.Th>
                  <Table.Th>Margen</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rentabilidadData
                  .sort((a, b) => b.margen - a.margen)
                  .map((r) => (
                    <Table.Tr key={r.nombre}>
                      <Table.Td fw={500}>{r.nombre}</Table.Td>
                      <Table.Td>{formatCurrency(r.precio)}</Table.Td>
                      <Table.Td>{formatCurrency(r.costo)}</Table.Td>
                      <Table.Td fw={600}>{formatCurrency(r.ganancia)}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={r.margen >= 30 ? "green" : r.margen >= 15 ? "yellow" : "red"}
                          variant="light"
                          size="lg"
                        >
                          {r.margen.toFixed(0)}%
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </>
      )}
    </Container>
  );
}
