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
  Loader,
  Center,
  Table,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconEdit, IconPhone, IconMail, IconMapPin } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { fetchProveedores, crearProveedor } from "@/lib/services/proveedor-service";
import type { Proveedor } from "@/types/database";

export default function ProveedoresPage() {
  const { restauranteId } = useAuthStore();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ nombre: "", contacto: "", telefono: "", email: "", direccion: "" });

  useEffect(() => {
    loadData();
  }, [restauranteId]);

  const loadData = async () => {
    if (!restauranteId) return;
    const data = await fetchProveedores(restauranteId);
    setProveedores(data);
    setLoading(false);
  };

  const handleCrear = async () => {
    if (!restauranteId || !form.nombre) return;
    await crearProveedor({
      restaurante_id: restauranteId,
      ...form,
    });
    setForm({ nombre: "", contacto: "", telefono: "", email: "", direccion: "" });
    close();
    loadData();
  };

  if (loading) {
    return <Center h="50vh"><Loader /></Center>;
  }

  return (
    <Container fluid p="lg">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Proveedores</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Nuevo Proveedor
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {proveedores.map((p) => (
          <Paper key={p.id} withBorder p="md" radius="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600} size="lg">{p.nombre}</Text>
              <ActionIcon variant="subtle">
                <IconEdit size={16} />
              </ActionIcon>
            </Group>
            {p.contacto && (
              <Text size="sm" c="dimmed" mb="xs">
                Contacto: {p.contacto}
              </Text>
            )}
            {p.telefono && (
              <Group gap="xs" mb="xs">
                <IconPhone size={14} />
                <Text size="sm">{p.telefono}</Text>
              </Group>
            )}
            {p.email && (
              <Group gap="xs" mb="xs">
                <IconMail size={14} />
                <Text size="sm">{p.email}</Text>
              </Group>
            )}
            {p.direccion && (
              <Group gap="xs">
                <IconMapPin size={14} />
                <Text size="sm">{p.direccion}</Text>
              </Group>
            )}
          </Paper>
        ))}
      </SimpleGrid>

      <Modal opened={opened} onClose={close} title="Nuevo Proveedor" size="md">
        <Stack>
          <TextInput
            label="Nombre"
            placeholder="Nombre del proveedor"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.currentTarget.value })}
          />
          <TextInput
            label="Persona de Contacto"
            placeholder="Nombre del contacto"
            value={form.contacto}
            onChange={(e) => setForm({ ...form, contacto: e.currentTarget.value })}
          />
          <TextInput
            label="Teléfono"
            placeholder="+57 300 000 0000"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.currentTarget.value })}
          />
          <TextInput
            label="Email"
            placeholder="proveedor@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
          />
          <TextInput
            label="Dirección"
            placeholder="Dirección del proveedor"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.currentTarget.value })}
          />
          <Button fullWidth onClick={handleCrear} disabled={!form.nombre}>
            Guardar Proveedor
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
