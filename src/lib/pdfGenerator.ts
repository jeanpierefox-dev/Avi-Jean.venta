import jsPDF from 'jspdf';
import { WeighingRecord, Company, Client, PaymentRecord } from '../types';
import systemLogo from '../assets/images/jbalance_white_bg_logo_1785736789139.jpg';

function addSystemWatermark(doc: jsPDF, pageHeight: number) {
  try {
    if ((doc as any).GState) {
      doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
    }
    const logoX = (80 - 50) / 2;
    const logoY = Math.max(10, (pageHeight - 50) / 2);
    doc.addImage(systemLogo, 'JPEG', logoX, logoY, 50, 50);
    if ((doc as any).GState) {
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    }
  } catch (e) {
    console.warn('System watermark logo background failed:', e);
  }
}

function drawCompanyHeaderLogo(doc: jsPDF, company?: Company, startY: number = 5): number {
  let y = startY;
  const companyName = company?.name || 'AGROPECUARIA CAMPOVERDE S.A.C.';
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
  if (company?.logoUrl) {
    try {
      const format = company.logoUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(company.logoUrl, format, 8, y + 2.5, 18, 19);
      logoSuccess = true;
    } catch (e) {
      console.warn('Error rendering company logo in PDF:', e);
    }
  }

  if (logoSuccess) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(companyName.substring(0, 24), 28, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(taxId, 28, y + 10.5);
    doc.text(`Tel: ${phone}`, 28, y + 14.5);
    doc.text(address.substring(0, 26), 28, y + 18.5);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(companyName.substring(0, 32), 40, y + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(taxId, 40, y + 10.5, { align: 'center' });
    doc.text(`Tel: ${phone}`, 40, y + 14.5, { align: 'center' });
    doc.text(address.substring(0, 32), 40, y + 18.5, { align: 'center' });
  }

  return y + 26;
}

export function generateTicketPDF(record: WeighingRecord, company?: Company, paymentsHistory?: PaymentRecord[]): jsPDF {
  const isCobranza = paymentsHistory && paymentsHistory.length > 0;
  const entriesWithPhotos = record.scaleEntries?.filter(se => Boolean(se.photoUrl)) || [];
  const photoCount = entriesWithPhotos.length > 0 ? entriesWithPhotos.length : (record.scaleImageUrl ? 1 : 0);
  
  const calculatedHeight = 250 + (isCobranza ? (paymentsHistory.length * 6 + 20) : 0) + (photoCount * 35);

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, calculatedHeight], // Formato Ticket Térmico 80mm
  });

  let y = 5;

  // Frame Outer Border
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.rect(3, 3, 74, calculatedHeight - 6);

  // Background System Watermark Logo
  addSystemWatermark(doc, calculatedHeight);

  // 1. Company Header Logo Box
  y = drawCompanyHeaderLogo(doc, company, y);

  // Title Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(5, y, 70, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TICKET DE PESAJE DE POLLOS', 40, y + 4.8, { align: 'center' });
  
  y += 9;
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const dateStr = new Date(record.createdAt).toLocaleDateString('es-ES') + ', ' + new Date(record.createdAt).toLocaleTimeString('es-ES');
  doc.text(`FECHA: ${dateStr}`, 40, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`TICKET Nº: ${record.ticketNumber}`, 40, y, { align: 'center' });

  y += 5;

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
  doc.text(hasTare ? `LLENAS (${record.scaleEntries?.length || 1} pesadas)` : `PESADAS DE BALANZA (${record.scaleEntries?.length || 1})`, 40, y + 3.2, { align: 'center' });

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

  // Scale photos if present
  if (entriesWithPhotos.length > 0) {
    entriesWithPhotos.forEach((se, i) => {
      try {
        doc.setFillColor(248, 250, 252);
        doc.rect(5, y, 70, 32, 'F');
        doc.rect(5, y, 70, 32);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text(`FOTO PESA #${i + 1} (${se.chickens} pollos - ${se.grossWeight.toFixed(1)} kg):`, 7, y + 4);
        
        const format = se.photoUrl!.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(se.photoUrl!, format, 8, y + 5.5, 64, 24);
        y += 35;
      } catch (e) {
        console.warn('Error adding scale entry image to PDF:', e);
      }
    });
  } else if (record.scaleImageUrl) {
    try {
      doc.setFillColor(248, 250, 252);
      doc.rect(5, y, 70, 32, 'F');
      doc.rect(5, y, 70, 32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('FOTO DE BALANZA ELECTRÓNICA ADJUNTA:', 7, y + 4);
      
      const format = record.scaleImageUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(record.scaleImageUrl, format, 8, y + 5.5, 64, 24);
      y += 35;
    } catch (e) {
      console.warn('Error adding scale image to PDF:', e);
    }
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('JBALANCE CONTROL - Sistema Corporativo Avícola', 40, y, { align: 'center' });
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
  doc.text('JBALANCE CONTROL - Ticket de Cobranza y Abonos', 40, y, { align: 'center' });
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

  const companyName = company?.name || 'JBALANCE CONTROL';
  const taxId = company?.taxId ? `RUC ${company.taxId}` : 'RUC 20601234567';
  const phone = company?.phone || '+51 987 654 321';
  const address = company?.address || 'Lima, Perú';

  const totalSalesAmount = weighings.reduce((sum, w) => sum + (w.totalAmount || 0), 0);
  const totalPaymentsAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPendingBalance = weighings.reduce((sum, w) => sum + (w.pendingAmount || 0), 0);

  const documentCode = `EC-${(client.id || 'CLI').slice(-6).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const currentDateStr = new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  let y = 0;

  // 1. Top Corporate Bank Header Banner
  doc.setFillColor(15, 23, 42); // Navy Dark Slate (#0f172a)
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(companyName.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`SISTEMA BANCARIO & COMERCIAL • ESTADO DE CUENTA Y CONCILIACIÓN DE PAGOS`, 14, 17);
  doc.text(`${taxId}  |  Teléfono: ${phone}  |  ${address.substring(0, 45)}`, 14, 22);

  // 2. Metadata Ribbon
  y = 29;
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(14, y, 182, 10, 'F');
  doc.setLineWidth(0.2);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 10);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`N° DOCUMENTO: ${documentCode}`, 18, y + 6.5);
  doc.text(`FECHA DE EMISIÓN: ${currentDateStr}`, 92, y + 6.5);
  doc.text(`MONEDA: SOLES (S/)`, 155, y + 6.5);

  y += 14;

  // 3. Client & Bank Account Summary Box
  doc.setFillColor(255, 255, 255);
  doc.rect(14, y, 182, 34);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 98, 34, 'F');

  // Left Column - Client Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TITULAR DE LA CUENTA COMERCIAL', 18, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(client.name.toUpperCase(), 18, y + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Código de Cliente: ${client.id}`, 18, y + 18);
  doc.text(`Teléfono / Contacto: ${client.phone || 'N/A'}`, 18, y + 23);
  doc.text(`Dirección / Email: ${(client.address || client.email || 'Cliente Frecuente').substring(0, 38)}`, 18, y + 28);

  // Right Column - Financial Summary Grid
  const summaryX = 116;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RESUMEN DE CUENTA CORRIENTE', summaryX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Compras Registradas:`, summaryX, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${totalSalesAmount.toFixed(2)}`, 192, y + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Total Abonos Realizados:`, summaryX, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // Emerald
  doc.text(`S/ ${totalPaymentsAmount.toFixed(2)}`, 192, y + 18, { align: 'right' });

  // Highlight Box for Pending Balance
  doc.setFillColor(totalPendingBalance > 0 ? 254 : 236, totalPendingBalance > 0 ? 242 : 253, totalPendingBalance > 0 ? 242 : 245);
  doc.rect(summaryX - 2, y + 21, 78, 10, 'F');
  doc.setDrawColor(totalPendingBalance > 0 ? 252 : 167, totalPendingBalance > 0 ? 165 : 243, totalPendingBalance > 0 ? 165 : 208);
  doc.rect(summaryX - 2, y + 21, 78, 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(totalPendingBalance > 0 ? 185 : 4, totalPendingBalance > 0 ? 28 : 120, totalPendingBalance > 0 ? 28 : 87);
  doc.text(`SALDO PENDIENTE:`, summaryX, y + 27.5);
  doc.text(`S/ ${totalPendingBalance.toFixed(2)}`, 192, y + 27.5, { align: 'right' });

  y += 39;

  // 4. SECTION 1: DETALLE DE COMPRAS / CARGAS AL CLIENTE (DÉBITOS)
  doc.setFillColor(30, 41, 59); // Slate 800 Banner
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('I. HISTORIAL DETALLADO DE COMPRAS Y REGISTRO DE PESAJES (DÉBITOS)', 18, y + 5);

  y += 7;

  // Table Headers - Section 1
  doc.setFillColor(226, 232, 240); // Slate 200
  doc.rect(14, y, 182, 6, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.text('Ticket N°', 16, y + 4.2);
  doc.text('Fecha', 40, y + 4.2);
  doc.text('Aves', 65, y + 4.2);
  doc.text('Peso Neto', 82, y + 4.2);
  doc.text('Precio S/', 105, y + 4.2);
  doc.text('Monto Total', 128, y + 4.2);
  doc.text('Abonado S/', 152, y + 4.2);
  doc.text('Saldo S/', 173, y + 4.2);
  doc.text('Estado', 188, y + 4.2);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  if (weighings.length === 0) {
    doc.text('No hay registros de compras registrados para este cliente.', 16, y + 5);
    y += 8;
  } else {
    weighings.forEach((w) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.text(w.ticketNumber, 16, y + 4);
      doc.text(new Date(w.createdAt).toLocaleDateString('es-ES'), 40, y + 4);
      doc.text(`${w.chickenCount}`, 65, y + 4);
      doc.text(`${w.netWeight.toFixed(1)} kg`, 82, y + 4);
      doc.text(`S/ ${w.unitPrice.toFixed(2)}`, 105, y + 4);
      doc.text(`S/ ${w.totalAmount.toFixed(2)}`, 128, y + 4);
      doc.text(`S/ ${w.paidAmount.toFixed(2)}`, 152, y + 4);
      
      doc.setFont('helvetica', 'bold');
      if (w.pendingAmount > 0) doc.setTextColor(190, 18, 60);
      else doc.setTextColor(16, 185, 129);
      doc.text(`S/ ${w.pendingAmount.toFixed(2)}`, 173, y + 4);
      
      doc.setFontSize(7);
      doc.text((w.paymentStatus || 'pendiente').toUpperCase(), 188, y + 4);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      doc.setLineWidth(0.1);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 5.5, 196, y + 5.5);
      y += 6;
    });
  }

  y += 4;

  // 5. SECTION 2: DETALLE DE ABONOS Y PAGOS REALIZADOS (CRÉDITOS)
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(5, 150, 105); // Emerald 600 Banner
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('II. HISTORIAL DETALLADO DE ABONOS Y DEPÓSITOS REGISTRADOS (CRÉDITOS)', 18, y + 5);

  y += 7;

  // Table Headers - Section 2
  doc.setFillColor(209, 250, 229); // Emerald 100
  doc.rect(14, y, 182, 6, 'F');
  doc.setTextColor(6, 78, 59);
  doc.setFontSize(7.5);
  doc.text('Ref / Voucher N°', 16, y + 4.2);
  doc.text('Fecha y Hora', 58, y + 4.2);
  doc.text('Medio de Pago', 98, y + 4.2);
  doc.text('Notas / Concepto', 130, y + 4.2);
  doc.text('Monto Abonado S/', 170, y + 4.2);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  if (payments.length === 0) {
    doc.text('No hay abonos ni vouchers registrados para este cliente a la fecha.', 16, y + 5);
    y += 8;
  } else {
    payments.forEach((p) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.text((p.reference || p.id || 'N/A').substring(0, 22), 16, y + 4);
      doc.text(new Date(p.createdAt).toLocaleString('es-ES'), 58, y + 4);
      doc.text((p.method || 'yape').toUpperCase(), 98, y + 4);
      doc.text((p.notes || 'Abono en cuenta corriente').substring(0, 28), 130, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(`S/ ${p.amount.toFixed(2)}`, 170, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      doc.setLineWidth(0.1);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 5.5, 196, y + 5.5);
      y += 6;
    });
  }

  y += 8;

  // 6. Bank Settlement & Reconciliation Summary
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(15, 23, 42); // Navy Dark Box
  doc.rect(14, y, 182, 26, 'F');
  doc.setTextColor(255, 255, 255);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`(+) Total Consumo Compras Realizadas:`, 20, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${totalSalesAmount.toFixed(2)}`, 90, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`(-) Total Abonos y Depósitos Recibidos:`, 20, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(110, 231, 183);
  doc.text(`S/ ${totalPaymentsAmount.toFixed(2)}`, 90, y + 14, { align: 'right' });

  doc.setLineWidth(0.3);
  doc.setDrawColor(148, 163, 184);
  doc.line(20, y + 17, 92, y + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  if (totalPendingBalance > 0) {
    doc.setTextColor(252, 165, 165);
  } else {
    doc.setTextColor(110, 231, 183);
  }
  doc.text(`(=) SALDO LÍQUIDO A LA FECHA: S/ ${totalPendingBalance.toFixed(2)}`, 20, y + 22);

  // Right side of summary: Official payment notice
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`OPCIONES DE PAGO HABILITADAS:`, 105, y + 7);
  doc.text(`• Cuentas Bancarias / Depósitos (BCP, BBVA, Interbank)`, 105, y + 12);
  doc.text(`• Billeteras Digitales (Yape / Plin al ${phone})`, 105, y + 17);
  doc.text(`• Reportar comprobante al WhatsApp comercial: ${phone}`, 105, y + 22);

  // 7. Page Numbers on Page Footer
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Estado de Cuenta Oficial • ${companyName} • Emitido el ${currentDateStr}`, 14, 290);
    doc.text(`Página ${page} de ${totalPages}`, 196, 290, { align: 'right' });
  }

  doc.save(`Estado_Cuenta_Bancario_${client.name.replace(/\s+/g, '_')}.pdf`);
}

