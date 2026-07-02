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
  Select,
  Table,
  Loader,
  Center,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconFlask } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { fetchRecetas, type RecetaConCosto } from "@/lib/services/receta-service";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import type { Produccion } from "@/types/database";

const mockProducciones: (Produccion & { receta_nombre: string })[] = [
  { id: "prod1", restaurante_id: "1", receta_id: "r1", cantidad_producida: 10, created_at: "2026-07-01T08:00:00Z", receta_nombre: "Hamburguesa Clásica" },
  { id: "prod2", restaurante_id: "1", receta_id: "r3", cantidad_producida: 5, created_at: "2026-07-01T08:30:00Z", receta_nombre: "Pizza Personal Pepperoni" },
];

export default function ProduccionPage() {
  const { restauranteId } = useAuthStore();
  const [producciones, setProducciones] = useState<any[]>([]);
  const [recetas, setRecetas] = useState<RecetaConCosto[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ recetaId: "", cantidad: 1 });

  useEffect(() => {
    loadData();
  }, [restauranteId]);

  const loadData = async () => {
    if (!restauranteId) return;
    const r = await fetchRecetas(restauranteId);
    setRecetas(r);
    setProducciones(mockProducciones);
    setLoading(false);
  };

  const recetaMap = new Map(recetas.map((r) => [r.id, r]));

  if (loading) {
    return <Center h="50vh"><Loader /></Center>;
  }

  const selectedReceta = form.recetaId ? recetaMap.get(form.recetaId) : null;

  return (
    <Container fluid p="lg">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Producción</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Nueva Producción
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Receta</Table.Th>
            <Table.Th>Cantidad</Table.Th>
            <Table.Th>Costo Total</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {producciones.map((p) => {
            const receta = recetaMap.get(p.receta_id);
            return (
              <Table.Tr key={p.id}>
                <Table.Td>{formatDateTime(p.created_at)}</Table.Td>
                <Table.Td fw={500}>{p.receta_nombre}</Table.Td>
                <Table.Td>
                  <Badge size="lg" variant="light" color="blue">
                    {p.cantidad_producida}
                  </Badge>
                </Table.Td>
                <Table.Td fw={600}>
                  {receta ? formatCurrency(receta.costo_total * p.cantidad_producida) : "—"}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Nueva Producción" size="md">
        <Stack>
          <Select
            label="Receta a Producir"
            placeholder="Seleccionar receta"
            data={recetas.map((r) => ({
              value: r.id,
              label: `${r.nombre} (Costo: ${formatCurrency(r.costo_total)})`,
            }))}
            value={form.recetaId}
            onChange={(v) => setForm({ ...form, recetaId: v ?? "" })}
            searchable
            required
          />
          <NumberInput
            label="Cantidad a Producir"
            placeholder="1"
            min={1}
            value={form.cantidad}
            onChange={(v) => setForm({ ...form, cantidad: Number(v) })}
            required
          />
          {selectedReceta && (
            <Paper p="sm" withBorder>
              <Text fw={600} mb="xs">Resumen de Costos</Text>
              <Text size="sm">
                Costo unitario: {formatCurrency(selectedReceta.costo_total)}
              </Text>
              <Text size="sm" fw={700}>
                Costo total: {formatCurrency(selectedReceta.costo_total * form.cantidad)}
              </Text>
            </Paper>
          )}
          <Group>
            <Text size="xs" c="dimmed">
              Al registrar la producción se descontarán los ingredientes del inventario
            </Text>
          </Group>
          <Button fullWidth disabled={!form.recetaId || form.cantidad < 1}>
            Registrar Producción
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
