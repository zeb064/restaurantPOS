"use client";

import {IconReportAnalytics} from "@tabler/icons-react";
import {PagePlaceholder} from "./PagePlaceholder";

export default function ReportesPage() {
  return (
    <PagePlaceholder
      title="Reportes"
      description="Estadísticas y análisis de ventas."
      icon={<IconReportAnalytics size={48} />}
    />
  );
}
