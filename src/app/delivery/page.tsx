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
  Button,
  Select,
  Loader,
  Center,
  Timeline,
  SegmentedControl,
} from "@mantine/core";
import { IconTruck, IconPhone, IconMapPin, IconCheck, IconX, IconMotorbike } from "@tabler/icons-react";
import { fetchDeliveries, actualizarEstadoDelivery, type DeliveryOrden } from "@/lib/services/delivery-service";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

const estadoConfig: Record<string, { color: string; label: string; icon: typeof IconTruck }> = {
  pendiente: { color: "yellow", label: "Pendiente", icon: IconTruck },
  en_preparacion: { color: "blue", label: "En Preparación", icon: IconTruck },
  listo: { color: "green", label: "Listo para enviar", icon: IconCheck },
  en_camino: { color: "violet", label: "En Camino", icon: IconMotorbike },
  entregado: { color: "gray", label: "Entregado", icon: IconCheck },
  cancelado: { color: "red", label: "Cancelado", icon: IconX },
};

export default function DeliveryPage() {
  const { restauranteId } = useAuthStore();
  const [deliveries, setDeliveries] = useState<DeliveryOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("activas");

  useEffect(() => {
    loadDeliveries();
  }, [restauranteId]);

  const loadDeliveries = async () => {
    if (!restauranteId) return;
    setLoading(true);
    const data = await fetchDeliveries(restauranteId);
    setDeliveries(data);
    setLoading(false);
  };

  const handleEstado = async (ordenId: string, estado: string) => {
    await actualizarEstadoDelivery(ordenId, estado);
    setDeliveries((prev) =>
      prev.map((d) => (d.id === ordenId ? { ...d, estado } : d))
    );
  };

  const activas = deliveries.filter((d) => !["entregado", "cancelado"].includes(d.estado));
  const finalizadas = deliveries.filter((d) => ["entregado", "cancelado"].includes(d.estado));

  const displayed = filter === "activas" ? activas : finalizadas;

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
        <Title order={3}>Pedidos Delivery</Title>
        <Group>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            data={[
              { label: `Activas (${activas.length})`, value: "activas" },
              { label: `Finalizadas (${finalizadas.length})`, value: "finalizadas" },
            ]}
          />
          <Badge size="lg" variant="light" color="yellow">
            {activas.length} activas
          </Badge>
        </Group>
      </Group>

      {displayed.length === 0 ? (
        <Paper withBorder p="xl" ta="center">
          <IconTruck size={48} style={{ opacity: 0.3 }} />
          <Text c="dimmed" mt="md">
            No hay pedidos de delivery
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {displayed.map((delivery) => {
            const config = estadoConfig[delivery.estado] ?? { color: "gray", label: delivery.estado, icon: IconTruck };
            const Icono = config.icon;

            return (
              <Paper key={delivery.id} withBorder p="md" radius="md">
                <Stack>
                  <Group justify="space-between">
                    <Group>
                      <Icono size={20} color={`var(--mantine-color-${config.color}-6)`} />
                      <Text fw={700} size="lg">
                        {delivery.numero_orden}
                      </Text>
                    </Group>
                    <Badge color={config.color} variant="light">
                      {config.label}
                    </Badge>
                  </Group>

                  <Group gap="xs">
                    <IconPhone size={14} />
                    <Text size="sm">{delivery.telefono}</Text>
                  </Group>
                  <Group gap="xs">
                    <IconMapPin size={14} />
                    <Text size="sm">{delivery.direccion || "Dirección no especificada"}</Text>
                  </Group>

                  <Text size="sm" c="dimmed">
                    {formatDateTime(delivery.created_at)}
                  </Text>

                  <Text size="sm">
                    <Text fw={600}>{delivery.cliente}</Text>
                  </Text>

                  <Stack gap={2}>
                    {delivery.items.map((item, i) => (
                      <Text key={i} size="xs">
                        {item.cantidad}x {item.nombre}
                      </Text>
                    ))}
                  </Stack>

                  <Text size="xl" fw={700} c="blue">
                    {formatCurrency(delivery.total)}
                  </Text>

                  <Group grow>
                    {delivery.estado === "pendiente" && (
                      <>
                        <Button
                          color="blue"
                          size="sm"
                          onClick={() => handleEstado(delivery.id, "en_preparacion")}
                        >
                          Aceptar
                        </Button>
                        <Button
                          color="red"
                          size="sm"
                          variant="light"
                          onClick={() => handleEstado(delivery.id, "cancelado")}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                    {delivery.estado === "listo" && (
                      <Button
                        color="violet"
                        leftSection={<IconMotorbike size={16} />}
                        onClick={() => handleEstado(delivery.id, "en_camino")}
                      >
                        Asignar Repartidor
                      </Button>
                    )}
                    {delivery.estado === "en_camino" && (
                      <Button
                        color="green"
                        leftSection={<IconCheck size={16} />}
                        onClick={() => handleEstado(delivery.id, "entregado")}
                      >
                        Marcar Entregado
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}
    </Container>
  );
}
