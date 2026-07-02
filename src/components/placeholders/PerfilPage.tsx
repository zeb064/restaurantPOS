"use client";

import {IconUser} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function PerfilPage() {
  return (
    <PagePlaceholder
      title="Mi Perfil"
      description="Información personal y preferencias."
      icon={<IconUser size={48} />}
    />
  );
}
