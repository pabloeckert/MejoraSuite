import * as XLSX from "xlsx";

/**
 * Export data to Excel (.xlsx) file.
 * Automatically adjusts column widths based on content.
 */

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
}

export function exportToExcel({ filename, sheetName = "Datos", columns, data }: ExportOptions) {
  // Build rows from columns
  const rows = data.map((row) => {
    const out: Record<string, any> = {};
    for (const col of columns) {
      out[col.header] = row[col.key] ?? "";
    }
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws["!cols"] = columns.map((col) => ({
    wch: col.width || Math.max(col.header.length, 12),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Add BOM for proper UTF-8 in Excel
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Pre-built export for clients
 */
export function exportClientsExcel(clients: any[]) {
  exportToExcel({
    filename: `clientes_mejoracrm_${new Date().toISOString().slice(0, 10)}`,
    sheetName: "Clientes",
    columns: [
      { header: "Nombre", key: "name", width: 30 },
      { header: "Empresa", key: "company", width: 25 },
      { header: "Contacto", key: "contact_name", width: 20 },
      { header: "WhatsApp", key: "whatsapp", width: 18 },
      { header: "Email", key: "email", width: 25 },
      { header: "Rubro", key: "segment", width: 15 },
      { header: "Canal", key: "channel", width: 15 },
      { header: "País", key: "country", width: 12 },
      { header: "Provincia", key: "province", width: 15 },
      { header: "Localidad", key: "location", width: 15 },
      { header: "Dirección", key: "address", width: 25 },
      { header: "Estado", key: "status", width: 10 },
      { header: "Observaciones", key: "notes", width: 30 },
    ],
    data: clients,
  });
}

/**
 * Pre-built export for interactions
 */
export function exportInteractionsExcel(interactions: any[]) {
  const RESULT_LABELS: Record<string, string> = {
    presupuesto: "Envié un presupuesto",
    venta: "Cerré una venta",
    seguimiento: "Hice un seguimiento",
    sin_respuesta: "Sin respuesta",
    no_interesado: "No le interesó",
  };

  const MEDIUM_LABELS: Record<string, string> = {
    whatsapp: "WhatsApp", llamada: "Llamada", email: "Email",
    reunion_presencial: "Reunión presencial", reunion_virtual: "Reunión virtual",
    md_instagram: "Instagram", md_facebook: "Facebook", md_linkedin: "LinkedIn",
    visita_campo: "Visita a campo",
  };

  exportToExcel({
    filename: `interacciones_mejoracrm_${new Date().toISOString().slice(0, 10)}`,
    sheetName: "Interacciones",
    columns: [
      { header: "Fecha", key: "interaction_date", width: 12 },
      { header: "Cliente", key: "client_name", width: 30 },
      { header: "Resultado", key: "result_label", width: 22 },
      { header: "Medio", key: "medium_label", width: 18 },
      { header: "Monto", key: "total_amount", width: 15 },
      { header: "Moneda", key: "currency", width: 8 },
      { header: "Motivo rechazo", key: "loss_reason", width: 20 },
      { header: "Pérdida estimada", key: "estimated_loss", width: 15 },
      { header: "Próximo paso", key: "next_step", width: 25 },
      { header: "Seguimiento", key: "follow_up_date", width: 12 },
      { header: "Observaciones", key: "notes", width: 30 },
    ],
    data: interactions.map((i) => ({
      ...i,
      client_name: i.clients?.name || "",
      result_label: RESULT_LABELS[i.result] || i.result,
      medium_label: MEDIUM_LABELS[i.medium] || i.medium,
    })),
  });
}

/**
 * Pre-built export for products
 */
export function exportProductsExcel(products: any[]) {
  const CURRENCY_SYMBOLS: Record<string, string> = { ARS: "$", USD: "USD", EUR: "€" };

  exportToExcel({
    filename: `productos_mejoracrm_${new Date().toISOString().slice(0, 10)}`,
    sheetName: "Productos",
    columns: [
      { header: "Nombre", key: "name", width: 25 },
      { header: "Descripción", key: "description", width: 35 },
      { header: "Categoría", key: "category", width: 15 },
      { header: "Unidad", key: "unit_label", width: 12 },
      { header: "Moneda", key: "currency", width: 8 },
      { header: "Precio", key: "price", width: 12 },
      { header: "Activo", key: "active", width: 8 },
    ],
    data: products.map((p) => ({
      ...p,
      price: p.price != null ? `${CURRENCY_SYMBOLS[p.currency] || ""}${Number(p.price).toLocaleString()}` : "",
      active: p.active ? "Sí" : "No",
    })),
  });
}
