"use client";

import { IconTruckDelivery } from "@tabler/icons-react";
import { PagePlaceholder } from "./PagePlaceholder";

export default function DeliveryPage() {
  return (
    <PagePlaceholder
      title="Delivery"
      description="Gestión de pedidos a domicilio y repartidores."
      icon={<IconTruckDelivery size={48} />}
    />
  );
}
