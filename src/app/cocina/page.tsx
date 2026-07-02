"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Title,
  SimpleGrid,
  Group,
  SegmentedControl,
  Badge,
  Text,
  Loader,
  Center,
  Affix,
  Button,
  Paper,
} from "@mantine/core";
import { IconRefresh, IconChefHat } from "@tabler/icons-react";
import { OrderTicket } from "@/components/cocina/OrderTicket";
import { fetchOrdenesKDS, actualizarEstadoKDS, type KDSOrden } from "@/lib/services/kds-service";
import { useAuthStore } from "@/lib/store/auth-store";

export default function CocinaPage() {
  const { restauranteId } = useAuthStore();
  const [ordenes, setOrdenes] = useState<KDSOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todas");

  const loadOrdenes = useCallback(async () => {
    if (!restauranteId) return;
    const data = await fetchOrdenesKDS(restauranteId);
    setOrdenes(data);
    setLoading(false);
  }, [restauranteId]);

  useEffect(() => {
    loadOrdenes();
    const interval = setInterval(loadOrdenes, 30000);
    return () => clearInterval(interval);
  }, [loadOrdenes]);

  const handleActualizarEstado = async (ordenId: string, estado: string) => {
    await actualizarEstadoKDS(ordenId, estado);
    setOrdenes((prev) =>
      prev.map((o) => (o.id === ordenId ? { ...o, estado } : o))
    );
  };

  const pendientes = ordenes.filter((o) => o.estado === "pendiente");
  const enPreparacion = ordenes.filter((o) => o.estado === "en_preparacion");

  const displayed =
    filter === "todas"
      ? ordenes
      : filter === "pendiente"
        ? pendientes
        : enPreparacion;

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container fluid p="lg" style={{ background: "#f8f9fa", minHeight: "calc(100vh - 60px)" }}>
      <Group justify="space-between" mb="lg">
        <Group>
          <Title order={3}>Cocina (KDS)</Title>
          <Badge size="lg" color="yellow" variant="light">
            {pendientes.length} pendientes
          </Badge>
          <Badge size="lg" color="blue" variant="light">
            {enPreparacion.length} en cocina
          </Badge>
        </Group>
        <Group>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            data={[
              { label: "Todas", value: "todas" },
              { label: `Pendientes (${pendientes.length})`, value: "pendiente" },
              { label: `En Cocina (${enPreparacion.length})`, value: "en_preparacion" },
            ]}
          />
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={loadOrdenes}
          >
            Refrescar
          </Button>
        </Group>
      </Group>

      {displayed.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <IconChefHat size={48} style={{ opacity: 0.3 }} />
          <Text size="lg" c="dimmed" mt="md">
            No hay órdenes pendientes
          </Text>
          <Text size="sm" c="dimmed">
            Las nuevas órdenes aparecerán aquí automáticamente en tiempo real
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {displayed.map((orden) => (
            <OrderTicket
              key={orden.id}
              orden={orden}
              onActualizarEstado={handleActualizarEstado}
            />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
