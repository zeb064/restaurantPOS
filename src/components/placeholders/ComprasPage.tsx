"use client";

import {IconPackages} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function ComprasPage() {
  return (
    <PagePlaceholder
      title="Compras"
      description="Registro de compras y actualización de stock."
      icon={<IconPackages size={48} />}
    />
  );
}
