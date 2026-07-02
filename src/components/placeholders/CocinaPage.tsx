"use client";

import { IconChefHat } from "@tabler/icons-react";
import { PagePlaceholder } from "./PagePlaceholder";

export default function CocinaPage() {
  return (
    <PagePlaceholder
      title="Cocina (KDS)"
      description="Pantalla interactiva de cocina con pedidos en tiempo real."
      icon={<IconChefHat size={48} />}
    />
  );
}
