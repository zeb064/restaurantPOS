"use client";

import { Container, Title, Group, Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { MesaMap } from "@/components/mesas/MesaMap";

export default function MesasPage() {
  return (
    <Container fluid p="lg">
      <Group justify="space-between" mb="lg">
        <Title order={3}>Gestión de Mesas</Title>
        <Button leftSection={<IconPlus size={16} />} variant="light">
          Agregar Mesa
        </Button>
      </Group>

      <MesaMap />
    </Container>
  );
}
