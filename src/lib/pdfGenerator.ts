import jsPDF from 'jspdf';
import { WeighingRecord, Company, Client, PaymentRecord } from '../types';

export function generateTicketPDF(record: WeighingRecord, company?: Company, paymentsHistory?: PaymentRecord[]): jsPDF {
  const isCobranza = paymentsHistory && paymentsHistory.length > 0;
  
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, isCobranza ? 230 : 180], // Formato Ticket Térmico 80mm estilo AviControl
  });

  const companyName = company?.name || 'AVICOLA EL GALPÓN REAL S.A.C.';
  const phone = company?.phone || '(+51) 987-654-321';
  const taxId = company?.taxId || 'RUC 20601234567';
  const address = company?.address || 'Av. Panamericana Sur Km 35, Lima - Perú';

  let y = 8;

  // Frame Outer Border
  doc.setLineWidth(0.4);
  doc.rect(3, 3, 74, isCobranza ? 224 : 174);

  // Encabezado AviControl
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(companyName, 40, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${taxId}`, 40, y, { align: 'center' });
  y += 3.5;
  doc.text(`Tel: ${phone}`, 40, y, { align: 'center' });
  y += 3.5;
  doc.text(address, 40, y, { align: 'center' });
  y += 5;

  // Header Box - Ticket Number
  doc.setFillColor(15, 23, 42); // Navy Dark AviControl
  doc.rect(5, y, 70, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(isCobranza ? `TICKET DE COBRANZA: ${record.ticketNumber}` : `COMPROBANTE DE VENTA: ${record.ticketNumber}`, 40, y + 4.8, { align: 'center' });
  
  y += 9;
  doc.setTextColor(0, 0, 0);

  // Client Info Box Grid
  doc.rect(5, y, 70, 19);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`FECHA/HORA: ${new Date(record.createdAt).toLocaleString('es-ES')}`, 7, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(`CLIENTE: ${record.clientName.substring(0, 28)}`, 7, y + 8);
  doc.setFont('helvetica', 'normal');
  if (record.galponName) {
    doc.text(`GALPÓN / ORIGEN: ${record.galponName}`, 7, y + 12);
  } else {
    doc.text(`CONDICIÓN: ${record.paymentType.toUpperCase()} ${record.creditDays ? `(${record.creditDays} días)` : ''}`, 7, y + 12);
  }
  doc.setFont('helvetica', 'bold');
  const isPaid = record.paymentStatus === 'pagado';
  doc.text(`ESTADO: ${isPaid ? 'CANCELADO (100% PAGADO)' : `PENDIENTE S/ ${record.pendingAmount.toFixed(2)}`}`, 7, y + 16);

  y += 22;

  // Table Concept Box
  doc.setFillColor(241, 245, 249);
  doc.rect(5, y, 70, 6, 'F');
  doc.rect(5, y, 70, 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DETALLE DE BALANZA / PESAGE', 7, y + 4);
  doc.text('CANT. / PESO', 73, y + 4, { align: 'right' });

  y += 6;

  // Values Grid Box
  const avgWeight = record.chickenCount > 0 ? (record.netWeight / record.chickenCount).toFixed(2) : '0.00';

  const rows = [
    { label: 'Cantidad de Aves:', val: `${record.chickenCount} aves` },
    { label: 'Peso Total (Bruto):', val: `${record.grossWeight.toFixed(2)} kg` },
    ...(record.tareWeight > 0 ? [{ label: 'Descuento / Tara:', val: `-${record.tareWeight.toFixed(2)} kg` }] : []),
    { label: 'PESO NETO VENDIDO:', val: `${record.netWeight.toFixed(2)} kg`, bold: true },
    { label: 'PESO PROMEDIO / POLLO:', val: `${avgWeight} kg/ave`, bold: true },
    { label: 'Precio por Kilo (S/):', val: `S/ ${record.unitPrice.toFixed(2)} / kg` },
  ];

  doc.setFontSize(7.5);
  rows.forEach((r) => {
    doc.rect(5, y, 70, 5);
    if (r.bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    doc.text(r.label, 7, y + 3.6);
    doc.text(r.val, 73, y + 3.6, { align: 'right' });
    y += 5;
  });

  // TOTAL BOX
  doc.setFillColor(15, 23, 42);
  doc.rect(5, y, 70, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL VENTA:', 7, y + 5.5);
  doc.text(`S/ ${record.totalAmount.toFixed(2)}`, 73, y + 5.5, { align: 'right' });

  y += 10;
  doc.setTextColor(0, 0, 0);

  // If Cobranza ticket with history
  if (isCobranza) {
    doc.setFillColor(241, 245, 249);
    doc.rect(5, y, 70, 5, 'F');
    doc.rect(5, y, 70, 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('HISTORIAL DE ABONOS Y COBRANZA', 7, y + 3.5);

    y += 5;

    doc.setFontSize(6.5);
    paymentsHistory.forEach((p) => {
      doc.rect(5, y, 70, 5);
      doc.setFont('helvetica', 'normal');
      const pDate = new Date(p.createdAt).toLocaleDateString('es-ES');
      doc.text(`${pDate} - ${p.method.toUpperCase()} (${p.reference || 'S/N'})`, 7, y + 3.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`S/ ${p.amount.toFixed(2)}`, 73, y + 3.5, { align: 'right' });
      y += 5;
    });

    // Summary cancellation box
    doc.rect(5, y, 70, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('TOTAL ABONADO:', 7, y + 4);
    doc.text(`S/ ${record.paidAmount.toFixed(2)}`, 73, y + 4, { align: 'right' });
    y += 6;

    doc.setFillColor(record.pendingAmount <= 0 ? 220 : 254, record.pendingAmount <= 0 ? 252 : 226, record.pendingAmount <= 0 ? 231 : 226);
    doc.rect(5, y, 70, 6, 'F');
    doc.rect(5, y, 70, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SALDO PENDIENTE:', 7, y + 4.2);
    doc.text(`S/ ${record.pendingAmount.toFixed(2)}`, 73, y + 4.2, { align: 'right' });

    y += 9;
  } else {
    // Ticket Inicial de Venta Directa
    doc.setFillColor(241, 245, 249);
    doc.rect(5, y, 70, 6, 'F');
    doc.rect(5, y, 70, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CONDICIÓN DE VENTA:', 7, y + 4.2);
    doc.text(record.paymentType === 'contado' ? 'PAGADO AL CONTADO' : `CRÉDITO (${record.creditDays || 0} DÍAS)`, 73, y + 4.2, { align: 'right' });

    y += 9;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('AvisControl - Sistema Corporativo Avícola', 40, y, { align: 'center' });
  y += 3.5;
  doc.text('Atendido por: ' + record.createdBy, 40, y, { align: 'center' });

  return doc;
}

export function generateCobranzaTicketPDF(record: WeighingRecord, company?: Company, paymentsHistory: PaymentRecord[] = []): jsPDF {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 240], // Formato Ticket Térmico 80mm para Cobranza y Abonos
  });

  const companyName = company?.name || 'AVICOLA EL GALPÓN REAL S.A.C.';
  const phone = company?.phone || '(+51) 987-654-321';
  const taxId = company?.taxId || 'RUC 20601234567';
  const address = company?.address || 'Av. Panamericana Sur Km 35, Lima - Perú';

  let y = 8;

  // Frame Outer Border
  doc.setLineWidth(0.4);
  doc.rect(3, 3, 74, 234);

  // Encabezado AviControl
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(companyName, 40, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${taxId}`, 40, y, { align: 'center' });
  y += 3.5;
  doc.text(`Tel: ${phone}`, 40, y, { align: 'center' });
  y += 3.5;
  doc.text(address, 40, y, { align: 'center' });
  y += 5;

  // Header Box - Ticket Number
  doc.setFillColor(15, 23, 42); // Navy Dark AviControl
  doc.rect(5, y, 70, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`TICKET DE COBRANZA Y ABONOS`, 40, y + 4.8, { align: 'center' });
  
  y += 9;
  doc.setTextColor(0, 0, 0);

  // Client Info Box Grid
  doc.rect(5, y, 70, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`TICKET ORIGEN: ${record.ticketNumber}`, 7, y + 4);
  doc.text(`FECHA COBRANZA: ${new Date().toLocaleString('es-ES')}`, 7, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`CLIENTE: ${record.clientName.substring(0, 28)}`, 7, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`CONDICIÓN VENTA: ${record.paymentType.toUpperCase()} (${record.creditDays || 0} DÍAS)`, 7, y + 16);
  doc.setFont('helvetica', 'bold');
  const isPaid = record.paymentStatus === 'pagado';
  doc.text(`ESTADO DE CUENTA: ${isPaid ? '100% CANCELADO' : 'PENDIENTE DE PAGO'}`, 7, y + 20);

  y += 25;

  // Original Venta Summary Box
  doc.setFillColor(241, 245, 249);
  doc.rect(5, y, 70, 6, 'F');
  doc.rect(5, y, 70, 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RESUMEN DE VENTA REGISTRADA', 7, y + 4);

  y += 6;

  const rows = [
    { label: 'Total Aves Vendidas:', val: `${record.chickenCount} aves` },
    { label: 'Peso Neto Total:', val: `${record.netWeight.toFixed(2)} kg` },
    { label: 'Precio por Kilo:', val: `S/ ${record.unitPrice.toFixed(2)}` },
    { label: 'MONTO TOTAL VENTA:', val: `S/ ${record.totalAmount.toFixed(2)}`, bold: true },
  ];

  doc.setFontSize(7.5);
  rows.forEach((r) => {
    doc.rect(5, y, 70, 5);
    if (r.bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    doc.text(r.label, 7, y + 3.6);
    doc.text(r.val, 73, y + 3.6, { align: 'right' });
    y += 5;
  });

  y += 2;

  // ABONOS DETALLADOS
  doc.setFillColor(15, 23, 42);
  doc.rect(5, y, 70, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DETALLE DE ABONOS Y COBRANZAS', 7, y + 4);

  y += 6;
  doc.setTextColor(0, 0, 0);

  if (paymentsHistory && paymentsHistory.length > 0) {
    paymentsHistory.forEach((p, idx) => {
      doc.rect(5, y, 70, 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const pDate = new Date(p.createdAt).toLocaleDateString('es-ES');
      doc.text(`#${idx + 1} | ${pDate} (${p.method.toUpperCase()})`, 7, y + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(`+ S/ ${p.amount.toFixed(2)}`, 73, y + 4, { align: 'right' });
      y += 6;
    });
  } else {
    doc.rect(5, y, 70, 6);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Sin abonos registrados', 7, y + 4);
    y += 6;
  }

  // TOTALES COBRANZA
  doc.setFillColor(241, 245, 249);
  doc.rect(5, y, 70, 6, 'F');
  doc.rect(5, y, 70, 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ACUMULADO ABONADO:', 7, y + 4);
  doc.text(`S/ ${record.paidAmount.toFixed(2)}`, 73, y + 4, { align: 'right' });
  y += 6;

  doc.setFillColor(record.pendingAmount <= 0 ? 220 : 254, record.pendingAmount <= 0 ? 252 : 226, record.pendingAmount <= 0 ? 231 : 226);
  doc.rect(5, y, 70, 7, 'F');
  doc.rect(5, y, 70, 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SALDO PENDIENTE S/:', 7, y + 4.8);
  doc.text(`S/ ${record.pendingAmount.toFixed(2)}`, 73, y + 4.8, { align: 'right' });

  y += 10;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('AvisControl - Ticket de Cobranza y Abonos', 40, y, { align: 'center' });
  y += 3.5;
  doc.text('Operador: ' + record.createdBy, 40, y, { align: 'center' });

  return doc;
}

export function downloadCobranzaTicketPDF(record: WeighingRecord, company?: Company, paymentsHistory: PaymentRecord[] = []) {
  const doc = generateCobranzaTicketPDF(record, company, paymentsHistory);
  doc.save(`Ticket_Cobranza_${record.ticketNumber}.pdf`);
}

export function downloadTicketPDF(record: WeighingRecord, company?: Company, paymentsHistory?: PaymentRecord[]) {
  const doc = generateTicketPDF(record, company, paymentsHistory);
  doc.save(`Ticket_Venta_${record.ticketNumber}.pdf`);
}

export function generateStatementPDF(client: Client, weighings: WeighingRecord[], payments: PaymentRecord[], company?: Company) {
  const doc = new jsPDF();

  const companyName = company?.name || 'AVISCONTROL';
  let y = 15;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(companyName, 14, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ESTADO DE CUENTA Y HISTORIAL DE PESAS', 14, y);
  y += 10;

  // Info Cliente
  doc.setFillColor(240, 244, 248);
  doc.rect(14, y, 182, 24, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente: ${client.name}`, 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Teléfono: ${client.phone || 'N/A'} | Email: ${client.email || 'N/A'}`, 18, y + 12);
  doc.text(`Límite Crédito: S/ ${client.creditLimit.toFixed(2)} | Días Crédito: ${client.creditDays} días`, 18, y + 18);
  
  const totalPending = weighings.reduce((sum, w) => sum + (w.pendingAmount || 0), 0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(194, 24, 7); // Rojo alerta
  doc.text(`SALDO TOTAL PENDIENTE: S/ ${totalPending.toFixed(2)}`, 110, y + 18);
  doc.setTextColor(0, 0, 0);

  y += 30;

  // Tabla de Pesas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Historial de Pesajes / Tickets', 14, y);
  y += 6;

  // Encabezados tabla
  doc.setFontSize(8);
  doc.setFillColor(15, 23, 42); // Navy
  doc.setTextColor(255, 255, 255);
  doc.rect(14, y, 182, 7, 'F');
  doc.text('Ticket #', 16, y + 5);
  doc.text('Fecha', 45, y + 5);
  doc.text('Pollos', 75, y + 5);
  doc.text('Peso Neto', 95, y + 5);
  doc.text('Total S/', 125, y + 5);
  doc.text('Saldo S/', 155, y + 5);
  doc.text('Estado', 180, y + 5);

  y += 7;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  weighings.forEach((w) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.text(w.ticketNumber, 16, y + 5);
    doc.text(new Date(w.createdAt).toLocaleDateString('es-ES'), 45, y + 5);
    doc.text(`${w.chickenCount}`, 75, y + 5);
    doc.text(`${w.netWeight.toFixed(1)} kg`, 95, y + 5);
    doc.text(`S/ ${w.totalAmount.toFixed(2)}`, 125, y + 5);
    doc.text(`S/ ${w.pendingAmount.toFixed(2)}`, 155, y + 5);
    doc.text(w.paymentStatus.toUpperCase(), 180, y + 5);

    doc.setLineWidth(0.1);
    doc.line(14, y + 7, 196, y + 7);
    y += 8;
  });

  doc.save(`Estado_Cuenta_${client.name.replace(/\s+/g, '_')}.pdf`);
}

export function generateMonthlyReportPDF(monthName: string, company: Company, weighings: WeighingRecord[]) {
  const doc = new jsPDF();
  let y = 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.name || 'AVISCONTROL', 14, y);
  y += 6;

  doc.setFontSize(12);
  doc.text(`REPORTE DETALLADO MENSUAL - ${monthName.toUpperCase()}`, 14, y);
  y += 10;

  const totalChickens = weighings.reduce((sum, w) => sum + w.chickenCount, 0);
  const totalNetKg = weighings.reduce((sum, w) => sum + w.netWeight, 0);
  const totalSales = weighings.reduce((sum, w) => sum + w.totalAmount, 0);
  const totalPaid = weighings.reduce((sum, w) => sum + w.paidAmount, 0);
  const totalPending = weighings.reduce((sum, w) => sum + w.pendingAmount, 0);

  // Cards resumen
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 55, 22, 'F');
  doc.rect(75, y, 55, 22, 'F');
  doc.rect(136, y, 60, 22, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL POLLOS PESADOS', 18, y + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalChickens.toLocaleString()} aves`, 18, y + 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL KILOS NETOS', 79, y + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalNetKg.toFixed(1)} kg`, 79, y + 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('MONTO TOTAL VENTAS', 140, y + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${totalSales.toFixed(2)}`, 140, y + 14);

  y += 28;

  doc.setFontSize(10);
  doc.text(`Cobrado: S/ ${totalPaid.toFixed(2)}  |  Pendiente de Cobro: S/ ${totalPending.toFixed(2)}`, 14, y);
  y += 10;

  // Lista de registros
  doc.setFontSize(8);
  doc.setFillColor(15, 23, 42);
  doc.setTextColor(255, 255, 255);
  doc.rect(14, y, 182, 7, 'F');
  doc.text('Fecha', 16, y + 5);
  doc.text('Ticket', 40, y + 5);
  doc.text('Cliente', 65, y + 5);
  doc.text('Pollos', 115, y + 5);
  doc.text('Kilos', 135, y + 5);
  doc.text('Total', 160, y + 5);
  doc.text('Estado', 180, y + 5);

  y += 7;
  doc.setTextColor(0, 0, 0);

  weighings.forEach((w) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.text(new Date(w.createdAt).toLocaleDateString('es-ES'), 16, y + 5);
    doc.text(w.ticketNumber, 40, y + 5);
    doc.text(w.clientName.substring(0, 22), 65, y + 5);
    doc.text(`${w.chickenCount}`, 115, y + 5);
    doc.text(`${w.netWeight.toFixed(1)}kg`, 135, y + 5);
    doc.text(`S/ ${w.totalAmount.toFixed(2)}`, 160, y + 5);
    doc.text(w.paymentStatus, 180, y + 5);

    doc.setLineWidth(0.1);
    doc.line(14, y + 7, 196, y + 7);
    y += 8;
  });

  doc.save(`Reporte_Mensual_${company.name.replace(/\s+/g, '_')}_${monthName}.pdf`);
}

export function generatePaymentReceiptPDF(payment: PaymentRecord, client?: Client, company?: Company): jsPDF {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150], // Ticket formato recibo
  });

  const companyName = company?.name || 'AVISCONTROL PERÚ';
  let y = 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(companyName, 40, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('COMPROBANTE DE ABONO / PAGO', 40, y, { align: 'center' });
  y += 5;

  doc.setLineWidth(0.3);
  doc.line(5, y, 75, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Recibo #: REC-${payment.id.substring(4, 10).toUpperCase()}`, 5, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Fecha: ${new Date(payment.createdAt).toLocaleString('es-ES')}`, 5, y);
  y += 4;
  doc.text(`Cliente: ${payment.clientName || client?.name || 'Cliente'}`, 5, y);
  y += 4;
  doc.text(`Método Pago: ${payment.method.toUpperCase()}`, 5, y);
  if (payment.reference) {
    y += 4;
    doc.text(`Nº Operación: ${payment.reference}`, 5, y);
  }
  y += 6;

  doc.line(5, y, 75, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MONTO ABONADO:', 5, y);
  doc.text(`S/ ${payment.amount.toFixed(2)}`, 75, y, { align: 'right' });
  y += 6;

  if (client) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Saldo Actual Restante:', 5, y);
    doc.text(`S/ ${(client.currentBalance || 0).toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;
  }

  doc.line(5, y, 75, y);
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Comprobante generado exitosamente en Soles', 40, y, { align: 'center' });
  y += 3;
  doc.text('¡Gracias por su puntualidad en el pago!', 40, y, { align: 'center' });

  return doc;
}

export function downloadPaymentReceiptPDF(payment: PaymentRecord, client?: Client, company?: Company) {
  const doc = generatePaymentReceiptPDF(payment, client, company);
  doc.save(`Recibo_Abono_${payment.id}.pdf`);
}

export function generatePaymentsReportPDF(payments: PaymentRecord[], company?: Company) {
  const doc = new jsPDF();
  let y = 15;

  const companyName = company?.name || 'AVISCONTROL PERÚ';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(companyName, 14, y);
  y += 6;

  doc.setFontSize(12);
  doc.text('REPORTE CONSOLIDADO DE ABONOS Y PAGOS RECIBIDOS', 14, y);
  y += 10;

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 18, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`TOTAL ABONOS REGISTRADOS: ${payments.length} transacciones`, 18, y + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`RECAUDACIÓN TOTAL ACUMULADA: S/ ${totalCollected.toFixed(2)}`, 18, y + 13);

  y += 24;

  // Table header
  doc.setFontSize(8);
  doc.setFillColor(15, 23, 42);
  doc.setTextColor(255, 255, 255);
  doc.rect(14, y, 182, 7, 'F');
  doc.text('Fecha / Hora', 16, y + 5);
  doc.text('Cliente', 50, y + 5);
  doc.text('Método', 105, y + 5);
  doc.text('Referencia / Nº Op', 135, y + 5);
  doc.text('Monto S/', 175, y + 5);

  y += 7;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  payments.forEach((p) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    const dateStr = new Date(p.createdAt).toLocaleDateString('es-ES') + ' ' + new Date(p.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    doc.text(dateStr, 16, y + 5);
    doc.text((p.clientName || 'Cliente').substring(0, 26), 50, y + 5);
    doc.text(p.method.toUpperCase(), 105, y + 5);
    doc.text((p.reference || 'N/A').substring(0, 20), 135, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`S/ ${p.amount.toFixed(2)}`, 175, y + 5);
    doc.setFont('helvetica', 'normal');

    doc.setLineWidth(0.1);
    doc.line(14, y + 7, 196, y + 7);
    y += 8;
  });

  doc.save(`Reporte_Pagos_Realizados_${companyName.replace(/\s+/g, '_')}.pdf`);
}