export function generateMonthlyReportPDF(monthName: string, company: Company, weighings: WeighingRecord[]) {
  const doc = new jsPDF();
  let y = 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.name || 'JBALANCE CONTROL', 14, y);
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
  const hasVoucher = Boolean(payment.voucherUrl);
  const calculatedHeight = 160 + (hasVoucher ? 38 : 0);

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, calculatedHeight], // Formato Ticket 80mm
  });

  let y = 5;

  // Frame Outer Border
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.rect(3, 3, 74, calculatedHeight - 6);

  // Background System Watermark
  addSystemWatermark(doc, calculatedHeight);

  // 1. Company Header Logo Box
  y = drawCompanyHeaderLogo(doc, company, y);

  // Title Navy Box
  doc.setFillColor(15, 23, 42);
  doc.rect(5, y, 70, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('COMPROBANTE DE ABONO Y PAGO', 40, y + 4.8, { align: 'center' });

  y += 10;
  doc.setTextColor(0, 0, 0);

  // Recibo & Datos Cliente
  doc.setFillColor(241, 245, 249);
  doc.rect(5, y, 70, 5, 'F');
  doc.rect(5, y, 70, 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DATOS DE LA TRANSACCIÓN', 7, y + 3.5);

  y += 5;

  const receiptNum = `REC-${payment.id.substring(0, 8).toUpperCase()}`;
  const dateStr = new Date(payment.createdAt).toLocaleString('es-ES');
  const clientName = payment.clientName || client?.name || 'Cliente Registrar';

  doc.rect(5, y, 70, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`RECIBO Nº: ${receiptNum}`, 7, y + 4.5);
  doc.text(`FECHA PAGO: ${dateStr}`, 7, y + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`CLIENTE: ${clientName.substring(0, 28)}`, 7, y + 12.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`MÉTODO DE PAGO: ${payment.method.toUpperCase()}`, 7, y + 16.5);
  if (payment.reference) {
    doc.text(`Nº OPERACIÓN: ${payment.reference.substring(0, 24)}`, 7, y + 20.5);
  }

  y += 25;

  // Highlighted Payment Amount Box
  doc.setFillColor(15, 23, 42); // Navy Dark
  doc.rect(5, y, 70, 14, 'F');
  doc.setTextColor(255, 255, 255);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('MONTO ABONADO:', 7, y + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153); // Emerald
  doc.text(`S/ ${payment.amount.toFixed(2)}`, 73, y + 6, { align: 'right' });

  if (client && client.currentBalance !== undefined) {
    doc.setTextColor(226, 232, 240);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Saldo Actual Restante del Cliente:', 7, y + 11);
    doc.setFont('helvetica', 'bold');
    doc.text(`S/ ${client.currentBalance.toFixed(2)}`, 73, y + 11, { align: 'right' });
  }

  y += 17;
  doc.setTextColor(0, 0, 0);

  // Attached Voucher Photo
  if (payment.voucherUrl) {
    try {
      doc.setFillColor(248, 250, 252);
      doc.rect(5, y, 70, 32, 'F');
      doc.rect(5, y, 70, 32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('📷 FOTO / COMPROBANTE VOUCHER ADJUNTO:', 7, y + 4);

      const format = payment.voucherUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(payment.voucherUrl, format, 8, y + 5.5, 64, 24);
      y += 35;
    } catch (e) {
      console.warn('Error rendering voucher image in PDF:', e);
    }
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('JBALANCE CONTROL - Comprobante de Abono Registrado', 40, y, { align: 'center' });
  y += 3.5;
  doc.text('Operador: ' + (payment.createdBy || 'Sistema'), 40, y, { align: 'center' });

  return doc;
}

export function downloadPaymentReceiptPDF(payment: PaymentRecord, client?: Client, company?: Company) {
  const doc = generatePaymentReceiptPDF(payment, client, company);
  doc.save(`Recibo_Abono_${payment.id}.pdf`);
}

export function generatePaymentsReportPDF(payments: PaymentRecord[], company?: Company) {
  const doc = new jsPDF();
  let y = 15;

  const companyName = company?.name || 'JBALANCE CONTROL PERÚ';

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

