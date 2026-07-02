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
  Button,
  Modal,
  Stack,
  NumberInput,
  Table,
  Loader,
  Center,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconEye, IconCurrencyDollar } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { fetchRecetas, descontarInventario, type RecetaConCosto } from "@/lib/services/receta-service";
import { formatCurrency } from "@/lib/utils/format";

export default function RecetasPage() {
  const { restauranteId } = useAuthStore();
  const [recetas, setRecetas] = useState<RecetaConCosto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RecetaConCosto | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    loadData();
  }, [restauranteId]);

  const loadData = async () => {
    if (!restauranteId) return;
    const data = await fetchRecetas(restauranteId);
    setRecetas(data);
    setLoading(false);
  };

  if (loading) {
    return <Center h="50vh"><Loader /></Center>;
  }

  return (
    <Container fluid p="lg">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Recetas (Escandallos)</Title>
        <Button leftSection={<IconPlus size={16} />}>Nueva Receta</Button>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        {recetas.map((r) => (
          <Paper key={r.id} withBorder p="md" radius="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600} size="lg">{r.nombre}</Text>
              <Group>
                <Badge size="sm" variant="light" color="blue">
                  {r.porciones} porc.
                </Badge>
                <ActionIcon
                  variant="subtle"
                  onClick={() => {
                    setSelected(r);
                    open();
                  }}
                >
                  <IconEye size={16} />
                </ActionIcon>
              </Group>
            </Group>

            <Group justify="space-between" mb="md">
              <div>
                <Text size="xs" c="dimmed">Costo Total</Text>
                <Text fw={700} c="red">
                  {formatCurrency(r.costo_total)}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Costo por Porción</Text>
                <Text fw={700}>{formatCurrency(r.costo_porcion)}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Ingredientes</Text>
                <Text fw={600}>{r.ingredientes.length}</Text>
              </div>
            </Group>

            <Stack gap={4}>
              {r.ingredientes.map((ing) => (
                <Group key={ing.id} justify="space-between">
                  <Text size="sm">{ing.item_nombre}</Text>
                  <Text size="sm" c="dimmed">
                    {ing.cantidad} × {formatCurrency(ing.costo_unitario)}
                  </Text>
                  <Text size="sm" fw={500}>
                    {formatCurrency(ing.cantidad * ing.costo_unitario)}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Modal
        opened={opened}
        onClose={close}
        title={selected?.nombre ?? "Detalle de Receta"}
        size="lg"
      >
        {selected && (
          <Stack>
            <Group>
              <Badge>Costo Total: {formatCurrency(selected.costo_total)}</Badge>
              <Badge color="violet">Costo/Porción: {formatCurrency(selected.costo_porcion)}</Badge>
              <Badge color="blue">{selected.porciones} porciones</Badge>
            </Group>

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ingrediente</Table.Th>
                  <Table.Th>Cantidad</Table.Th>
                  <Table.Th>Costo Unit.</Table.Th>
                  <Table.Th>Subtotal</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selected.ingredientes.map((ing) => (
                  <Table.Tr key={ing.id}>
                    <Table.Td>{ing.item_nombre}</Table.Td>
                    <Table.Td>{ing.cantidad}</Table.Td>
                    <Table.Td>{formatCurrency(ing.costo_unitario)}</Table.Td>
                    <Table.Td fw={600}>{formatCurrency(ing.cantidad * ing.costo_unitario)}</Table.Td>
                  </Table.Tr>
                ))}
                <Table.Tr>
                  <Table.Td fw={700} colSpan={3}>Costo Total</Table.Td>
                  <Table.Td fw={700}>{formatCurrency(selected.costo_total)}</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
