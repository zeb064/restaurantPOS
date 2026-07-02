"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Group,
  Text,
  Button,
  Stack,
  NumberInput,
  Select,
  Table,
  Badge,
  Modal,
  TextInput,
  SimpleGrid,
  Alert,
  Loader,
  Center,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCash, IconPlus, IconX, IconCheck } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import {
  abrirCaja,
  cerrarCaja,
  fetchCajaAbierta,
  registrarMovimiento,
  fetchMovimientos,
  fetchHistorialCajas,
} from "@/lib/services/caja-service";
import type { Caja, MovimientoCaja } from "@/types/database";

export default function CajaPage() {
  const { restauranteId, userId, nombre } = useAuthStore();
  const [cajaActiva, setCajaActiva] = useState<Caja | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [historial, setHistorial] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openModal, { open: openAbrir, close: closeAbrir }] = useDisclosure();
  const [movimientoModal, { open: openMovimiento, close: closeMovimiento }] = useDisclosure();
  const [cierreModal, { open: openCierre, close: closeCierre }] = useDisclosure();

  const [montoInicial, setMontoInicial] = useState(0);
  const [turno, setTurno] = useState("manana");
  const [movTipo, setMovTipo] = useState<"ingreso" | "egreso">("ingreso");
  const [movConcepto, setMovConcepto] = useState("");
  const [movMonto, setMovMonto] = useState(0);
  const [cierreObs, setCierreObs] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [restauranteId]);

  const loadData = async () => {
    if (!restauranteId) return;
    setLoading(true);
    try {
      const [caja, hist] = await Promise.all([
        fetchCajaAbierta(restauranteId),
        fetchHistorialCajas(restauranteId),
      ]);
      setCajaActiva(caja);
      setHistorial(hist);
      if (caja) {
        const movs = await fetchMovimientos(caja.id);
        setMovimientos(movs);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async () => {
    if (!restauranteId || !userId) return;
    setActionLoading(true);
    try {
      await abrirCaja({ restauranteId, usuarioId: userId, turno, montoInicial });
      closeAbrir();
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegistrarMovimiento = async () => {
    if (!cajaActiva) return;
    setActionLoading(true);
    try {
      await registrarMovimiento({
        cajaId: cajaActiva.id,
        tipo: movTipo,
        concepto: movConcepto,
        monto: movMonto,
      });
      closeMovimiento();
      setMovConcepto("");
      setMovMonto(0);
      const movs = await fetchMovimientos(cajaActiva.id);
      setMovimientos(movs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!cajaActiva) return;
    setActionLoading(true);
    try {
      await cerrarCaja(cajaActiva.id, cierreObs);
      closeCierre();
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalIngresos = movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((s, m) => s + Number(m.monto), 0);

  const totalEgresos = movimientos
    .filter((m) => m.tipo === "egreso")
    .reduce((s, m) => s + Number(m.monto), 0);

  if (loading) {
    return (
      <Center h="50vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Container fluid p="lg">
      <Title order={3} mb="lg">
        Arqueo de Caja
      </Title>

      {error && (
        <Alert variant="light" color="red" mb="md" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {cajaActiva ? (
        <Stack>
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <div>
                <Badge color="green" variant="light" size="lg">
                  Caja Abierta
                </Badge>
                <Text size="sm" c="dimmed" mt={4}>
                  Abierta por {nombre} | Turno: {cajaActiva.turno}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatDateTime(cajaActiva.created_at)}
                </Text>
              </div>
              <Group>
                <Button leftSection={<IconPlus size={16} />} onClick={openMovimiento}>
                  Movimiento
                </Button>
                <Button color="red" leftSection={<IconX size={16} />} onClick={openCierre}>
                  Cerrar Caja
                </Button>
              </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Paper withBorder p="md" bg="blue.0">
                <Text size="sm" c="dimmed">
                  Monto Inicial
                </Text>
                <Text size="xl" fw={700}>
                  {formatCurrency(Number(cajaActiva.monto_inicial))}
                </Text>
              </Paper>
              <Paper withBorder p="md" bg="green.0">
                <Text size="sm" c="dimmed">
                  Ingresos
                </Text>
                <Text size="xl" fw={700} c="green">
                  {formatCurrency(totalIngresos)}
                </Text>
              </Paper>
              <Paper withBorder p="md" bg="red.0">
                <Text size="sm" c="dimmed">
                  Egresos
                </Text>
                <Text size="xl" fw={700} c="red">
                  {formatCurrency(totalEgresos)}
                </Text>
              </Paper>
            </SimpleGrid>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="md">
              Movimientos
            </Text>
            {movimientos.length === 0 ? (
              <Text c="dimmed" size="sm">
                No hay movimientos registrados.
              </Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Hora</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Concepto</Table.Th>
                    <Table.Th>Monto</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {movimientos.map((mov) => (
                    <Table.Tr key={mov.id}>
                      <Table.Td>{formatDateTime(mov.created_at)}</Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={
                            mov.tipo === "ingreso"
                              ? "green"
                              : mov.tipo === "egreso"
                                ? "red"
                                : "yellow"
                          }
                        >
                          {mov.tipo}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{mov.concepto}</Table.Td>
                      <Table.Td>
                        <Text
                          fw={600}
                          c={mov.tipo === "ingreso" ? "green" : "red"}
                        >
                          {formatCurrency(Number(mov.monto))}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Stack>
      ) : (
        <Paper withBorder p="xl" radius="md" ta="center">
          <IconCash size={48} style={{ opacity: 0.3 }} />
          <Title order={4} mt="md">
            No hay caja abierta
          </Title>
          <Text c="dimmed" size="sm" mb="lg">
            Apertura una caja para comenzar a registrar ventas
          </Text>
          <Button size="lg" onClick={openAbrir}>
            Abrir Caja
          </Button>
        </Paper>
      )}

      <Modal
        opened={openModal}
        onClose={closeAbrir}
        title="Abrir Caja"
        size="sm"
      >
        <Stack>
          <Select
            label="Turno"
            data={[
              { value: "manana", label: "Mañana (06:00 - 14:00)" },
              { value: "tarde", label: "Tarde (14:00 - 22:00)" },
              { value: "noche", label: "Noche (22:00 - 06:00)" },
            ]}
            value={turno}
            onChange={(v) => setTurno(v ?? "manana")}
          />
          <NumberInput
            label="Monto inicial"
            value={montoInicial}
            onChange={(v) => setMontoInicial(Number(v) || 0)}
            min={0}
            step={10000}
          />
          <Button onClick={handleAbrirCaja} loading={actionLoading}>
            Abrir Caja
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={movimientoModal}
        onClose={closeMovimiento}
        title="Registrar Movimiento"
        size="sm"
      >
        <Stack>
          <Select
            label="Tipo"
            data={[
              { value: "ingreso", label: "Ingreso" },
              { value: "egreso", label: "Egreso" },
            ]}
            value={movTipo}
            onChange={(v) => setMovTipo(v as "ingreso" | "egreso")}
          />
          <TextInput
            label="Concepto"
            placeholder="Ej: Compra de insumos, Retiro personal..."
            value={movConcepto}
            onChange={(e) => setMovConcepto(e.currentTarget.value)}
          />
          <NumberInput
            label="Monto"
            value={movMonto}
            onChange={(v) => setMovMonto(Number(v) || 0)}
            min={0}
            step={1000}
          />
          <Button onClick={handleRegistrarMovimiento} loading={actionLoading}>
            Registrar
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={cierreModal}
        onClose={closeCierre}
        title="Cerrar Caja"
        size="sm"
      >
        <Stack>
          <Paper withBorder p="md" bg="gray.0">
            <Group justify="space-between">
              <Text>Monto Inicial</Text>
              <Text fw={600}>
                {formatCurrency(Number(cajaActiva?.monto_inicial ?? 0))}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text>Ingresos</Text>
              <Text c="green" fw={600}>
                {formatCurrency(totalIngresos)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text>Egresos</Text>
              <Text c="red" fw={600}>
                {formatCurrency(totalEgresos)}
              </Text>
            </Group>
            <Divider my="sm" />
            <Group justify="space-between">
              <Text fw={700}>Saldo Esperado</Text>
              <Text fw={700} size="lg">
                {formatCurrency(
                  Number(cajaActiva?.monto_inicial ?? 0) + totalIngresos - totalEgresos
                )}
              </Text>
            </Group>
          </Paper>
          <TextInput
            label="Observaciones (opcional)"
            placeholder="Notas sobre el cierre..."
            value={cierreObs}
            onChange={(e) => setCierreObs(e.currentTarget.value)}
          />
          <Button color="red" onClick={handleCerrarCaja} loading={actionLoading}>
            Confirmar Cierre
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
