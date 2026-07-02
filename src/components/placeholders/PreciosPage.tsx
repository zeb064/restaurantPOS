"use client";

import {IconSettings} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function PreciosPage() {
  return (
    <PagePlaceholder
      title="Lista de Precios Múltiples"
      description="Precios diferenciados por canal de venta."
      icon={<IconSettings size={48} />}
    />
  );
}
