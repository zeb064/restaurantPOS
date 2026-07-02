"use client";

import {IconCoin} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function PropinasPage() {
  return (
    <PagePlaceholder
      title="Configuración de Propinas"
      description="Gestión de propinas y distribución."
      icon={<IconCoin size={48} />}
    />
  );
}
