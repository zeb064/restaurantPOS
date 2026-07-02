"use client";

import { useState } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  TextInput,
  NumberInput,
  Button,
  Group,
  Switch,
  SimpleGrid,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

export default function ImpuestosPage() {
  const [iva, setIva] = useState(19);
  const [impoconsumo, setImpoconsumo] = useState(8);
  const [ivaIncluido, setIvaIncluido] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    notifications.show({
      title: "Configuración guardada",
      message: "Los impuestos se han actualizado correctamente.",
      color: "green",
      icon: <IconCheck size={16} />,
    });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Container fluid p="lg" maw={640}>
      <Title order={3} mb="lg">
        Configuración de Impuestos
      </Title>

      <Paper withBorder p="lg" radius="md">
        <Stack>
          <Text size="sm" c="dimmed">
            Define los impuestos que se aplicarán a los productos de tu
            restaurante. Puedes configurar el IVA y el Impoconsumo.
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <NumberInput
              label="IVA (%)"
              description="Impuesto al Valor Agregado"
              value={iva}
              onChange={(v) => setIva(Number(v) || 0)}
              min={0}
              max={100}
              suffix="%"
            />
            <NumberInput
              label="Impoconsumo (%)"
              description="Impuesto al Consumo"
              value={impoconsumo}
              onChange={(v) => setImpoconsumo(Number(v) || 0)}
              min={0}
              max={100}
              suffix="%"
            />
          </SimpleGrid>

          <Switch
            label="IVA incluido en el precio"
            description="Si está activo, el precio del producto ya incluye el IVA"
            checked={ivaIncluido}
            onChange={(e) => setIvaIncluido(e.currentTarget.checked)}
          />

          <Group>
            <Button onClick={handleSave} leftSection={<IconCheck size={16} />}>
              Guardar Configuración
            </Button>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder p="lg" radius="md" mt="md">
        <Title order={5} mb="sm">
          Impuestos por Producto
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          También puedes configurar impuestos específicos por producto desde el
          módulo de Inventario &gt; Productos. Los valores globales se usarán como
          predeterminados.
        </Text>
        <Button variant="light" component="a" href="/inventario/productos">
          Ir a Productos
        </Button>
      </Paper>
    </Container>
  );
}
