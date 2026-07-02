"use client";

import {IconSettings} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function ImpuestosPage() {
  return (
    <PagePlaceholder
      title="Impuestos"
      description="Configuración de IVA e Impoconsumo."
      icon={<IconSettings size={48} />}
    />
  );
}
