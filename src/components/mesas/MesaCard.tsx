"use client";

import { Paper, Text, Group, Badge, Stack, ActionIcon, Menu } from "@mantine/core";
import { IconUsers, IconQrcode, IconShoppingCart, IconCheck, IconDoorEnter } from "@tabler/icons-react";
import type { Mesa } from "@/types/database";

interface Props {
  mesa: Mesa;
  onSeleccionar: (mesa: Mesa) => void;
  onCambiarEstado: (mesaId: string, estado: Mesa["estado"]) => void;
  onVerQR: (mesa: Mesa) => void;
}

const estadoConfig: Record<string, { color: string; label: string }> = {
  libre: { color: "green", label: "Libre" },
  ocupada: { color: "red", label: "Ocupada" },
  pidiendo: { color: "blue", label: "Pidiendo" },
  cuenta_pedida: { color: "yellow", label: "Cuenta Pedida" },
};

export function MesaCard({ mesa, onSeleccionar, onCambiarEstado, onVerQR }: Props) {
  const config = estadoConfig[mesa.estado] ?? { color: "gray", label: mesa.estado };

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{
        cursor: "pointer",
        transition: "all 0.15s ease",
        borderLeft: `4px solid var(--mantine-color-${config.color}-6)`,
      }}
      className="hover:shadow-md"
      onClick={() => onSeleccionar(mesa)}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="xl" fw={700}>
            {mesa.nombre ?? `Mesa ${mesa.numero}`}
          </Text>
          <Badge color={config.color} variant="light" size="lg">
            {config.label}
          </Badge>
        </Group>

        <Group gap="xs">
          <IconUsers size={14} />
          <Text size="sm" c="dimmed">
            {mesa.capacidad} {mesa.capacidad === 1 ? "persona" : "personas"}
          </Text>
          {mesa.ubicacion && (
            <Text size="xs" c="dimmed">
              | {mesa.ubicacion}
            </Text>
          )}
        </Group>

        <Group gap="xs" mt="xs">
          {mesa.estado === "libre" && (
            <ActionIcon
              size="sm"
              color="blue"
              variant="light"
              onClick={(e) => {
                e.stopPropagation();
                onCambiarEstado(mesa.id, "ocupada");
              }}
            >
              <IconDoorEnter size={14} />
            </ActionIcon>
          )}
          {mesa.estado === "ocupada" && (
            <>
              <ActionIcon
                size="sm"
                color="blue"
                variant="light"
                onClick={(e) => {
                  e.stopPropagation();
                  onCambiarEstado(mesa.id, "pidiendo");
                }}
              >
                <IconShoppingCart size={14} />
              </ActionIcon>
              <ActionIcon
                size="sm"
                color="yellow"
                variant="light"
                onClick={(e) => {
                  e.stopPropagation();
                  onCambiarEstado(mesa.id, "cuenta_pedida");
                }}
              >
                <IconCheck size={14} />
              </ActionIcon>
            </>
          )}
          {(mesa.estado === "pidiendo" || mesa.estado === "cuenta_pedida") && (
            <ActionIcon
              size="sm"
              color="green"
              variant="light"
              onClick={(e) => {
                e.stopPropagation();
                onCambiarEstado(mesa.id, "libre");
              }}
            >
              <IconDoorEnter size={14} />
            </ActionIcon>
          )}
          <ActionIcon
            size="sm"
            variant="light"
            onClick={(e) => {
              e.stopPropagation();
              onVerQR(mesa);
            }}
          >
            <IconQrcode size={14} />
          </ActionIcon>
        </Group>
      </Stack>
    </Paper>
  );
}
