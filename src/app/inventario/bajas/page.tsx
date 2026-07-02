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
  Textarea,
  Table,
  Loader,
  Center,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { fetchInventario } from "@/lib/services/inventario-service";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import type { Inventario, BajaInventario } from "@/types/database";

const mockBajas: BajaInventario[] = [
  { id: "b1", restaurante_id: "1", inventario_id: "i3", cantidad: 0.5, motivo: "Producto vencido", created_at: "2026-06-29T10:00:00Z" },
  { id: "b2", restaurante_id: "1", inventario_id: "i8", cantidad: 1.2, motivo: "Merma en preparación", created_at: "2026-06-30T15:30:00Z" },
  { id: "b3", restaurante_id: "1", inventario_id: "i5", cantidad: 0.3, motivo: "Derrame accidental", created_at: "2026-07-01T09:15:00Z" },
  { id: "b4", restaurante_id: "1", inventario_id: "i11", cantidad: 0.1, motivo: "Producto en mal estado", created_at: "2026-07-01T12:00:00Z" },
];

export default function BajasPage() {
  const { restauranteId } = useAuthStore();
  const [bajas, setBajas] = useState<BajaInventario[]>([]);
  const [items, setItems] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ inventarioId: "", cantidad: 0, motivo: "" });

  useEffect(() => {
    loadData();
  }, [restauranteId]);

  const loadData = async () => {
    if (!restauranteId) return;
    const inv = await fetchInventario(restauranteId);
    setItems(inv);
    setBajas(mockBajas);
    setLoading(false);
  };

  const itemMap = new Map(items.map((i) => [i.id, i]));

  if (loading) {
    return <Center h="50vh"><Loader /></Center>;
  }

  return (
    <Container fluid p="lg">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Bajas de Inventario</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Registrar Baja
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Producto</Table.Th>
            <Table.Th>Cantidad</Table.Th>
            <Table.Th>Motivo</Table.Th>
            <Table.Th>Valor Pérdida</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {bajas.map((b) => {
            const item = itemMap.get(b.inventario_id);
            return (
              <Table.Tr key={b.id}>
                <Table.Td>{formatDateTime(b.created_at)}</Table.Td>
                <Table.Td fw={500}>{item?.nombre ?? "Desconocido"}</Table.Td>
                <Table.Td>
                  <Badge color="red" variant="light">
                    -{b.cantidad} {item?.unidad_medida ?? ""}
                  </Badge>
                </Table.Td>
                <Table.Td>{b.motivo}</Table.Td>
                <Table.Td fw={600} c="red">
                  {item ? formatCurrency(b.cantidad * item.costo_unitario) : "—"}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Registrar Baja de Inventario" size="md">
        <Stack>
          <Select
            label="Producto"
            placeholder="Seleccionar producto"
            data={items.map((i) => ({
              value: i.id,
              label: `${i.nombre} (Stock: ${i.cantidad_actual} ${i.unidad_medida})`,
            }))}
            value={form.inventarioId}
            onChange={(v) => setForm({ ...form, inventarioId: v ?? "" })}
            searchable
            required
          />
          <NumberInput
            label="Cantidad"
            placeholder="0"
            min={0}
            value={form.cantidad}
            onChange={(v) => setForm({ ...form, cantidad: Number(v) })}
            required
          />
          <Select
            label="Motivo"
            placeholder="Seleccionar motivo"
            data={[
              "Producto vencido",
              "Merma en preparación",
              "Derrame accidental",
              "Producto en mal estado",
              "Rotura de empaque",
              "Error de inventario",
              "Otro",
            ]}
            value={form.motivo}
            onChange={(v) => setForm({ ...form, motivo: v ?? "" })}
            required
          />
          {form.motivo === "Otro" && (
            <Textarea
              label="Especifique el motivo"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.currentTarget.value })}
            />
          )}
          <Button fullWidth>Registrar Baja</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
