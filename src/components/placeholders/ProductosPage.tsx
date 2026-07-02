"use client";

import { IconPackages } from "@tabler/icons-react";
import { PagePlaceholder } from "./PagePlaceholder";

export default function ProductosPage() {
  return (
    <PagePlaceholder
      title="Productos"
      description="Catálogo de productos del restaurante."
      icon={<IconPackages size={48} />}
    />
  );
}
