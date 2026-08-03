import React from 'react';
import { WeighingRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { downloadTicketPDF } from '../lib/pdfGenerator';
import systemLogo from '../assets/images/system_futuristic_logo_1785723812533.jpg';
import { 
  X, 
  Printer, 
  FileDown, 
  Share2, 
  CheckCircle, 
  Scale, 
  Building2, 
  Phone, 
  Calendar,
  DollarSign,
  Receipt,
  CheckCircle2
} from 'lucide-react';

interface TicketModalProps {
  record: WeighingRecord;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ record, onClose }) => {
  const { activeCompany } = useAuth();
  const { payments } = useData();

  // Find all payments registered for this weighing ticket
  const ticketPayments = payments.filter(p => p.weighingId === record.id);

  const avgWeight = record.chickenCount > 0 ? (record.netWeight / record.chickenCount).toFixed(2) : '0.00';

  const handleDownloadPDF = () => {
    downloadTicketPDF(record, activeCompany || undefined, ticketPayments);
  };

  const handleShareWhatsApp = () => {
    const scaleImg = record.scaleImageUrl || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80';
    const text = `*COMPROBANTE DE PESA - ${activeCompany?.name || 'JEAN-BARSA AVÍCOLA SYSTEM'}*%0A` +
      `Ticket: ${record.ticketNumber}%0A` +
      `Cliente: ${record.clientName}%0A` +
      `Fecha: ${new Date(record.createdAt).toLocaleDateString('es-ES')}%0A` +
      `----------------------------------%0A` +
      `Aves: ${record.chickenCount} pollos%0A` +
      `Peso Neto Total: ${record.netWeight.toFixed(2)} kg%0A` +
      `*PROMEDIO POR POLLO: ${avgWeight} kg/ave*%0A` +
      `Precio/kg: S/ ${record.unitPrice.toFixed(2)}%0A` +
      `----------------------------------%0A` +
      `*TOTAL VENTA: S/ ${record.totalAmount.toFixed(2)}*%0A` +
      `Abonado: S/ ${record.paidAmount.toFixed(2)}%0A` +
      `*SALDO PENDIENTE: S/ ${record.pendingAmount.toFixed(2)}*%0A` +
      `----------------------------------%0A` +
      `📷 *FOTO DE LA PESA EN BALANZA:*%0A${encodeURIComponent(scaleImg)}%0A%0A` +
      `¡Gracias por su preferencia!`;

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-extrabold text-sm text-slate-900">Comprobante de Ticket Generado</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-100/60">
          
          <div id="thermal-ticket-print" className="bg-white text-slate-900 p-6 rounded-2xl shadow-lg font-sans text-xs space-y-4 max-w-sm mx-auto border-2 border-slate-900 relative overflow-hidden">
            
            {/* Background System Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] select-none z-0">
              <img 
                src={systemLogo} 
                alt="Marca de agua sistema" 
                className="w-56 h-56 object-cover rounded-full" 
              />
            </div>

            <div className="relative z-10 space-y-4">
            {/* 1. Header Ticket info - Matches reference image */}
            <div className="text-center space-y-0.5 pb-2">
              {activeCompany?.logoUrl && (
                <img 
                  src={activeCompany.logoUrl} 
                  alt="Logo Empresa" 
                  className="h-10 max-w-[130px] mx-auto object-contain mb-1" 
                />
              )}
              <div className="font-black text-base uppercase tracking-tight text-slate-900">
                {activeCompany?.name || 'AGROPECUARIA CAMPOVERDE SAC'}
              </div>
              <div className="font-extrabold text-sm text-slate-800 tracking-wider">
                TICKET DE PESAJE
              </div>
              <div className="text-[11px] font-mono text-slate-700 font-semibold">
                FECHA: {new Date(record.createdAt).toLocaleDateString('es-ES')}, {new Date(record.createdAt).toLocaleTimeString('es-ES')}
              </div>
              <div className="text-[10px] text-slate-500 font-mono font-bold">
                TICKET Nº: {record.ticketNumber}
              </div>
            </div>

            {/* Solid Horizontal Separator */}
            <div className="border-b-2 border-slate-900"></div>

            {/* LOTE & CLIENTE */}
            <div className="space-y-1 text-xs font-black px-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-900 min-w-[70px]">LOTE:</span>
                <span className="text-slate-900 uppercase font-bold">{record.galponName || 'ABEL MORALES SERRANO'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 min-w-[70px]">CLIENTE:</span>
                <span className="text-slate-900 uppercase font-extrabold text-sm">{record.clientName}</span>
              </div>
            </div>

            {/* TABLA 1: RESUMEN DE CANTIDADES */}
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
              <div className="bg-slate-200 text-slate-900 font-extrabold text-[11px] uppercase p-1.5 text-center border-b border-slate-300 tracking-wide">
                RESUMEN DE CANTIDADES
              </div>
              <div className="divide-y divide-slate-200 text-[11px]">
                {record.tareWeight > 0 && (
                  <div className="p-1.5 px-3 flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Jabas Llenas:</span>
                    <span className="font-extrabold font-mono text-slate-900">
                      {record.scaleEntries ? record.scaleEntries.length * 10 : Math.max(10, Math.round(record.chickenCount / 9))}
                    </span>
                  </div>
                )}
                <div className="p-1.5 px-3 flex justify-between items-center bg-slate-50">
                  <span className="font-bold text-slate-900">Total Pollos:</span>
                  <span className="font-black font-mono text-slate-900 text-xs">{record.chickenCount}</span>
                </div>
                {record.tareWeight > 0 && (
                  <div className="p-1.5 px-3 flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Jabas Vacías:</span>
                    <span className="font-extrabold font-mono text-slate-900">
                      {Math.max(10, Math.round(record.chickenCount / 9))}
                    </span>
                  </div>
                )}
                {Boolean(record.deadChickensCount && record.deadChickensCount > 0) && (
                  <div className="p-1.5 px-3 flex justify-between items-center bg-slate-50">
                    <span className="font-bold text-slate-900">TOTAL MUERTOS:</span>
                    <span className="font-mono text-slate-900">{record.deadChickensCount}</span>
                  </div>
                )}
                <div className="p-1.5 px-3 flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Prom. Peso Neto:</span>
                  <span className="font-extrabold font-mono text-slate-900">{avgWeight} kg</span>
                </div>
                {Boolean(record.deadChickensCount && record.deadChickensCount > 0) && (
                  <div className="p-1.5 px-3 flex justify-between items-center bg-slate-50">
                    <span className="font-semibold text-slate-800">Prom. P. Muerto:</span>
                    <span className="font-mono text-slate-900">0.00 kg</span>
                  </div>
                )}
              </div>
            </div>

            {/* TABLA 2: DETALLE DE PESOS */}
            <div className="space-y-2">
              <div className="text-center font-extrabold text-xs uppercase tracking-wider text-slate-900 pt-1">
                DETALLE DE PESOS
              </div>

              {/* LLENAS / PESADAS BANNER & GRID */}
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                <div className="bg-slate-200 text-slate-900 font-extrabold text-[10px] uppercase p-1 text-center border-b border-slate-300">
                  {record.tareWeight > 0 ? `LLENAS (${record.scaleEntries?.length || 1} pesadas)` : `PESADAS DE BALANZA (${record.scaleEntries?.length || 1})`}
                </div>

                <div className="p-2 divide-y divide-slate-100 text-[10px] font-mono">
                  {record.scaleEntries && record.scaleEntries.length > 0 ? (
                    record.scaleEntries.map((se, idx) => (
                      <div key={se.id || idx} className="py-1 flex justify-between items-center">
                        <span className="font-semibold text-slate-700">Pesa #{idx + 1} ({se.chickens} pollos):</span>
                        <span className="font-black text-slate-900">{se.grossWeight.toFixed(2)} kg</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-1 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Pesa Única ({record.chickenCount} pollos):</span>
                      <span className="font-black text-slate-900">{record.grossWeight.toFixed(2)} kg</span>
                    </div>
                  )}
                </div>

                <div className="p-1.5 px-3 bg-slate-100 border-t border-slate-300 text-right font-black text-xs text-slate-900">
                  TOTAL PESADO: {record.grossWeight.toFixed(2)} kg
                </div>
              </div>

              {/* VACÍAS BANNER & GRID (Only rendered if tareWeight > 0) */}
              {record.tareWeight > 0 && (
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <div className="bg-slate-200 text-slate-900 font-extrabold text-[10px] uppercase p-1 text-center border-b border-slate-300">
                    VACÍAS
                  </div>

                  <div className="p-1.5 px-3 text-[10px] font-mono flex justify-between items-center text-slate-700">
                    <span>Tara Total (Jabas/Cestas):</span>
                    <span className="font-bold">{record.tareWeight.toFixed(2)} kg</span>
                  </div>

                  <div className="p-1.5 px-3 bg-slate-100 border-t border-slate-300 text-right font-black text-xs text-slate-900">
                    TOTAL VACÍAS: {record.tareWeight.toFixed(2)} kg
                  </div>
                </div>
              )}
            </div>

            {/* Solid Horizontal Separator */}
            <div className="border-b-2 border-slate-900"></div>

            {/* RESUMEN FINAL PESOS */}
            <div className="space-y-1 text-xs font-mono px-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Peso Bruto:</span>
                <span className="font-bold text-slate-900">{record.grossWeight.toFixed(2)} kg</span>
              </div>
              {record.tareWeight > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">Tara Total:</span>
                    <span className="font-bold text-slate-900">-{record.tareWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between items-center font-black text-sm text-slate-900 pt-0.5">
                    <span>TOTAL MERMA:</span>
                    <span>-0.00 kg</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-[11px] pt-1">
                <span className="font-semibold text-slate-700">Prom. Peso Neto:</span>
                <span className="font-bold text-slate-900">{avgWeight} kg</span>
              </div>
              {Boolean(record.deadChickensCount && record.deadChickensCount > 0) && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-700">Prom. P. Muerto:</span>
                  <span className="font-mono text-slate-900">0.00 kg</span>
                </div>
              )}
            </div>

            {/* Separator for Financial Totals */}
            <div className="border-b-2 border-slate-900"></div>

            {/* DETALLE FINANCIERO / IMPORTE */}
            <div className="bg-slate-900 text-white p-3 rounded-xl space-y-1.5 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Precio por Kilo:</span>
                <span className="font-mono font-bold text-slate-100">S/ {record.unitPrice.toFixed(2)} / kg</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black border-t border-slate-700 pt-1.5">
                <span className="text-emerald-400">TOTAL IMPORTE:</span>
                <span className="font-mono text-emerald-300 text-base">S/ {record.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Monto Abonado:</span>
                <span className="font-mono text-emerald-400 font-bold">S/ {record.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black border-t border-slate-800 pt-1">
                <span className="text-amber-300">SALDO PENDIENTE:</span>
                <span className="font-mono text-rose-300">S/ {record.pendingAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Attached Scale Photos for every entry */}
            {record.scaleEntries && record.scaleEntries.some(s => Boolean(s.photoUrl)) ? (
              <div className="space-y-3 pt-2">
                <div className="text-center font-extrabold text-[10px] uppercase tracking-wider text-slate-800 border-t border-slate-300 pt-2">
                  FOTOS DE PESAS DE BALANZA REGISTRADAS:
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {record.scaleEntries.map((se, idx) => se.photoUrl ? (
                    <div key={se.id || idx} className="border-2 border-slate-800 rounded-xl p-2 text-center space-y-1 bg-slate-50">
                      <div className="font-extrabold text-[10px] uppercase text-slate-900 flex justify-between px-1">
                        <span>📷 Foto Pesa #{idx + 1} ({se.chickens} pollos)</span>
                        <span className="text-emerald-700 font-mono font-black">{se.grossWeight.toFixed(2)} kg</span>
                      </div>
                      <img 
                        src={se.photoUrl} 
                        alt={`Foto Pesa #${idx + 1}`} 
                        className="w-full h-40 object-cover rounded-lg border border-slate-300"
                      />
                    </div>
                  ) : null)}
                </div>
              </div>
            ) : record.scaleImageUrl ? (
              <div className="border-2 border-slate-800 rounded-xl p-2 text-center space-y-1 bg-slate-50">
                <div className="font-bold text-[9px] uppercase text-slate-600">📷 Foto Adjunta de Balanza Electrónica:</div>
                <img 
                  src={record.scaleImageUrl} 
                  alt="Foto Balanza" 
                  className="w-full h-40 object-cover rounded-lg border border-slate-300"
                />
              </div>
            ) : null}

            <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] italic text-slate-600 space-y-0.5">
              <div>AvisControl - Sistema Corporativo Avícola</div>
              <div className="font-semibold text-slate-800">Atendido por: {record.createdBy}</div>
            </div>

            </div>

          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/90 grid grid-cols-3 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>Descargar PDF</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>

      </div>
    </div>
  );
};

