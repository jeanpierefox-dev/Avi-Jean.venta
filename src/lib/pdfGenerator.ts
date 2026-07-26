import jsPDF from 'jspdf';
import { WeighingRecord, Company, Client, PaymentRecord } from '../types';

function drawCompanyHeaderLogo(doc: jsPDF, company?: Company, startY: number = 6): number {
  let y = startY;
  const companyName = company?.name || 'AVICOLA EL GALPÓN REAL S.A.C.';
  const phone = company?.phone || '(+51) 987-654-321';
  const taxId = company?.taxId || 'RUC 20601234567';
  const address = company?.address || 'Av. Panamericana Sur Km 35, Lima - Perú';

  // Box container for Logo & Header
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.rect(5, y, 70, 24, 'F');
  doc.rect(5, y, 70, 24);

  let logoSuccess = false;
  if (company?.logoUrl && company.logoUrl.startsWith('data:image')) {
    try {
      const format = company.logoUrl.includes('image/png') ? 'PNG' : company.logoUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(company.logoUrl, format, 8, y + 2.5, 18, 19);
      logoSuccess = true;
    } catch (e) {
      console.warn('Error rendering base64 company logo in PDF:', e);
    }
  }

  if (logoSuccess) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(companyName.substring(0, 22), 28, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(taxId, 28, y + 10.5);
    doc.text(`Tel: ${phone}`, 28, y + 14.5);
    doc.text(address.substring(0, 26), 28, y + 18.5);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(companyName, 40, y + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(taxId, 40, y + 10.5, { align: 'center' });
    doc.text(`Tel: ${phone}`, 40, y + 14.5, { align: 'center' });
    doc.text(address, 40, y + 18.5, { align: 'center' });
  }

  return y + 26;
}

export function generateTicketPDF(record: WeighingRecord, company?: Company, paymentsHistory?: PaymentRecord[]): jsPDF {
  const isCobranza = paymentsHistory && paymentsHistory.length > 0;
  const hasScaleImg = record.scaleImageUrl && record.scaleImageUrl.startsWith('data:image');
  
  const calculatedHeight = 240 + (isCobranza ? (paymentsHistory.length * 6 + 20) : 0) + (hasScaleImg ? 35 : 0);

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, calculatedHeight], // Formato Ticket Térmico 80mm estilo AviControl Campo Verde
  });

  let y = 5;

  // Frame Outer Border
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.rect(3, 3, 74, calculatedHeight - 6);

  // 1. Company Header
  const companyName = company?.name || 'AGROPECUARIA CAMPOVERDE SAC';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(companyName, 40, y + 4, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text('TICKET DE PESAJE', 40, y + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const dateStr = new Date(record.createdAt).toLocaleDateString('es-ES') + ', ' + new Date(record.createdAt).toLocaleTimeString('es-ES');
  doc.text(`FECHA: ${dateStr}`, 40, y + 13, { align: 'center' });

  y += 16;

  // Solid horizontal separator
  doc.setLineWidth(0.6);
  doc.setDrawColor(0, 0, 0);
  doc.line(5, y, 75, y);

  y += 4;

  // LOTE & CLIENTE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('LOTE:', 6, y + 3);
  doc.text((record.galponName || 'ABEL MORALES SERRANO').toUpperCase(), 24, y + 3);

  doc.text('CLIENTE:', 6, y + 8);
  doc.text(record.clientName.toUpperCase(), 24, y + 8);

  y += 12;

  // TABLA 1: RESUMEN DE CANTIDADES
  doc.setFillColor(226, 232, 240); // Light gray banner
  doc.rect(5, y, 70, 5, 'F');
  doc.rect(5, y, 70, 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RESUMEN DE CANTIDADES', 40, y + 3.5, { align: 'center' });

  y += 5;

  const avgWeight = record.chickenCount > 0 ? (record.netWeight / record.chickenCount).toFixed(2) : '0.00';
  const filledBaskets = record.scaleEntries ? record.scaleEntries.length * 10 : Math.max(10, Math.round(record.chickenCount / 9));
  const emptyBaskets = record.tareWeight > 0 ? filledBaskets : 0;
  const hasTare = record.tareWeight > 0;
  const hasDead = Boolean(record.deadChickensCount && record.deadChickensCount > 0);

  const cantidadRows: { label: string; val: string }[] = [];
  if (hasTare) {
    cantidadRows.push({ label: 'Jabas Llenas:', val: `${filledBaskets}` });
  }
  cantidadRows.push({ label: 'Total Pollos:', val: `${record.chickenCount}` });
  if (hasTare) {
    cantidadRows.push({ label: 'Jabas Vacías:', val: `${emptyBaskets}` });
  }
  if (hasDead) {
    cantidadRows.push({ label: 'TOTAL MUERTOS:', val: `${record.deadChickensCount}` });
  }
  cantidadRows.push({ label: 'Prom. Peso Neto:', val: `${avgWeight} kg` });
  if (hasDead) {
    cantidadRows.push({ label: 'Prom. P. Muerto:', val: '0.00 kg' });
  }

  doc.setFontSize(7.5);
  cantidadRows.forEach((r) => {
    doc.rect(5, y, 70, 4.8);
    doc.setFont('helvetica', r.label.includes('TOTAL') ? 'bold' : 'normal');
    doc.text(r.label, 7, y + 3.4);
    doc.text(r.val, 73, y + 3.4, { align: 'right' });
    y += 4.8;
  });

  y += 2;

  // TABLA 2: DETALLE DE PESOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DETALLE DE PESOS', 40, y + 3, { align: 'center' });

  y += 5;

  // Banner LLENAS / PESADAS
  doc.setFillColor(226, 232, 240);
  doc.rect(5, y, 70, 4.5, 'F');
  doc.rect(5, y, 70, 4.5);
  doc.setFontSize(7);
  doc.text(hasTare ? `LLENAS (${filledBaskets}p)` : `PESADAS (${record.scaleEntries?.length || 1})`, 40, y + 3.2, { align: 'center' });

  y += 4.5;

  // Grid for Llenas
  if (record.scaleEntries && record.scaleEntries.length > 0) {
    record.scaleEntries.forEach((se, idx) => {
      doc.rect(5, y, 70, 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Pesa #${idx + 1} (${se.chickens}p)`, 7, y + 3.2);
      doc.setFont('helvetica', 'bold');
      doc.text(`${se.grossWeight.toFixed(2)} kg`, 73, y + 3.2, { align: 'right' });
      y += 4.5;
    });
  } else {
    doc.rect(5, y, 70, 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Pesa Única (${record.chickenCount}p)`, 7, y + 3.2);
    doc.setFont('helvetica', 'bold');
    doc.text(`${record.grossWeight.toFixed(2)} kg`, 73, y + 3.2, { align: 'right' });
    y += 4.5;
  }

  // Subtotal Llenas / Pesado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`TOTAL PESADO: ${record.grossWeight.toFixed(2)} kg`, 73, y + 3.2, { align: 'right' });

  y += 5;

  // Banner VACÍAS (Only if hasTare)
  if (hasTare) {
    doc.setFillColor(226, 232, 240);
    doc.rect(5, y, 70, 4.5, 'F');
    doc.rect(5, y, 70, 4.5);
    doc.setFontSize(7);
    doc.text(`VACÍAS (${emptyBaskets}p)`, 40, y + 3.2, { align: 'center' });

    y += 4.5;

    doc.rect(5, y, 70, 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Tara Total Jabas:', 7, y + 3.2);
    doc.setFont('helvetica', 'bold');
    doc.text(`${record.tareWeight.toFixed(2)} kg`, 73, y + 3.2, { align: 'right' });
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`TOTAL VACÍAS: ${record.tareWeight.toFixed(2)} kg`, 73, y + 3.2, { align: 'right' });

    y += 6;
  }

  // Solid separator line
  doc.setLineWidth(0.6);
  doc.setDrawColor(0, 0, 0);
  doc.line(5, y, 75, y);

  y += 4;

  // Summary Weight Lines
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Peso Bruto:', 7, y + 3);
  doc.text(`${record.grossWeight.toFixed(2)} kg`, 73, y + 3, { align: 'right' });

  if (hasTare) {
    y += 4.5;
    doc.text('Tara Total:', 7, y + 3);
    doc.text(`-${record.tareWeight.toFixed(2)} kg`, 73, y + 3, { align: 'right' });

    y += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL MERMA:', 7, y + 3);
    doc.text('-0.00 kg', 73, y + 3, { align: 'right' });
  }

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text('Prom. Peso Neto:', 7, y + 3);
  doc.text(`${avgWeight} kg`, 73, y + 3, { align: 'right' });

  if (hasDead) {
    y += 4.5;
    doc.text('Prom. P. Muerto:', 7, y + 3);
    doc.text('0.00 kg', 73, y + 3, { align: 'right' });
  }

  y += 6;

  // Solid separator line
  doc.line(5, y, 75, y);

  y += 4;

  // Financial summary block
  doc.setFillColor(15, 23, 42); // Navy Dark
  doc.rect(5, y, 70, 16, 'F');
  doc.setTextColor(255, 255, 255);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Precio por Kilo:', 7, y + 4);
  doc.text(`S/ ${record.unitPrice.toFixed(2)} / kg`, 73, y + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL IMPORTE:', 7, y + 8.5);
  doc.text(`S/ ${record.totalAmount.toFixed(2)}`, 73, y + 8.5, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Monto Abonado:', 7, y + 12.5);
  doc.text(`S/ ${record.paidAmount.toFixed(2)}`, 73, y + 12.5, { align: 'right' });

  y += 18;
  doc.setTextColor(0, 0, 0);

  // Balance box if unpaid
  if (record.pendingAmount > 0) {
    doc.setFillColor(254, 226, 226);
    doc.rect(5, y, 70, 5.5, 'F');
    doc.rect(5, y, 70, 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('SALDO PENDIENTE:', 7, y + 3.8);
    doc.text(`S/ ${record.pendingAmount.toFixed(2)}`, 73, y + 3.8, { align: 'right' });
    y += 8;
  }

  // Scale photo if present
  if (hasScaleImg) {
    try {
      doc.setFillColor(248, 250, 252);
      doc.rect(5, y, 70, 32, 'F');
      doc.rect(5, y, 70, 32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('FOTO DE BALANZA ELECTRÓNICA ADJUNTA:', 7, y + 4);
      
      const format = record.scaleImageUrl!.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(record.scaleImageUrl!, format, 8, y + 5.5, 64, 24);
      y += 35;
    } catch (e) {
      console.warn('Error adding scale image to PDF:', e);
    }
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('AvisControl - Sistema Corporativo Avícola', 40, y, { align: 'center' });
  y += 3.5;
  doc.text('Atendido por: ' + record.createdBy, 40, y, { align: 'center' });

  return doc;
}

export function generateCobranzaTicketPDF(record: WeighingRecord, company?: Company, paymentsHistory: PaymentRecord[] = []): jsPDF {
  const hasScaleImg = record.scaleImageUrl && record.scaleImageUrl.startsWith('data:image');
  const calculatedHeight = 230 + (paymentsHistory.length * 6) + (hasScaleImg ? 35 : 0);

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, calculatedHeight], // Formato Ticket Térmico 80mm para Cobranza y Abonos
  });

  let y = 5;

  // Frame Outer Border
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.rect(3, 3, 74, calculatedHeight - 6);

  // 1. Company Header Box with Logo (Cuadro 1)
  y = drawCompanyHeaderLogo(doc, company, y);

  // 2. Header Navy Box - Ticket Cobranza
  doc.setFillColor(15, 23, 42); // Navy Dark AviControl
  doc.rect(5, y, 70, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`TICKET DE COBRANZA Y ABONOS`, 40, y + 5.2, { align: 'center' });
  
  y += 10;
  doc.setTextColor(0, 0, 0);

  // 3. Client & Account State Box (Cuadro 3)
  doc.setFillColor(241, 245, 249);
  doc.rect(5, y, 70, 5, 'F');
  doc.rect(5, y, 70, 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DATOS DE CLIENTE Y COBRANZA', 7, y + 3.5);

  y += 5;

  doc.rect(5, y, 70, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`TICKET ORIGEN: ${record.ticketNumber}`, 7, y + 4);
  doc.text(`FECHA COBRANZA: ${new Date().toLocaleString('es-ES')}`, 7, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`CLIENTE: ${record.clientName.substring(0, 28)}`, 7, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`CONDICIÓN: ${record.paymentType.toUpperCase()} (${record.creditDays || 0} DÍAS)`, 7, y + 16);
  doc.setFont('helvetica', 'bold');
  const isPaid = record.paymentStatus === 'pagado';
  doc.text(`ESTADO DE CUENTA: ${isPaid ? '100% CANCELADO' : 'PENDIENTE DE PAGO'}`, 7, y + 20);

  y += 25;

  // 4. Original Venta Summary Box (Cuadro 4)
  doc.setFillColor(241, 245, 249);
  doc.rect(5, y, 70, 5, 'F');
  doc.rect(5, y, 70, 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RESUMEN DE VENTA REGISTRADA', 7, y + 3.5);

  y += 5;

  const avgW = record.chickenCount > 0 ? (record.netWeight / record.chickenCount).toFixed(2) : '0.00';

  const rows = [
    { label: 'Total Pollos Vendidos:', val: `${record.chickenCount} aves` },
    { label: 'Peso Neto Total:', val: `${record.netWeight.toFixed(2)} kg` },
    { label: 'Promedio por Pollo:', val: `${avgW} kg/ave` },
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

  // 5. ABONOS DETALLADOS BOX (Cuadro 5)
  doc.setFillColor(15, 23, 42);
  doc.rect(5, y, 70, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DETALLE DE ABONOS REGISTRADOS', 7, y + 4);

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
    doc.text('Sin abonos parciales registrados aún', 7, y + 4);
    y += 6;
  }

  // 6. TOTALES Y SALDO COBRANZA (Cuadro 6)
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

  // 7. Scale Image Box (If base64 image attached)
  if (hasScaleImg) {
    try {
      doc.setFillColor(248, 250, 252);
      doc.rect(5, y, 70, 32, 'F');
      doc.rect(5, y, 70, 32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('FOTO DE BALANZA ELECTRÓNICA ADJUNTA:', 7, y + 4);
      
      const format = record.scaleImageUrl!.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(record.scaleImageUrl!, format, 8, y + 5.5, 64, 24);
      y += 35;
    } catch (e) {
      console.warn('Error adding scale image to PDF:', e);
    }
  }

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

