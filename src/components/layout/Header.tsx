"use client";

import {
  Group,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
  AppShellHeader,
} from "@mantine/core";
import {
  IconUser,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getInitials } from "@/lib/utils/format";
import { useRouter } from "next/navigation";

export function Header() {
  const { nombre, logout, restauranteId } = useAuth();
  const router = useRouter();

  return (
    <AppShellHeader px="md">
      <Group h="100%" justify="flex-end" align="center">
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <UnstyledButton>
              <Group gap="sm">
                <Avatar color="blue" radius="xl" size="sm">
                  {nombre ? getInitials(nombre) : "U"}
                </Avatar>
                <Text size="sm" fw={500}>
                  {nombre ?? "Usuario"}
                </Text>
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconUser size={16} />}
              onClick={() => router.push("/configuracion/perfil")}
            >
              Mi Perfil
            </Menu.Item>
            <Menu.Item
              leftSection={<IconSettings size={16} />}
              onClick={() => router.push("/configuracion")}
            >
              Configuración
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconLogout size={16} />}
              color="red"
              onClick={logout}
            >
              Cerrar Sesión
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </AppShellHeader>
  );
}
