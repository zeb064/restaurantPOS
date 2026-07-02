"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  SimpleGrid,
  Paper,
  Text,
  Group,
  Badge,
  Stack,
  Progress,
  Loader,
  Center,
  Divider,
  Alert,
} from "@mantine/core";
import { IconAlertTriangle, IconPackages, IconCoin, IconAlertCircle } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { fetchInventario, getAlertasStock, calcularValorInventario, type StockAlert } from "@/lib/services/inventario-service";
import { formatCurrency } from "@/lib/utils/format";

export default function InventarioDashboardPage() {
  const { restauranteId } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [restauranteId]);

  const loadData = async () => {
    if (!restauranteId) return;
    const [data, alerts] = await Promise.all([
      fetchInventario(restauranteId),
      getAlertasStock(restauranteId),
    ]);
    setItems(data);
    setAlertas(alerts);
    setLoading(false);
  };

  if (loading) {
    return <Center h="50vh"><Loader /></Center>;
  }

  const valorTotal = calcularValorInventario(items);
  const totalItems = items.length;
  const bajoStock = alertas.length;

  return (
    <Container fluid p="lg">
      <Title order={3} mb="lg">Dashboard de Inventario</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group>
            <IconPackages size={28} style={{ color: "var(--mantine-color-blue-6)" }} />
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Items</Text>
              <Text size="xl" fw={700}>{totalItems}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group>
            <IconCoin size={28} style={{ color: "var(--mantine-color-green-6)" }} />
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Valor Inventario</Text>
              <Text size="xl" fw={700}>{formatCurrency(valorTotal)}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group>
            <IconAlertTriangle size={28} style={{ color: bajoStock > 0 ? "var(--mantine-color-red-6)" : "var(--mantine-color-green-6)" }} />
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Alertas de Stock</Text>
              <Text size="xl" fw={700} c={bajoStock > 0 ? "red" : "green"}>{bajoStock}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group>
            <IconAlertCircle size={28} style={{ color: "var(--mantine-color-yellow-6)" }} />
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Costo Promedio</Text>
              <Text size="xl" fw={700}>{formatCurrency(totalItems > 0 ? valorTotal / totalItems : 0)}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {alertas.length > 0 && (
        <Paper withBorder p="md" radius="md" mb="xl">
          <Group mb="md">
            <IconAlertTriangle size={20} color="red" />
            <Text fw={600}>Alertas de Stock Bajo</Text>
          </Group>
          <Stack>
            {alertas.map((alerta) => (
              <Paper key={alerta.item.id} p="sm" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text fw={500}>{alerta.item.nombre}</Text>
                  <Badge color="red" variant="light">
                    Déficit: {alerta.deficit} {alerta.item.unidad_medida}
                  </Badge>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed">Actual: {alerta.item.cantidad_actual} {alerta.item.unidad_medida}</Text>
                  <Text size="sm" c="dimmed">| Mínimo: {alerta.item.cantidad_minima} {alerta.item.unidad_medida}</Text>
                </Group>
                <Progress
                  value={Math.min(100, (alerta.item.cantidad_actual / alerta.item.cantidad_minima) * 100)}
                  color="red"
                  mt="xs"
                  size="sm"
                />
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper withBorder p="md" radius="md">
        <Title order={5} mb="md">Todos los Items de Inventario</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
          {items.map((item) => {
            const pct = item.cantidad_minima > 0
              ? Math.min(100, (item.cantidad_actual / item.cantidad_minima) * 100)
              : 100;
            const isLow = item.cantidad_actual < item.cantidad_minima;
            return (
              <Paper key={item.id} withBorder p="sm" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={500} size="sm">{item.nombre}</Text>
                  <Badge size="sm" color={isLow ? "red" : "green"} variant="light">
                    {item.cantidad_actual} {item.unidad_medida}
                  </Badge>
                </Group>
                <Progress value={pct} color={isLow ? "red" : "blue"} size="xs" />
                <Group justify="space-between" mt="xs">
                  <Text size="xs" c="dimmed">Min: {item.cantidad_minima}</Text>
                  <Text size="xs" fw={500}>{formatCurrency(item.costo_unitario)}/{item.unidad_medida}</Text>
                </Group>
              </Paper>
            );
          })}
        </SimpleGrid>
      </Paper>
    </Container>
  );
}
