"use client";

import { Title, Container, Text, Paper, Center, Box } from "@mantine/core";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function PagePlaceholder({ title, description, icon }: Props) {
  return (
    <Container fluid p="lg">
      <Title order={3} mb="lg">
        {title}
      </Title>
      <Paper withBorder p="xl" radius="md">
        <Center>
          <Box ta="center">
            {icon}
            <Text c="dimmed" size="lg" mt="md">
              {description ?? "Módulo en construcción."}
            </Text>
            <Text c="dimmed" size="sm" mt="xs">
              Esta funcionalidad estará disponible próximamente.
            </Text>
          </Box>
        </Center>
      </Paper>
    </Container>
  );
}
