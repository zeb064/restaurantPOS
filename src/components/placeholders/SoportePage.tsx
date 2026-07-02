"use client";

import {IconCoin} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function SoportePage() {
  return (
    <PagePlaceholder
      title="Soporte Técnico"
      description="Centro de ayuda y tickets de soporte."
      icon={<IconCoin size={48} />}
    />
  );
}
