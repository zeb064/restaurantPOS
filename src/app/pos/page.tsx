"use client";

import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { usePOSStore } from "@/lib/store/pos-store";
import type { Producto } from "@/types/database";
import { SegmentedControl, Group, Box } from "@mantine/core";

export default function POSPage() {
  const [paymentOpened, { open: openPayment, close: closePayment }] = useDisclosure();
  const { addToCart, tipo, setTipo } = usePOSStore();

  const handleSelectProducto = (producto: Producto) => {
    addToCart({ producto, cantidad: 1 });
  };

  return (
    <Box style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Group p="sm" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
          <SegmentedControl
            value={tipo}
            onChange={(val) => setTipo(val as "mostrador" | "mesa" | "delivery")}
            data={[
              { label: "Mostrador", value: "mostrador" },
              { label: "Mesa", value: "mesa" },
              { label: "Delivery", value: "delivery" },
            ]}
          />
        </Group>
        <ProductGrid onSelectProducto={handleSelectProducto} />
      </div>

      <div
        style={{
          width: 380,
          flexShrink: 0,
          borderLeft: "1px solid var(--mantine-color-gray-2)",
        }}
      >
        <CartPanel onCheckout={openPayment} />
      </div>

      <PaymentModal opened={paymentOpened} onClose={closePayment} />
    </Box>
  );
}
