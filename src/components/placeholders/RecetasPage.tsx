"use client";

import {IconPackages} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function RecetasPage() {
  return (
    <PagePlaceholder
      title="Recetas (Escandallos)"
      description="Registro de recetas y descuento automático de inventario."
      icon={<IconPackages size={48} />}
    />
  );
}
