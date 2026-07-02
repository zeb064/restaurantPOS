"use client";

import { IconPackages } from "@tabler/icons-react";
import { PagePlaceholder } from "./PagePlaceholder";

export default function InventarioPage() {
  return (
    <PagePlaceholder
      title="Inventario"
      description="Control de stock y alertas de inventario."
      icon={<IconPackages size={48} />}
    />
  );
}
