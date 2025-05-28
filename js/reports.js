// reports.js - Generación de reportes
import { DOM } from './dom.js';
import { getUsuarioActual } from './auth.js';
import { getProductosCache, inventarioActual } from './inventory.js';
import { escapeText } from './utils.js';

const { jsPDF } = window.jspdf;

// Configurar eventos de reportes
export function configurarEventosReportes() {
  DOM.btnGenerarReporte.addEventListener("click", () =>
    DOM.reporteModal.classList.remove("hidden")
  );
  DOM.btnCancelarReporte.addEventListener("click", () =>
    DOM.reporteModal.classList.add("hidden")
  );

  DOM.btnDescargarReporte.addEventListener("click", async () => {
    const tipoReporte = DOM.tipoReporte.value;
    let titulo = "";
    let productosFiltrados = [];

    // Filtrar productos según el tipo de reporte
    switch (tipoReporte) {
      case "inventario_completo":
        titulo = `Inventario completo de ${inventarioActual}`;
        productosFiltrados = [...getProductosCache()];
        break;

      case "productos_bajo_stock":
        titulo = `Productos con stock bajo (${inventarioActual})`;
        productosFiltrados = getProductosCache().filter((p) => p.cantidad < 10); // Cambia 10 por tu límite
        break;

      case "movimientos_recientes":
        titulo = `Movimientos recientes (${inventarioActual})`;
        // Aquí necesitarías tener un historial de movimientos en tu base de datos
        alert("Funcionalidad de movimientos no implementada aún");
        DOM.reporteModal.classList.add("hidden");
        return;
    }

    if (productosFiltrados.length === 0) {
      alert("No hay datos para generar el reporte");
      return;
    }

    // Crear PDF
    const doc = new jsPDF();

    // Encabezado
    doc.setFontSize(18);
    doc.setFontSize(12);
    doc.text(escapeText(titulo), 14, 15);
    doc.text(`Generado por: ${escapeText(getUsuarioActual().nombre)}`, 14, 30);

    // Tabla de productos
    const headers = [["Producto", "Cantidad"]];
    const data = productosFiltrados.map((p) => [
      escapeText(p.nombre),
      p.cantidad,
    ]);

    doc.autoTable({
      startY: 40,
      head: headers,
      body: data,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      },
      styles: {
        cellPadding: 3,
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: "auto" },
      },
    });

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }

    // Guardar PDF
    doc.save(`reporte_inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
    DOM.reporteModal.classList.add("hidden");
  });
}
