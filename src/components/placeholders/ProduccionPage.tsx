"use client";

import {IconPackages} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function ProduccionPage() {
  return (
    <PagePlaceholder
      title="Producción"
      description="Preparaciones base y producción masiva."
      icon={<IconPackages size={48} />}
    />
  );
}
