"use client";

import {
  Paper,
  Text,
  Group,
  Stack,
  Button,
  ScrollArea,
  ActionIcon,
  NumberInput,
  TextInput,
  Divider,
  Badge,
} from "@mantine/core";
import { IconTrash, IconPlus, IconMinus, IconShoppingCart } from "@tabler/icons-react";
import { usePOSStore } from "@/lib/store/pos-store";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  onCheckout: () => void;
}

export function CartPanel({ onCheckout }: Props) {
  const {
    cart,
    tipo,
    clienteNombre,
    removeFromCart,
    updateCantidad,
    updateNota,
    clearCart,
    setTipo,
    setMesaId,
  } = usePOSStore();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.producto.precio_venta * item.cantidad,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  return (
        <Paper
      withBorder
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: "md",
      }}
    >
      <Group p="sm" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
        <IconShoppingCart size={20} />
        <Text fw={600} style={{ flex: 1 }}>
          Venta {tipo === "mesa" ? "Mesa" : tipo === "delivery" ? "Delivery" : "Mostrador"}
        </Text>
        {totalItems > 0 && (
          <Badge size="lg" circle>
            {totalItems}
          </Badge>
        )}
      </Group>

      {cart.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
          }}
        >
          <Text c="dimmed" ta="center">
            Selecciona productos para comenzar la venta
          </Text>
        </div>
      ) : (
        <>
          <ScrollArea style={{ flex: 1 }} p="sm">
            <Stack gap="xs">
              {cart.map((item) => (
                <Paper key={item.producto.id} withBorder p="xs" radius="sm">
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" fw={500} style={{ flex: 1 }} lineClamp={1}>
                      {item.producto.nombre}
                    </Text>
                    <ActionIcon
                      size="sm"
                      color="red"
                      variant="subtle"
                      onClick={() => removeFromCart(item.producto.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() =>
                          updateCantidad(
                            item.producto.id,
                            Math.max(1, item.cantidad - 1)
                          )
                        }
                      >
                        <IconMinus size={12} />
                      </ActionIcon>
                      <Text size="sm" fw={600} w={20} ta="center">
                        {item.cantidad}
                      </Text>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() =>
                          updateCantidad(item.producto.id, item.cantidad + 1)
                        }
                      >
                        <IconPlus size={12} />
                      </ActionIcon>
                    </Group>
                    <Text size="sm" fw={600}>
                      {formatCurrency(
                        item.producto.precio_venta * item.cantidad
                      )}
                    </Text>
                  </Group>
                  <TextInput
                    size="xs"
                    placeholder="Nota (opcional)"
                    value={item.nota ?? ""}
                    onChange={(e) =>
                      updateNota(item.producto.id, e.currentTarget.value)
                    }
                    mt={4}
                  />
                </Paper>
              ))}
            </Stack>
          </ScrollArea>

          <Divider />

          <Stack p="sm" gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Subtotal
              </Text>
              <Text size="sm" fw={500}>
                {formatCurrency(subtotal)}
              </Text>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text fw={700}>Total</Text>
              <Text fw={700} size="lg" c="blue">
                {formatCurrency(subtotal)}
              </Text>
            </Group>
            <Group grow>
              <Button variant="light" color="gray" onClick={clearCart}>
                Limpiar
              </Button>
              <Button onClick={onCheckout}>Cobrar ({formatCurrency(subtotal)})</Button>
            </Group>
          </Stack>
        </>
      )}
    </Paper>
  );
}
