"use client";

import { useEffect, useState } from "react";
import { Paper, Text, Group, Badge, Stack, Button, Divider, ActionIcon } from "@mantine/core";
import { IconClock, IconChefHat, IconCheck } from "@tabler/icons-react";
import type { KDSOrden } from "@/lib/services/kds-service";

interface Props {
  orden: KDSOrden;
  onActualizarEstado: (ordenId: string, estado: string) => void;
}

export function OrderTicket({ orden, onActualizarEstado }: Props) {
  const [tiempo, setTiempo] = useState(orden.tiempo);

  useEffect(() => {
    const interval = setInterval(() => {
      setTiempo((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const tiempoColor =
    tiempo < 10 ? "green" : tiempo < 20 ? "yellow" : "red";

  const estadoColor =
    orden.estado === "pendiente"
      ? "yellow"
      : orden.estado === "en_preparacion"
        ? "blue"
        : "green";

  const estadoLabel =
    orden.estado === "pendiente"
      ? "Pendiente"
      : orden.estado === "en_preparacion"
        ? "En Preparación"
        : "Listo";

  const timerStyle = {
    animation: tiempo > 15 ? "pulse 1s ease-in-out infinite" : "none",
  };

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{
        borderLeft: `4px solid var(--mantine-color-${estadoColor}-6)`,
        transition: "all 0.2s",
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Group>
            <Text size="xl" fw={700}>
              {orden.numero_orden}
            </Text>
            <Badge size="sm" variant="light">
              {orden.tipo}
            </Badge>
          </Group>
          <Group gap={4} style={timerStyle}>
            <IconClock size={16} color={`var(--mantine-color-${tiempoColor}-6)`} />
            <Text fw={700} c={tiempoColor}>
              {tiempo < 60 ? `${tiempo} min` : `${Math.floor(tiempo / 60)}h ${tiempo % 60}m`}
            </Text>
          </Group>
        </Group>

        <Group gap="xs">
          <Badge size="sm" variant="light" color="gray">
            {orden.mesa}
          </Badge>
          <Badge size="sm" variant="light" color="gray">
            {orden.mesero}
          </Badge>
          <Badge size="sm" color={estadoColor} variant="light">
            {estadoLabel}
          </Badge>
        </Group>

        <Divider />

        <Stack gap={4}>
          {orden.items.map((item) => (
            <Group key={item.id} justify="space-between">
              <Text size="sm">
                <Text component="span" fw={600}>
                  {item.cantidad}x
                </Text>{" "}
                {item.nombre}
              </Text>
              {item.nota && (
                <Badge size="sm" color="orange" variant="dot">
                  {item.nota}
                </Badge>
              )}
            </Group>
          ))}
        </Stack>

        {orden.nota && (
          <Paper withBorder p="xs" bg="yellow.0">
            <Text size="xs" c="orange">
              Nota: {orden.nota}
            </Text>
          </Paper>
        )}

        <Group grow>
          {orden.estado === "pendiente" && (
            <Button
              leftSection={<IconChefHat size={16} />}
              color="blue"
              onClick={() => onActualizarEstado(orden.id, "en_preparacion")}
            >
              Tomar Orden
            </Button>
          )}
          {orden.estado === "en_preparacion" && (
            <Button
              leftSection={<IconCheck size={16} />}
              color="green"
              onClick={() => onActualizarEstado(orden.id, "listo")}
            >
              Marcar Listo
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
