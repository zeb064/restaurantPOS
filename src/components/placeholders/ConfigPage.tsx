"use client";

import {IconSettings} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function ConfigPage() {
  return (
    <PagePlaceholder
      title="Configuración"
      description="Panel de configuración del sistema."
      icon={<IconSettings size={48} />}
    />
  );
}
