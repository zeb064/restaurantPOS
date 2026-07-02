"use client";

import { useState, useEffect } from "react";
import {
  SimpleGrid,
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Badge,
  ActionIcon,
  Image,
  TextInput,
  Loader,
  Center,
  SegmentedControl,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconQrcode, IconX } from "@tabler/icons-react";
import { MesaCard } from "./MesaCard";
import { fetchMesas, actualizarEstadoMesa, generarQRMesa } from "@/lib/services/mesa-service";
import type { Mesa } from "@/types/database";
import { useAuthStore } from "@/lib/store/auth-store";

export function MesaMap() {
  const { restauranteId } = useAuthStore();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todas");
  const [qrMesa, setQrMesa] = useState<Mesa | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [qrModal, { open: openQr, close: closeQr }] = useDisclosure();

  useEffect(() => {
    loadMesas();
  }, [restauranteId]);

  const loadMesas = async () => {
    if (!restauranteId) return;
    setLoading(true);
    const data = await fetchMesas(restauranteId);
    setMesas(data);
    setLoading(false);
  };

  const handleCambiarEstado = async (mesaId: string, estado: Mesa["estado"]) => {
    await actualizarEstadoMesa(mesaId, estado);
    setMesas((prev) =>
      prev.map((m) => (m.id === mesaId ? { ...m, estado } : m))
    );
  };

  const handleVerQR = async (mesa: Mesa) => {
    setQrMesa(mesa);
    const url = await generarQRMesa(restauranteId!, mesa.id, mesa.numero);
    setQrUrl(url);
    openQr();
  };

  const filtered =
    filter === "todas"
      ? mesas
      : mesas.filter((m) => m.estado === filter);

  const counts = {
    todas: mesas.length,
    libre: mesas.filter((m) => m.estado === "libre").length,
    ocupada: mesas.filter((m) => m.estado === "ocupada").length,
    pidiendo: mesas.filter((m) => m.estado === "pidiendo").length,
    cuenta_pedida: mesas.filter((m) => m.estado === "cuenta_pedida").length,
  };

  if (loading) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    );
  }

  return (
    <>
      <Group mb="md">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          data={[
            { label: `Todas (${counts.todas})`, value: "todas" },
            { label: `Libres (${counts.libre})`, value: "libre" },
            { label: `Ocupadas (${counts.ocupada})`, value: "ocupada" },
            { label: `Pidiendo (${counts.pidiendo})`, value: "pidiendo" },
            { label: `Cuenta (${counts.cuenta_pedida})`, value: "cuenta_pedida" },
          ]}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing="md">
        {filtered.map((mesa) => (
          <MesaCard
            key={mesa.id}
            mesa={mesa}
            onSeleccionar={(m) => handleCambiarEstado(m.id, m.estado === "libre" ? "ocupada" : m.estado)}
            onCambiarEstado={handleCambiarEstado}
            onVerQR={handleVerQR}
          />
        ))}
      </SimpleGrid>

      <Modal
        opened={qrModal}
        onClose={closeQr}
        title={`QR - ${qrMesa?.nombre ?? `Mesa ${qrMesa?.numero}`}`}
        size="sm"
      >
        <Stack align="center">
          {qrUrl && (
            <Image
              src={qrUrl}
              alt={`QR Mesa ${qrMesa?.numero}`}
              w={250}
              h={250}
              fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEyNSIgeT0iMTI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzY2NiI+UXI8L3RleHQ+PC9zdmc+"
            />
          )}
          <TextInput
            value={qrMesa ? `${window.location.origin}/menu/${restauranteId}?mesa=${qrMesa.id}` : ""}
            readOnly
            w="100%"
            size="xs"
          />
          <Text size="xs" c="dimmed" ta="center">
            Escanea para ver el menú digital. Los clientes pueden hacer pedidos
            desde su propio dispositivo.
          </Text>
        </Stack>
      </Modal>
    </>
  );
}
