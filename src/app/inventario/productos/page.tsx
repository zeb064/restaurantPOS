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
  TextInput,
  NumberInput,
  Select,
  Loader,
  Center,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconPlus, IconSearch } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { fetchProductos, fetchCategorias } from "@/lib/services/producto-service";
import { fetchInventario } from "@/lib/services/inventario-service";
import type { Producto, Categoria } from "@/types/database";
import { formatCurrency } from "@/lib/utils/format";

export default function ProductosPage() {
  const { restauranteId } = useAuthStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    loadData();
  }, [restauranteId]);

  const loadData = async () => {
    if (!restauranteId) return;
    const [prods, cats] = await Promise.all([
      fetchProductos(restauranteId),
      fetchCategorias(restauranteId),
    ]);
    setProductos(prods);
    setCategorias(cats);
    setLoading(false);
  };

  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <Center h="50vh"><Loader /></Center>;
  }

  const catMap = new Map(categorias.map((c) => [c.id, c.nombre]));

  return (
    <Container fluid p="lg">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Catálogo de Productos</Title>
        <Group>
          <TextInput
            placeholder="Buscar producto..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Nuevo Producto
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
        {filtered.map((p) => {
          const tieneReceta = false;
          const costoEstimado = p.costo_estimado ?? 0;
          const margen = p.precio_venta > 0
            ? ((p.precio_venta - costoEstimado) / p.precio_venta) * 100
            : 0;

          return (
            <Paper key={p.id} withBorder p="md" radius="md">
              <Group justify="space-between" mb="xs">
                <Badge size="sm" variant="light" color="gray">
                  {catMap.get(p.categoria_id) ?? "Sin categoría"}
                </Badge>
                <ActionIcon variant="subtle" size="sm">
                  <IconEdit size={14} />
                </ActionIcon>
              </Group>
              <Text fw={600} size="lg">{p.nombre}</Text>
              <Text size="xs" c="dimmed" mb="xs">{p.descripcion || p.unidad_medida}</Text>
              <Group justify="space-between" mt="auto">
                <div>
                  <Text size="xs" c="dimmed">Precio Venta</Text>
                  <Text fw={700} c="blue">{formatCurrency(p.precio_venta)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Costo</Text>
                  <Text fw={600}>{formatCurrency(costoEstimado)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Margen</Text>
                  <Text fw={600} c={margen >= 30 ? "green" : margen >= 15 ? "yellow" : "red"}>
                    {margen.toFixed(0)}%
                  </Text>
                </div>
              </Group>
              {tieneReceta && (
                <Badge size="xs" variant="filled" color="teal" mt="xs">
                  Tiene receta
                </Badge>
              )}
            </Paper>
          );
        })}
      </SimpleGrid>

      <Modal opened={opened} onClose={close} title="Nuevo Producto" size="lg">
        <Stack>
          <TextInput label="Nombre" placeholder="Nombre del producto" required />
          <TextInput label="Descripción" placeholder="Descripción opcional" />
          <Select
            label="Categoría"
            placeholder="Seleccionar categoría"
            data={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
            required
          />
          <NumberInput label="Precio de Venta" placeholder="0" min={0} required />
          <NumberInput label="Impuesto (%)" placeholder="19" min={0} max={100} />
          <NumberInput label="Impoconsumo (%)" placeholder="0" min={0} max={100} />
          <Select
            label="Unidad de Medida"
            data={["unidad", "kg", "L", "g", "ml", "porción"]}
            defaultValue="unidad"
          />
          <Button fullWidth mt="md">Guardar Producto</Button>
        </Stack>
      </Modal>
    </Container>
  );
}
