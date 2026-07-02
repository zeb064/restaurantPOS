"use client";

import { useState } from "react";
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  SegmentedControl,
  NumberInput,
  TextInput,
  Divider,
  Paper,
  Badge,
  Alert,
  SimpleGrid,
} from "@mantine/core";
import { IconCash, IconCreditCard, IconBuildingBank, IconDeviceMobile, IconCheck } from "@tabler/icons-react";
import { usePOSStore } from "@/lib/store/pos-store";
import { formatCurrency } from "@/lib/utils/format";
import { calcularTotales, crearOrden } from "@/lib/services/orden-service";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo", icon: IconCash },
  { value: "tarjeta", label: "Tarjeta", icon: IconCreditCard },
  { value: "transferencia", label: "Transferencia", icon: IconBuildingBank },
  { value: "billetera_digital", label: "Billetera", icon: IconDeviceMobile },
  { value: "credito", label: "Crédito", icon: IconBuildingBank },
];

export function PaymentModal({ opened, onClose }: Props) {
  const router = useRouter();
  const { restauranteId, userId } = useAuthStore();
  const {
    cart,
    tipo,
    mesaId,
    clienteNombre,
    payment,
    setPayment,
    setClienteNombre,
    resetPayment,
    clearCart,
    reset,
  } = usePOSStore();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cortesiaMotivo, setCortesiaMotivo] = useState("");

  const { subtotal, impuesto, total, impoconsumo } = calcularTotales();
  const cambio = payment.metodo === "efectivo" ? Math.max(0, payment.monto - total) : 0;

  const handlePagar = async () => {
    if (!restauranteId || !userId) return;
    setLoading(true);
    setError(null);

    if (total === 0 && !cortesiaMotivo) {
      setError("Debes ingresar un motivo para la cortesía");
      setLoading(false);
      return;
    }

    try {
      const orden = await crearOrden({
        restauranteId,
        usuarioId: userId,
        tipo,
        mesaId,
        propina: payment.propina,
        descuento: payment.descuento,
      });

      setOrderId(orden.id);
      setSuccess(true);
      reset();
    } catch (err: any) {
      setError(err.message ?? "Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setOrderId(null);
    setError(null);
    setCortesiaMotivo("");
    resetPayment();
    onClose();
  };

  const handleWhatsApp = () => {
    if (!orderId) return;
    const telefono = prompt("Número de teléfono del cliente:", "+57");
    if (telefono) {
      const url = `https://wa.me/${telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Factura #${orderId.slice(0, 8).toUpperCase()} - Total: $${new Intl.NumberFormat("es-CO").format(total)}`
      )}`;
      window.open(url, "_blank");
    }
  };

  if (success) {
    return (
      <Modal
        opened={opened}
        onClose={handleClose}
        title="Venta Completada"
        size="md"
        closeOnClickOutside={false}
      >
        <Stack align="center" py="lg" gap="md">
          <IconCheck size={64} color="green" />
          <Text size="xl" fw={700}>
            ¡Venta exitosa!
          </Text>
          <Badge size="lg" variant="light" color="blue">
            #{(orderId ?? "").slice(0, 8).toUpperCase()}
          </Badge>
          <Paper withBorder p="md" w="100%" ta="center">
            <Text size="2rem" fw={700} c="blue">
              {formatCurrency(total)}
            </Text>
            <Text size="sm" c="dimmed">
              {payment.metodo === "efectivo" && `Recibido: ${formatCurrency(payment.monto)} | Cambio: ${formatCurrency(cambio)}`}
              {payment.metodo !== "efectivo" && `Pagado con ${METODOS_PAGO.find((m) => m.value === payment.metodo)?.label}`}
            </Text>
          </Paper>
          <Group>
            <Button variant="light" onClick={handleWhatsApp}>
              Enviar por WhatsApp
            </Button>
            <Button onClick={handleClose}>Nueva Venta</Button>
          </Group>
        </Stack>
      </Modal>
    );
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Cobrar" size="lg">
      <Stack>
        {error && (
          <Alert variant="light" color="red" title="Error">
            {error}
          </Alert>
        )}

        <Paper withBorder p="sm" bg="gray.0">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Subtotal
            </Text>
            <Text size="sm">{formatCurrency(subtotal)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Impuesto
            </Text>
            <Text size="sm">{formatCurrency(impuesto)}</Text>
          </Group>
          <Divider my="xs" />
          <Group justify="space-between">
            <Text fw={700}>Total</Text>
            <Text fw={700} size="xl" c="blue">
              {formatCurrency(total)}
            </Text>
          </Group>
        </Paper>

        <div>
          <Text size="sm" fw={500} mb="xs">
            Método de pago
          </Text>
          <SimpleGrid cols={5} spacing="xs">
            {METODOS_PAGO.map((metodo) => (
              <Button
                key={metodo.value}
                variant={payment.metodo === metodo.value ? "filled" : "light"}
                onClick={() => setPayment({ metodo: metodo.value as any })}
                style={{ flexDirection: "column", height: 60 }}
              >
                <metodo.icon size={20} />
                <Text size="xs" mt={2}>
                  {metodo.label}
                </Text>
              </Button>
            ))}
          </SimpleGrid>
        </div>

        {payment.metodo === "efectivo" && (
          <NumberInput
            label="Monto recibido"
            placeholder="0"
            value={payment.monto}
            onChange={(val) => setPayment({ monto: Number(val) || 0 })}
            min={0}
            step={1000}
            decimalScale={0}
          />
        )}

        {payment.metodo === "credito" && (
          <TextInput
            label="Nombre del cliente (para crédito)"
            placeholder="Nombre del cliente"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.currentTarget.value)}
          />
        )}

        <Group grow>
          <NumberInput
            label="Propina"
            placeholder="0"
            value={payment.propina}
            onChange={(val) => setPayment({ propina: Number(val) || 0 })}
            min={0}
            step={1000}
          />
          <NumberInput
            label="Descuento"
            placeholder="0"
            value={payment.descuento}
            onChange={(val) => setPayment({ descuento: Number(val) || 0 })}
            min={0}
            step={1000}
          />
        </Group>

        {total === 0 && (
          <TextInput
            label="Motivo de cortesía (descuento 100%)"
            placeholder="Ej: Mercadeo, Error de cocina, Cliente frecuente..."
            value={cortesiaMotivo}
            onChange={(e) => setCortesiaMotivo(e.currentTarget.value)}
            required
          />
        )}

        {payment.metodo === "efectivo" && payment.monto > 0 && (
          <Paper withBorder p="sm" bg={cambio >= 0 ? "green.0" : "red.0"}>
            <Group justify="space-between">
              <Text fw={600} c={cambio >= 0 ? "green" : "red"}>
                {cambio >= 0 ? "Cambio" : "Faltante"}
              </Text>
              <Text fw={700} size="lg" c={cambio >= 0 ? "green" : "red"}>
                {formatCurrency(Math.abs(cambio))}
              </Text>
            </Group>
          </Paper>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handlePagar}
          loading={loading}
          disabled={cart.length === 0}
        >
          Cobrar {formatCurrency(total)}
        </Button>
      </Stack>
    </Modal>
  );
}
