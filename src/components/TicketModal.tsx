import React from 'react';
import { WeighingRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { downloadTicketPDF } from '../lib/pdfGenerator';
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
      `*SALDO PENDIENTE: S/ ${record.pendingAmount.toFixed(2)}*%0A%0A` +
      `¡Gracias por su preferencia!`;

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-extrabold text-sm text-white">Comprobante de Ticket Generado</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div id="thermal-ticket-print" className="bg-white text-slate-900 p-5 rounded-2xl shadow-xl font-sans text-xs space-y-3.5 max-w-sm mx-auto border-2 border-slate-900">
            
            {/* Header Thermal Logo & Company Info */}
            <div className="text-center space-y-1 pb-2 border-b-2 border-slate-900">
              {activeCompany?.logoUrl && (
                <img 
                  src={activeCompany.logoUrl} 
                  alt="Logo Empresa" 
                  className="h-12 max-w-[140px] mx-auto object-contain mb-1 rounded" 
                />
              )}
              <div className="font-black text-sm uppercase tracking-tight text-slate-900">
                {activeCompany?.name || 'JEAN-BARSA AVÍCOLA SYSTEM'}
              </div>
              <p className="text-[10px] font-bold font-mono text-slate-700">{activeCompany?.taxId || 'RUC 20601234567'}</p>
              <p className="text-[10px] text-slate-600">{activeCompany?.address || 'Av. Panamericana Sur Km 35, Lima - Perú'}</p>
              <p className="text-[10px] text-slate-600">Tel: {activeCompany?.phone || '+51 987-654-321'}</p>
            </div>

            {/* Ticket Identifier Box */}
            <div className="bg-slate-900 text-white p-2.5 rounded-xl text-center space-y-0.5">
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">COMPROBANTE DE PESA Y VENTA</div>
              <div className="font-black text-base text-emerald-400 font-mono tracking-widest">{record.ticketNumber}</div>
              <div className="text-[10px] text-slate-300 font-mono">
                {new Date(record.createdAt).toLocaleString('es-ES')}
              </div>
            </div>

            {/* Client Info Grid Box */}
            <div className="border-2 border-slate-900 rounded-xl overflow-hidden divide-y divide-slate-300 text-[11px]">
              <div className="p-2 bg-slate-50 flex justify-between">
                <span className="font-bold text-slate-600">CLIENTE:</span>
                <span className="font-black text-slate-900">{record.clientName}</span>
              </div>
              {record.galponName && (
                <div className="p-2 flex justify-between">
                  <span className="font-bold text-slate-600">GALPÓN ORIGEN:</span>
                  <span className="font-extrabold text-emerald-700">{record.galponName}</span>
                </div>
              )}
              <div className="p-2 flex justify-between">
                <span className="font-bold text-slate-600">CONDICIÓN:</span>
                <span className="font-bold uppercase text-slate-800">{record.paymentType} {record.creditDays ? `(${record.creditDays} Días)` : ''}</span>
              </div>
              <div className="p-2 flex justify-between bg-slate-100">
                <span className="font-bold text-slate-600">ESTADO CANCELACIÓN:</span>
                <span className={`font-black uppercase ${record.paymentStatus === 'pagado' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {record.paymentStatus === 'pagado' ? 'PAGADO / CANCELADO' : 'PENDIENTE DE PAGO'}
                </span>
              </div>
            </div>

            {/* Detailed Table Box con cuadros bien definidos */}
            <div className="border-2 border-slate-900 rounded-xl overflow-hidden">
              <div className="bg-slate-900 text-white font-bold p-1.5 text-[10px] uppercase flex justify-between border-b border-slate-800">
                <span>CONCEPTO DETALLADO</span>
                <span>CANTIDAD / VALOR</span>
              </div>
              
              <div className="divide-y divide-slate-300 text-[11px]">
                <div className="p-2 flex justify-between">
                  <span className="text-slate-700 font-medium">Cantidad de Pollos:</span>
                  <span className="font-bold font-mono text-slate-900">{record.chickenCount} aves</span>
                </div>
                <div className="p-2 flex justify-between bg-slate-50">
                  <span className="text-slate-700 font-medium">Peso Bruto Balanza:</span>
                  <span className="font-bold font-mono text-slate-900">{record.grossWeight.toFixed(2)} kg</span>
                </div>
                <div className="p-2 flex justify-between bg-slate-50">
                  <span className="text-slate-700 font-medium">Tara (Javas / Cestas):</span>
                  <span className="font-bold font-mono text-slate-900">-{record.tareWeight.toFixed(2)} kg</span>
                </div>
                <div className="p-2.5 flex justify-between bg-emerald-50 font-black text-slate-900 border-t-2 border-slate-900">
                  <span>PESO NETO COBRABLE:</span>
                  <span className="font-black font-mono text-emerald-800 text-sm">{record.netWeight.toFixed(2)} kg</span>
                </div>
                <div className="p-2 flex justify-between bg-emerald-100/60 font-bold text-slate-900">
                  <span className="text-slate-800">PROMEDIO POR POLLO:</span>
                  <span className="font-black font-mono text-emerald-900">{avgWeight} kg/ave</span>
                </div>
                <div className="p-2 flex justify-between text-slate-700">
                  <span>Precio por Kilo:</span>
                  <span className="font-bold font-mono">S/ {record.unitPrice.toFixed(2)} / kg</span>
                </div>
              </div>

              {/* Total Row Box */}
              <div className="bg-slate-900 text-white p-2.5 flex justify-between items-center border-t-2 border-slate-900">
                <span className="font-extrabold text-xs tracking-wider">TOTAL MONTO VENTA:</span>
                <span className="font-black text-base font-mono text-emerald-300">S/ {record.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* DETALLE DE PAGOS / ABONOS HASTA SU CANCELACIÓN */}
            <div className="border-2 border-slate-900 rounded-xl overflow-hidden text-[11px]">
              <div className="bg-slate-100 p-1.5 font-black text-slate-800 uppercase text-[10px] border-b border-slate-300">
                HISTORIAL DE PAGOS / ABONOS REGISTRADOS
              </div>
              <div className="divide-y divide-slate-200">
                {ticketPayments.length === 0 ? (
                  <div className="p-2 text-slate-500 italic text-[10px]">
                    {record.paymentStatus === 'pagado' ? 'Cancelado al contado' : 'Sin abonos parciales registrados aún'}
                  </div>
                ) : (
                  ticketPayments.map((p) => (
                    <div key={p.id} className="p-2 flex justify-between items-center bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900 uppercase text-[10px]">{p.method} - {p.reference || 'Sin Ref'}</div>
                        <div className="text-[9px] text-slate-500">{new Date(p.createdAt).toLocaleDateString('es-ES')}</div>
                      </div>
                      <div className="font-black text-emerald-700 font-mono">
                        +S/ {p.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 bg-slate-100 flex justify-between font-bold text-slate-800 border-t border-slate-300">
                <span>Total Abonado:</span>
                <span className="font-mono text-emerald-700">S/ {record.paidAmount.toFixed(2)}</span>
              </div>
              <div className={`p-2 flex justify-between font-black text-xs ${record.pendingAmount <= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                <span>SALDO RESTANTE:</span>
                <span className="font-mono">S/ {record.pendingAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Scale Image Attachment in Ticket */}
            {record.scaleImageUrl && (
              <div className="border border-slate-300 rounded-xl p-2 text-center space-y-1 bg-slate-50">
                <div className="font-bold text-[9px] uppercase text-slate-500">Foto de Balanza Electrónica:</div>
                <img 
                  src={record.scaleImageUrl} 
                  alt="Foto Balanza" 
                  className="w-full h-32 object-cover rounded-lg border border-slate-300"
                />
              </div>
            )}

            <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] italic text-slate-600 space-y-0.5">
              <div>¡Gracias por su preferencia en Jean-Barsa Avícola System!</div>
              <div className="font-semibold text-slate-800">Atendido por: {record.createdBy}</div>
            </div>

          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-3 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Descargar PDF</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-emerald-900/40"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>

      </div>
    </div>
  );
};

