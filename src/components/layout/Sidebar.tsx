"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  AppShellNavbar,
  NavLink,
  Stack,
  Group,
  Text,
  Badge,
  Divider,
} from "@mantine/core";
import {
  IconLayoutDashboard,
  IconShoppingCart,
  IconTable,
  IconChefHat,
  IconPackages,
  IconReportAnalytics,
  IconSettings,
  IconBuildingStore,
  IconTruckDelivery,
  IconUsers,
  IconCoin,
  IconList,
  IconClipboardList,
  IconShoppingBag,
  IconTruck,
  IconAlertTriangle,
  IconFlask,
  IconUser,
  IconPercentage,
  IconCash,
  IconFileText,
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { canAccessFeature, getPlanColor, getPlanName } from "@/lib/utils/plan-utils";
import type { UserRole, PlanPermissions } from "@/types/plans";

interface MenuItem {
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  feature?: keyof PlanPermissions | null;
  roles?: UserRole[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Punto de Venta",
    icon: IconShoppingCart,
    href: "/pos",
  },
  {
    label: "Ventas",
    icon: IconShoppingCart,
    href: "/ventas",
  },
  {
    label: "Caja",
    icon: IconCash,
    href: "/caja",
  },
  {
    label: "Mesas",
    icon: IconTable,
    href: "/mesas",
    feature: "canManageMesas",
  },
  {
    label: "Cocina (KDS)",
    icon: IconChefHat,
    href: "/cocina",
    feature: "canUseKDS",
  },
  {
    label: "Delivery",
    icon: IconTruckDelivery,
    href: "/delivery",
    feature: "canManageDelivery",
  },
  {
    label: "Inventario",
    icon: IconPackages,
    feature: "canManageInventario",
    children: [
      { label: "Dashboard", icon: IconLayoutDashboard, href: "/inventario" },
      { label: "Productos", icon: IconList, href: "/inventario/productos" },
      { label: "Recetas", icon: IconClipboardList, href: "/inventario/recetas" },
      { label: "Compras", icon: IconShoppingBag, href: "/inventario/compras" },
      { label: "Proveedores", icon: IconTruck, href: "/inventario/proveedores" },
      { label: "Bajas", icon: IconAlertTriangle, href: "/inventario/bajas" },
      { label: "Producción", icon: IconFlask, href: "/inventario/produccion" },
    ],
  },
  {
    label: "Reportes",
    icon: IconReportAnalytics,
    href: "/reportes",
  },
  {
    label: "Configuración",
    icon: IconSettings,
    children: [
      { label: "General", icon: IconSettings, href: "/configuracion" },
      { label: "Perfil", icon: IconUser, href: "/configuracion/perfil" },
      { label: "Impuestos", icon: IconPercentage, href: "/configuracion/impuestos" },
      { label: "Propinas", icon: IconCash, href: "/configuracion/propinas" },
      { label: "Precios Múltiples", icon: IconFileText, href: "/configuracion/precios" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { plan, rol } = useAuthStore();

  const isActive = (href: string) => pathname === href;
  const isChildActive = (children: MenuItem[]) =>
    children.some((c) => c.href && pathname.startsWith(c.href));

  const canShow = (item: MenuItem): boolean => {
    if (item.feature && !canAccessFeature(plan, item.feature)) return false;
    if (item.roles && rol && !item.roles.includes(rol)) return false;
    return true;
  };

  return (
    <AppShellNavbar p="xs">
      <Stack h="100%" justify="space-between">
        <Stack gap={0}>
          <Group p="sm" mb="xs">
            <IconBuildingStore size={28} color="var(--mantine-color-blue-6)" />
            <div style={{ flex: 1 }}>
              <Text size="lg" fw={700}>
                Restaurant POS
              </Text>
              {plan && (
                <Badge size="sm" variant="light" color={getPlanColor(plan)}>
                  Plan {getPlanName(plan)}
                </Badge>
              )}
            </div>
          </Group>

          <Divider mb="xs" />

          {menuItems.map((item) => {
            if (!canShow(item)) return null;

            if (item.children) {
              return (
                <NavLink
                  key={item.label}
                  label={item.label}
                  leftSection={<item.icon size={20} />}
                  defaultOpened={isChildActive(item.children)}
                  variant="light"
                >
                  {item.children.map((child) => {
                    if (!canShow(child)) return null;
                    return (
                      <NavLink
                        key={child.href}
                        label={child.label}
                        leftSection={<child.icon size={18} />}
                        active={child.href ? isActive(child.href) : false}
                        onClick={() => child.href && router.push(child.href)}
                        variant="light"
                      />
                    );
                  })}
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.href}
                label={item.label}
                leftSection={<item.icon size={20} />}
                active={item.href ? isActive(item.href) : false}
                onClick={() => item.href && router.push(item.href)}
                variant="light"
              />
            );
          })}

          <Divider my="xs" />

          <NavLink
            label="Soporte Técnico"
            leftSection={<IconCoin size={20} />}
            onClick={() => router.push("/configuracion/soporte")}
            variant="light"
          />
        </Stack>
      </Stack>
    </AppShellNavbar>
  );
}
