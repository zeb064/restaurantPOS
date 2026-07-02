"use client";

import { useState, useEffect } from "react";
import {
  SimpleGrid,
  Paper,
  Text,
  Group,
  Title,
  Container,
  RingProgress,
  Badge,
  Table,
  Button,
  Box,
  Loader,
  Stack,
} from "@mantine/core";
import {
  IconShoppingCart,
  IconUsers,
  IconPackage,
  IconCoin,
  IconTrendingUp,
  IconClock,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { canAccessFeature } from "@/lib/utils/plan-utils";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

const mockVentasRecientes = [
  { id: "1", numero: "#000001", total: 45000, tipo: "mostrador", estado: "entregado", creada: new Date().toISOString(), mesero: "Carlos" },
  { id: "2", numero: "#000002", total: 32000, tipo: "mesa", estado: "en_preparacion", creada: new Date().toISOString(), mesero: "Ana" },
  { id: "3", numero: "#000003", total: 28000, tipo: "delivery", estado: "pendiente", creada: new Date().toISOString(), mesero: "Carlos" },
];

const mockStockBajo = [
  { nombre: "Pan hamburguesa", cantidad: 5, minima: 10 },
  { nombre: "Carne molida", cantidad: 8, minima: 15 },
  { nombre: "Queso cheddar", cantidad: 3, minima: 10 },
];

const estadoBadge: Record<string, [string, string]> = {
  pendiente: ["yellow", "Pendiente"],
  en_preparacion: ["blue", "En Preparación"],
  listo: ["green", "Listo"],
  entregado: ["gray", "Entregado"],
  cancelado: ["red", "Cancelado"],
};

export default function DashboardPage() {
  const { plan, nombre, restauranteId } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const canSeeInventory = canAccessFeature(plan, "canManageInventario");

  const statCards = [
    {
      label: "Ventas Hoy",
      value: formatCurrency(1250000),
      sub: "12 órdenes completadas",
      icon: IconShoppingCart,
      color: "blue",
      trend: "+15%",
    },
    {
      label: "Órdenes Activas",
      value: "5",
      sub: "3 en cocina, 2 pendientes",
      icon: IconPackage,
      color: "green",
      trend: null,
    },
    {
      label: "Mesas Ocupadas",
      value: "4/10",
      sub: "60% disponibilidad",
      icon: IconUsers,
      color: "orange",
      trend: null,
    },
    {
      label: "Ticket Promedio",
      value: formatCurrency(28500),
      sub: "vs $26,000 ayer",
      icon: IconTrendingUp,
      color: "violet",
      trend: "+9.5%",
    },
  ];

  if (loading) {
    return (
      <Container fluid p="lg">
        <Loader />
      </Container>
    );
  }

  return (
    <Container fluid p="lg">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={3}>
            Bienvenido, {nombre ?? "Usuario"}
          </Title>
          <Text c="dimmed" size="sm">
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </div>
        <Group>
          <Button variant="light" leftSection={<IconShoppingCart size={16} />}>
            Nueva Venta
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        {statCards.map((stat) => (
          <Paper key={stat.label} withBorder p="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                {stat.label}
              </Text>
              <stat.icon
                size={20}
                style={{ color: `var(--mantine-color-${stat.color}-6)` }}
              />
            </Group>
            <Text size="xl" fw={700}>
              {stat.value}
            </Text>
            <Group justify="space-between" mt={4}>
              <Text size="xs" c="dimmed">
                {stat.sub}
              </Text>
              {stat.trend && (
                <Badge
                  size="sm"
                  variant="light"
                  color={stat.trend.startsWith("+") ? "green" : "red"}
                >
                  {stat.trend}
                </Badge>
              )}
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="md">
            <Text fw={600}>Órdenes Recientes</Text>
            <Button variant="subtle" size="xs">
              Ver todas
            </Button>
          </Group>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {mockVentasRecientes.map((orden) => {
                const [color, label] = estadoBadge[orden.estado] ?? ["gray", orden.estado];
                return (
                  <Table.Tr key={orden.id}>
                    <Table.Td>{orden.numero}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">
                        {orden.tipo}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatCurrency(orden.total)}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" color={color} variant="light">
                        {label}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>

        {canSeeInventory && (
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Stock Bajo</Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => {}}
              >
                Ver inventario
              </Button>
            </Group>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Producto</Table.Th>
                  <Table.Th>Actual</Table.Th>
                  <Table.Th>Mínimo</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mockStockBajo.map((item) => (
                  <Table.Tr key={item.nombre}>
                    <Table.Td>{item.nombre}</Table.Td>
                    <Table.Td>{item.cantidad}</Table.Td>
                    <Table.Td>{item.minima}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" color="red" variant="light">
                        Crítico
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}

        {!canSeeInventory && (
          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="sm">
              Acceso Rápido
            </Text>
            <Stack>
              <Button
                variant="light"
                fullWidth
                leftSection={<IconShoppingCart size={16} />}
              >
                Ir al POS
              </Button>
              <Button
                variant="light"
                fullWidth
                leftSection={<IconClock size={16} />}
              >
                Abrir Caja
              </Button>
              <Button
                variant="light"
                fullWidth
                color="green"
                leftSection={<IconCheck size={16} />}
              >
                Cerrar Caja
              </Button>
            </Stack>
          </Paper>
        )}
      </SimpleGrid>
    </Container>
  );
}
