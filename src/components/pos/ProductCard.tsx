"use client";

import { UnstyledButton, Paper, Text, Group, Stack } from "@mantine/core";
import type { Producto } from "@/types/database";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  producto: Producto;
  onSelect: (producto: Producto) => void;
}

export function ProductCard({ producto, onSelect }: Props) {
  return (
    <UnstyledButton
      onClick={() => onSelect(producto)}
      style={{ textDecoration: "none" }}
    >
      <Paper
        withBorder
        p="sm"
        radius="md"
        style={{
          cursor: "pointer",
          transition: "all 0.15s ease",
          height: "100%",
        }}
        className="hover:shadow-md hover:border-blue-400"
      >
        <Stack gap={4} h="100%" justify="space-between">
          <div>
            <Text size="sm" fw={600} lineClamp={2}>
              {producto.nombre}
            </Text>
            {producto.descripcion && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {producto.descripcion}
              </Text>
            )}
          </div>
          <Group justify="space-between" align="center">
            <Text size="lg" fw={700} c="blue">
              {formatCurrency(producto.precio_venta)}
            </Text>
            {producto.precio_delivery && (
              <Text size="xs" c="dimmed">
                D: {formatCurrency(producto.precio_delivery)}
              </Text>
            )}
          </Group>
        </Stack>
      </Paper>
    </UnstyledButton>
  );
}
