"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Group,
  Text,
  Table,
  Badge,
  TextInput,
  Loader,
  Center,
  ActionIcon,
  Pagination,
} from "@mantine/core";
import { IconSearch, IconEye } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { fetchOrdenes } from "@/lib/services/orden-service";
import type { Orden } from "@/types/database";

const estadoBadge: Record<string, [string, string]> = {
  pendiente: ["yellow", "Pendiente"],
  en_preparacion: ["blue", "En Preparación"],
  listo: ["green", "Listo"],
  entregado: ["gray", "Entregado"],
  cancelado: ["red", "Cancelado"],
};

const tipoLabel: Record<string, string> = {
  mostrador: "Mostrador",
  mesa: "Mesa",
  delivery: "Delivery",
};

export default function VentasPage() {
  const { restauranteId } = useAuthStore();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const load = async () => {
      if (!restauranteId) return;
      setLoading(true);
      try {
        const data = await fetchOrdenes(restauranteId);
        setOrdenes(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [restauranteId]);

  const filtered = search
    ? ordenes.filter(
        (o) =>
          o.numero_orden?.toLowerCase().includes(search.toLowerCase()) ||
          o.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
          o.total.toString().includes(search)
      )
    : ordenes;

  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

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
        <Title order={3}>Historial de Ventas</Title>
        <TextInput
          placeholder="Buscar por #orden, cliente..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          maw={300}
        />
      </Group>

      <Paper withBorder radius="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th># Orden</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Estado</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginated.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="xl">
                    No se encontraron ventas
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginated.map((orden) => {
                const [color, label] = estadoBadge[orden.estado] ?? [
                  "gray",
                  orden.estado,
                ];
                return (
                  <Table.Tr key={orden.id}>
                    <Table.Td>
                      <Text fw={600}>
                        {orden.numero_orden ?? orden.id.slice(0, 8).toUpperCase()}
                      </Text>
                    </Table.Td>
                    <Table.Td>{formatDateTime(orden.created_at)}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">
                        {tipoLabel[orden.tipo] ?? orden.tipo}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{orden.cliente_nombre ?? "-"}</Table.Td>
                    <Table.Td>
                      <Text fw={600}>
                        {formatCurrency(Number(orden.total))}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" color={color} variant="light">
                        {label}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>

        {filtered.length > itemsPerPage && (
          <Group justify="center" p="md">
            <Pagination
              total={Math.ceil(filtered.length / itemsPerPage)}
              value={page}
              onChange={setPage}
            />
          </Group>
        )}
      </Paper>
    </Container>
  );
}
