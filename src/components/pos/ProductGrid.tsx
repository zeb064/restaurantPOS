"use client";

import { useState, useEffect } from "react";
import {
  SimpleGrid,
  Tabs,
  ScrollArea,
  TextInput,
  Group,
  Loader,
  Center,
  Text,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { ProductCard } from "./ProductCard";
import { fetchCategorias, fetchProductos } from "@/lib/services/producto-service";
import type { Categoria, Producto } from "@/types/database";
import { useAuthStore } from "@/lib/store/auth-store";

interface Props {
  onSelectProducto: (producto: Producto) => void;
}

export function ProductGrid({ onSelectProducto }: Props) {
  const { restauranteId } = useAuthStore();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!restauranteId) return;
      const cats = await fetchCategorias(restauranteId);
      setCategorias(cats);
      if (cats.length > 0) setCategoriaActiva(cats[0].id);
    };
    load();
  }, [restauranteId]);

  useEffect(() => {
    const load = async () => {
      if (!restauranteId || !categoriaActiva) return;
      setLoading(true);
      const prods = await fetchProductos(restauranteId, categoriaActiva);
      setProductos(prods);
      setLoading(false);
    };
    load();
  }, [restauranteId, categoriaActiva]);

  const productosFiltrados = search
    ? productos.filter((p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase())
      )
    : productos;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Group p="sm" pb={0}>
        <TextInput
          placeholder="Buscar producto..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
      </Group>

      <Tabs
        value={categoriaActiva}
        onChange={setCategoriaActiva}
        variant="pills"
        p="sm"
      >
        <Tabs.List>
          {categorias.map((cat) => (
            <Tabs.Tab key={cat.id} value={cat.id}>
              {cat.nombre}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <ScrollArea style={{ flex: 1 }} p="sm" pt={0}>
        {loading ? (
          <Center h={200}>
            <Loader size="sm" />
          </Center>
        ) : productosFiltrados.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">No hay productos en esta categoría</Text>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing="sm">
            {productosFiltrados.map((prod) => (
              <ProductCard
                key={prod.id}
                producto={prod}
                onSelect={onSelectProducto}
              />
            ))}
          </SimpleGrid>
        )}
      </ScrollArea>
    </div>
  );
}
