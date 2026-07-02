"use client";

import {IconUsers} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function ProveedoresPage() {
  return (
    <PagePlaceholder
      title="Proveedores"
      description="Directorio de proveedores e historial de compras."
      icon={<IconUsers size={48} />}
    />
  );
}
