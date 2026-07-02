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
  Table,
  TextInput,
  NumberInput,
  Select,
  Loader,
  Center,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconCheck, IconX } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { fetchCompras, crearCompra, completarCompra, type CompraCompleta } from "@/lib/services/compra-service";
import { fetchProveedores } from "@/lib/services/proveedor-service";
import { fetchInventario } from "@/lib/services/inventario-service";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Inventario, Proveedor } from "@/types/database";

export default function ComprasPage() {
  const { restauranteId } = useAuthStore();
  const [compras, setCompras] = useState<CompraCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [newItems, setNewItems] = useState<{ inventarioId: string; cantidad: number; costoUnitario: number }[]>([]);

  useEffect(() => {
    loadData();
  }, [restauranteId]);

  const loadData = async () => {
    if (!restauranteId) return;
    const [c, p, i] = await Promise.all([
      fetchCompras(restauranteId),
      fetchProveedores(restauranteId),
      fetchInventario(restauranteId),
    ]);
    setCompras(c);
    setProveedores(p);
    setInventario(i);
    setLoading(false);
  };

  const handleCompletar = async (compraId: string) => {
    await completarCompra(compraId);
    loadData();
  };

  const handleCrearCompra = async () => {
    if (!restauranteId) return;
    await crearCompra({
      restauranteId,
      items: newItems,
    });
    setNewItems([]);
    close();
    loadData();
  };

  if (loading) {
    return <Center h="50vh"><Loader /></Center>;
  }

  const estadoColor: Record<string, string> = {
    pendiente: "yellow", completada: "green", cancelada: "red",
  };

  return (
    <Container fluid p="lg">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Compras</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Nueva Compra
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th># Factura</Table.Th>
            <Table.Th>Proveedor</Table.Th>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Subtotal</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {compras.map((c) => (
            <Table.Tr key={c.id}>
              <Table.Td fw={500}>{c.numero_factura || "—"}</Table.Td>
              <Table.Td>{c.proveedor_nombre}</Table.Td>
              <Table.Td>{formatDate(c.created_at)}</Table.Td>
              <Table.Td>{formatCurrency(c.subtotal)}</Table.Td>
              <Table.Td fw={600}>{formatCurrency(c.total)}</Table.Td>
              <Table.Td>
                <Badge color={estadoColor[c.estado]} variant="light">
                  {c.estado}
                </Badge>
              </Table.Td>
              <Table.Td>
                {c.estado === "pendiente" && (
                  <Button
                    size="xs"
                    color="green"
                    leftSection={<IconCheck size={14} />}
                    onClick={() => handleCompletar(c.id)}
                  >
                    Recibir
                  </Button>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Nueva Compra" size="lg">
        <Stack>
          <TextInput label="Número de Factura" placeholder="Opcional" />
          <Select
            label="Proveedor"
            placeholder="Seleccionar proveedor"
            data={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
            clearable
          />

          <Text fw={600} mt="md">Items de la Compra</Text>
          {newItems.map((item, idx) => (
            <Group key={idx} grow>
              <Select
                label="Producto"
                data={inventario.map((i) => ({ value: i.id, label: `${i.nombre} (${formatCurrency(i.costo_unitario)}/${i.unidad_medida})` }))}
                value={item.inventarioId}
                onChange={(v) => {
                  const newItemsCpy = [...newItems];
                  newItemsCpy[idx].inventarioId = v ?? "";
                  newItemsCpy[idx].costoUnitario = inventario.find((i) => i.id === v)?.costo_unitario ?? 0;
                  setNewItems(newItemsCpy);
                }}
              />
              <NumberInput
                label="Cantidad"
                min={0}
                value={item.cantidad}
                onChange={(v) => {
                  const newItemsCpy = [...newItems];
                  newItemsCpy[idx].cantidad = Number(v);
                  setNewItems(newItemsCpy);
                }}
              />
              <NumberInput
                label="Costo Unit."
                min={0}
                value={item.costoUnitario}
                onChange={(v) => {
                  const newItemsCpy = [...newItems];
                  newItemsCpy[idx].costoUnitario = Number(v);
                  setNewItems(newItemsCpy);
                }}
              />
            </Group>
          ))}

          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => setNewItems([...newItems, { inventarioId: "", cantidad: 1, costoUnitario: 0 }])}
          >
            Agregar Item
          </Button>

          {newItems.length > 0 && (
            <Paper p="sm" withBorder>
              <Text fw={600}>Resumen</Text>
              <Text>Total: {formatCurrency(newItems.reduce((s, i) => s + i.cantidad * i.costoUnitario, 0))}</Text>
            </Paper>
          )}

          <Button fullWidth onClick={handleCrearCompra} disabled={newItems.length === 0}>
            Registrar Compra
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
