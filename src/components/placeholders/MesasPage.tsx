"use client";

import { IconTable } from "@tabler/icons-react";
import { PagePlaceholder } from "./PagePlaceholder";

export default function MesasPage() {
  return (
    <PagePlaceholder
      title="Gestión de Mesas"
      description="Mapa interactivo de mesas con estados en tiempo real."
      icon={<IconTable size={48} />}
    />
  );
}
