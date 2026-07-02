"use client";

import {IconPackages} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function BajasPage() {
  return (
    <PagePlaceholder
      title="Bajas de Inventario"
      description="Registro de mermas, pérdidas y productos vencidos."
      icon={<IconPackages size={48} />}
    />
  );
}
