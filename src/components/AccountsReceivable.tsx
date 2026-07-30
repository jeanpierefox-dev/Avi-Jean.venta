import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { WeighingRecord, PaymentRecord, Client, PaymentMethod } from '../types';
import { TicketModal } from './TicketModal';
import { 
  Receipt, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Send, 
  Search,
  FileText,
  FileDown,
  History,
  QrCode,
  CreditCard,
  Camera,
  Upload,
  X,
  Eye,
  ArrowLeft,
  Trash2,
  Users,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react';
import { 
  downloadPaymentReceiptPDF, 
  generatePaymentsReportPDF,
  downloadTicketPDF,
  downloadCobranzaTicketPDF
} from '../lib/pdfGenerator';

interface AccountsReceivableProps {
  onSelectTab?: (tab: string) => void;
}

export const AccountsReceivable: React.FC<AccountsReceivableProps> = ({ onSelectTab }) => {
  const { activeCompany, currentUser } = useAuth();

  const { weighings, clients, payments, addPayment, deleteWeighing, checkOverduePayments } = useData();

  const [activeTab, setActiveTab] = useState<'cobros' | 'reporte_pagos'>('cobros');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [paymentsSearch, setPaymentsSearch] = useState<string>('');
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const [previewTicket, setPreviewTicket] = useState<WeighingRecord | null>(null);

  // Payment modal state
  const [selectedWeighing, setSelectedWeighing] = useState<WeighingRecord | null>(null);
  const [viewPaymentsTicket, setViewPaymentsTicket] = useState<WeighingRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yape');
  const [reference, setReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [voucherUrl, setVoucherUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCompanyId = activeCompany?.id || currentUser?.companyId || '';
  const companyClients = clients.filter(c => !currentCompanyId || c.companyId === currentCompanyId);

  const companyClientIds = new Set(companyClients.map(c => c.id));
  const companyClientNames = new Set(companyClients.map(c => (c.name || '').toLowerCase().trim()));

  const selectedClientObj = selectedClientFilter !== 'todos' ? companyClients.find(c => c.id === selectedClientFilter) : null;
  const selectedClientNameNorm = selectedClientObj ? (selectedClientObj.name || '').toLowerCase().trim() : '';

  const companyWeighings = weighings
    .filter(w => 
      !currentCompanyId || 
      w.companyId === currentCompanyId || 
      companyClientIds.has(w.clientId) || 
      (w.clientName && companyClientNames.has(w.clientName.toLowerCase().trim()))
    )
    .filter(w => currentUser?.role !== 'cliente' || w.clientId === currentUser?.clientId || (currentUser?.displayName && w.clientName?.toLowerCase().trim() === currentUser.displayName.toLowerCase().trim()))
    .filter(w => {
      if (selectedClientFilter === 'todos') return true;
      if (w.clientId === selectedClientFilter) return true;
      if (selectedClientNameNorm && w.clientName && w.clientName.toLowerCase().trim() === selectedClientNameNorm) return true;
      return false;
    });

  const companyPayments = payments
    .filter(p => 
      !currentCompanyId || 
      p.companyId === currentCompanyId || 
      companyClientIds.has(p.clientId) || 
      (p.clientName && companyClientNames.has(p.clientName.toLowerCase().trim()))
    )
    .filter(p => currentUser?.role !== 'cliente' || p.clientId === currentUser?.clientId || (currentUser?.displayName && p.clientName?.toLowerCase().trim() === currentUser.displayName.toLowerCase().trim()))
    .filter(p => {
      if (selectedClientFilter === 'todos') return true;
      if (p.clientId === selectedClientFilter) return true;
      if (selectedClientNameNorm && p.clientName && p.clientName.toLowerCase().trim() === selectedClientNameNorm) return true;
      return false;
    });

  const today = new Date().toISOString().split('T')[0];

  const pendingTickets = companyWeighings.filter(w => w.paymentStatus !== 'pagado');
  const overdueTickets = pendingTickets.filter(w => w.dueDate && w.dueDate < today);

  const totalPendingBalance = pendingTickets.reduce((sum, w) => sum + w.pendingAmount, 0);
  const totalOverdueBalance = overdueTickets.reduce((sum, w) => sum + w.pendingAmount, 0);
  const totalCollectedSoles = companyPayments.reduce((sum, p) => sum + p.amount, 0);

  const filteredWeighings = companyWeighings.filter(w => {
    const matchesSearch = w.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'vencidos') return w.dueDate && w.dueDate < today && w.paymentStatus !== 'pagado';
    if (filterStatus === 'pendientes') return w.paymentStatus === 'pendiente' || w.paymentStatus === 'parcial';
    if (filterStatus === 'pagados') return w.paymentStatus === 'pagado';
    return true;
  });

  const filteredPayments = companyPayments.filter(p => 
    (p.clientName || '').toLowerCase().includes(paymentsSearch.toLowerCase()) ||
    (p.reference || '').toLowerCase().includes(paymentsSearch.toLowerCase()) ||
    p.method.toLowerCase().includes(paymentsSearch.toLowerCase())
  );

  const handleOpenPaymentModal = (weighing: WeighingRecord) => {
    setSelectedWeighing(weighing);
    setPaymentAmount(weighing.pendingAmount);
    setReference('');
    setPaymentNotes('');
    setVoucherUrl('');
  };

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetVoucher = () => {
    const vouchers = [
      'https://images.unsplash.com/photo-1556742049-0a67dd3861c8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80'
    ];
    setVoucherUrl(vouchers[Math.floor(Math.random() * vouchers.length)]);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeighing || paymentAmount <= 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const newPaymentRecord = {
        companyId: selectedWeighing.companyId,
        weighingId: selectedWeighing.id,
        clientId: selectedWeighing.clientId,
        clientName: selectedWeighing.clientName,
        amount: paymentAmount,
        method: paymentMethod,
        reference: reference || `OPER-${Math.floor(Math.random() * 899999 + 100000)}`,
        status: 'aprobado' as const,
        notes: paymentNotes || 'Abono registrado en Cobranza',
        voucherUrl: voucherUrl || undefined,
      };

      const createdPayment = await addPayment(newPaymentRecord);

      const clientObj = clients.find(c => c.id === selectedWeighing.clientId);
      if (createdPayment && clientObj) {
        try {
          downloadPaymentReceiptPDF(createdPayment, clientObj, activeCompany || undefined);
        } catch (pdfErr) {
          console.warn('PDF download warning:', pdfErr);
        }
      }

      alert(`¡Abono de S/ ${paymentAmount.toFixed(2)} registrado con éxito!`);
      setSelectedWeighing(null);
    } catch (e) {
      console.error('Error processing payment:', e);
      alert('Error al registrar el abono.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminderWhatsApp = (w: WeighingRecord) => {
    const scaleImg = w.scaleImageUrl || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80';
    const text = `*RECORDATORIO DE COBRANZA - ${activeCompany?.name || 'JEAN-BARSA AVÍCOLA SYSTEM'}*%0A` +
      `Estimado cliente *${w.clientName}*, adjuntamos la información de su Ticket #${w.ticketNumber}:%0A` +
      `• Total Venta: S/ ${w.totalAmount.toFixed(2)}%0A` +
      `• Monto Pagado: S/ ${w.paidAmount.toFixed(2)}%0A` +
      `• *SALDO PENDIENTE:* *S/ ${w.pendingAmount.toFixed(2)}*%0A` +
      `• Fecha Vencimiento: ${w.dueDate}%0A%0A` +
      `📷 *FOTO / IMAGEN DE LA PESA EN BALANZA:*%0A${encodeURIComponent(scaleImg)}%0A%0A` +
      `Agradecemos coordinar el abono por Yape / Plim / Transferencia. ¡Muchas gracias!`;

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleExportPaymentsPDF = () => {
    generatePaymentsReportPDF(companyPayments, activeCompany || undefined);
  };

  return (
    <div className="space-y-4 pb-8">
      
      {/* Top Header Card for Accounts Receivable */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-600 rounded-2xl shadow-md border border-amber-400">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/40">
                  JEANPIERE BARBOZA • 2026
                </span>
                <span className="text-xs text-slate-400 font-semibold">• Gestión de Cobranzas</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                Control de Cuentas por Cobrar y Registro de Abonos (S/)
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold px-3.5 py-2.5 rounded-2xl text-xs flex items-center space-x-2 border border-slate-700 transition-colors shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Volver al Menú</span>
              </button>
            )}

            <button
              onClick={checkOverduePayments}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold px-3 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 border border-amber-500/40 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Verificar Vencidos</span>
            </button>

            <button
              onClick={handleExportPaymentsPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Reporte PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards in Peruvian Soles S/ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Saldo Pendiente:</span>
            <div className="text-lg sm:text-xl font-black text-amber-600 font-mono">
              S/ {totalPendingBalance.toFixed(2)}
            </div>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg font-mono">
            {pendingTickets.length} tck
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Saldo Vencido Crítico:</span>
            <div className="text-lg sm:text-xl font-black text-rose-600 font-mono">
              S/ {totalOverdueBalance.toFixed(2)}
            </div>
          </div>
          <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded-lg font-mono font-bold">
            {overdueTickets.length} vencidos
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Total Abonos Recaudados:</span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
              S/ {totalCollectedSoles.toFixed(2)}
            </div>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg font-mono">
            {companyPayments.length} rec
          </span>
        </div>
      </div>

      {/* Client Selector Filter (Filtrar Deudas por Cliente) */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <Users className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800 shrink-0">Filtrar Deudas por Cliente:</span>
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-blue-500 w-full sm:w-72"
          >
            <option value="todos">Todos los Clientes ({companyClients.length})</option>
            {companyClients.map(cli => (
              <option key={cli.id} value={cli.id}>
                {cli.name} (Deuda: S/ {cli.currentBalance.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {selectedClientFilter !== 'todos' && (
          <button
            onClick={() => setSelectedClientFilter('todos')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline self-end sm:self-center"
          >
            Mostrar todos los clientes
          </button>
        )}
      </div>

      {/* Main Tabs: Cobros vs Reporte de Pagos */}
      <div className="flex border-b border-slate-200 space-x-3 text-xs">
        <button
          onClick={() => setActiveTab('cobros')}
          className={`pb-2.5 font-extrabold flex items-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'cobros' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tickets y Saldos Pendientes</span>
        </button>

        <button
          onClick={() => setActiveTab('reporte_pagos')}
          className={`pb-2.5 font-extrabold flex items-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'reporte_pagos' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Reporte de Pagos Realizados ({companyPayments.length})</span>
        </button>
      </div>

      {/* TAB 1: COBROS Y TICKETS */}
      {activeTab === 'cobros' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar ticket o cliente..."
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
              {['todos', 'pendientes', 'vencidos', 'pagados'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                    filterStatus === st ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Ticket / Fecha</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Pollos / Kilos</th>
                    <th className="py-2.5 px-3">Total S/</th>
                    <th className="py-2.5 px-3">Saldo Pendiente</th>
                    <th className="py-2.5 px-3">Vencimiento</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredWeighings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                        No se encontraron registros de cobro con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                  {filteredWeighings.map((w) => {
                    const isOverdue = w.dueDate && w.dueDate < today && w.paymentStatus !== 'pagado';

                    return (
                      <tr key={w.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white">{w.ticketNumber}</div>
                          <div className="text-[10px] text-slate-500">{new Date(w.createdAt).toLocaleDateString('es-ES')}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{w.clientName}</td>
                        <td className="py-2.5 px-3 font-mono">
                          {w.chickenCount} pollos ({w.netWeight.toFixed(1)} kg)
                        </td>
                        <td className="py-2.5 px-3 font-bold font-mono text-slate-100">S/ {w.totalAmount.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-bold font-mono text-rose-400">
                          S/ {w.pendingAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {w.dueDate || 'Contado'}
                        </td>
                        <td className="py-2.5 px-3">
                          {isOverdue ? (
                            <span className="bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] flex items-center space-x-1 w-max">
                              <AlertTriangle className="w-3 h-3" />
                              <span>VENCIDO</span>
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                              w.paymentStatus === 'pagado' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              w.paymentStatus === 'parcial' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {w.paymentStatus}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1.5 flex items-center justify-end">
                          <button
                            onClick={() => setPreviewTicket(w)}
                            title="Visualizar Ticket de Pesaje con Logo"
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-xl inline-flex items-center text-[11px] font-bold space-x-1 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visualizar</span>
                          </button>

                          <button
                            onClick={() => setViewPaymentsTicket(w)}
                            title="Ver Historial de Abonos de esta Deuda"
                            className="bg-slate-800 hover:bg-slate-700 text-sky-400 p-1.5 rounded-xl border border-slate-700 inline-flex items-center text-[11px] font-bold space-x-1"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Abonos</span>
                          </button>

                          <button
                            onClick={() => {
                              const ticketPayments = payments.filter(p => p.weighingId === w.id);
                              downloadCobranzaTicketPDF(w, activeCompany || undefined, ticketPayments);
                            }}
                            title="Imprimir Ticket de Cobranza y Abonos"
                            className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 p-1.5 rounded-xl border border-amber-800/80 inline-flex items-center text-[11px] font-bold space-x-1"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ticket Cobranza</span>
                          </button>

                          <button
                            onClick={() => {
                              downloadTicketPDF(w, activeCompany || undefined);
                            }}
                            title="Imprimir Ticket de Venta Directa"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-xl border border-slate-700 inline-flex items-center text-[11px] font-bold space-x-1"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Ticket Venta</span>
                          </button>

                          {w.pendingAmount > 0 && (
                            <>
                              <button
                                onClick={() => handleOpenPaymentModal(w)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] shadow transition-colors"
                              >
                                Registrar Abono (S/)
                              </button>

                              <button
                                onClick={() => handleSendReminderWhatsApp(w)}
                                title="Enviar recordatorio WhatsApp"
                                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 p-1.5 rounded-xl border border-slate-700 inline-flex items-center"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {(currentUser?.role === 'admin' || currentUser?.role === 'empresa') && (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Desea ELIMINAR/QUITAR este ticket de pesaje ${w.ticketNumber}? Permiso exclusivo para Administrador y Empresa.`)) {
                                  deleteWeighing(w.id);
                                }
                              }}
                              title="Quitar / Eliminar Ticket de Venta (Solo Adm y Empresa)"
                              className="bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 p-1.5 rounded-xl border border-slate-700 hover:border-rose-900 inline-flex items-center transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORTE COMPLETO DE PAGOS REALIZADOS */}
      {activeTab === 'reporte_pagos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={paymentsSearch}
                onChange={(e) => setPaymentsSearch(e.target.value)}
                placeholder="Buscar por cliente, referencia o método..."
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleExportPaymentsPDF}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar Reporte Completo (PDF)</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Fecha / Hora</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Método de Pago</th>
                    <th className="p-4">Referencia / Nº Op.</th>
                    <th className="p-4">Voucher</th>
                    <th className="p-4">Monto Abonado (S/)</th>
                    <th className="p-4 text-right">Comprobante / Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                        No hay registros de pagos recibidos.
                      </td>
                    </tr>
                  )}
                  {filteredPayments.map((p) => {
                    const clientObj = clients.find(c => c.id === p.clientId);

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString('es-ES')} {new Date(p.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 font-bold text-white">{p.clientName || 'Cliente General'}</td>
                        <td className="p-4">
                          <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase text-emerald-400 flex items-center space-x-1 w-max">
                            <QrCode className="w-3 h-3 text-emerald-400" />
                            <span>{p.method}</span>
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-300">{p.reference || 'N/A'}</td>
                        <td className="p-4">
                          {p.voucherUrl ? (
                            <button
                              onClick={() => setActiveZoomImage(p.voucherUrl!)}
                              className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg text-xs text-sky-400 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Voucher</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px] italic">Sin voucher</span>
                          )}
                        </td>
                        <td className="p-4 font-black font-mono text-emerald-400 text-sm">
                          S/ {p.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => downloadPaymentReceiptPDF(p, clientObj, activeCompany || undefined)}
                            className="bg-slate-800 hover:bg-slate-700 text-emerald-300 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold inline-flex items-center space-x-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Recibo PDF</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedWeighing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Registrar Abono o Pago (Soles)</h3>
                <p className="text-xs text-slate-400">{selectedWeighing.ticketNumber} - {selectedWeighing.clientName}</p>
              </div>
              <button
                onClick={() => setSelectedWeighing(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
                <span className="text-slate-400">Saldo Pendiente Actual:</span>
                <span className="text-base font-extrabold text-amber-400">S/ {selectedWeighing.pendingAmount.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Monto del Abono (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedWeighing.pendingAmount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 text-emerald-400 text-lg font-extrabold font-mono rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tipo / Método de Pago (Perú)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'efectivo', label: 'Efectivo 💵' },
                    { id: 'yape', label: 'Yape 📱' },
                    { id: 'plim', label: 'Plim 💳' },
                    { id: 'transferencia', label: 'Transferencia 🏦' },
                    { id: 'cheque', label: 'Cheque 📄' },
                    { id: 'otro', label: 'Otro' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`py-2 px-2.5 rounded-xl font-bold border text-xs transition-all ${
                        paymentMethod === m.id
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Número de Operación / Referencia</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="ej. OP-192837 / Yape 9823"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Voucher Image Upload */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Adjuntar Foto / Captura de Voucher</label>
                {voucherUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                    <img src={voucherUrl} alt="Voucher" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => setVoucherUrl('')}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <label className="cursor-pointer bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1 text-slate-300">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-bold">Cámara</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleVoucherUpload} className="hidden" />
                    </label>

                    <label className="cursor-pointer bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1 text-slate-300">
                      <FolderOpen className="w-4 h-4 text-blue-400" />
                      <span className="text-[11px] font-bold">Carpeta</span>
                      <input type="file" accept="image/*" onChange={handleVoucherUpload} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={handlePresetVoucher}
                      className="bg-slate-950 border border-slate-700 hover:border-emerald-500 p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1 text-slate-300"
                    >
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span className="text-[11px] font-bold">Ejemplo</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedWeighing(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/40"
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ver Historial de Pagos y Abonos de la Deuda/Ticket */}
      {viewPaymentsTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Historial de Abonos / Pagos</h3>
                  <p className="text-xs text-slate-400">
                    Ticket <span className="text-emerald-400 font-mono font-bold">{viewPaymentsTicket.ticketNumber}</span> - {viewPaymentsTicket.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewPaymentsTicket(null)}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Summary Row */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">TOTAL VENTA</span>
                <span className="text-xs font-bold text-slate-100">S/ {viewPaymentsTicket.totalAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block">ABONADO</span>
                <span className="text-xs font-bold text-emerald-400">S/ {viewPaymentsTicket.paidAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-400 block">RESTANTE</span>
                <span className="text-xs font-bold text-rose-400">S/ {viewPaymentsTicket.pendingAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* List of payments */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {payments.filter(p => p.weighingId === viewPaymentsTicket.id || (p.clientId === viewPaymentsTicket.clientId && !p.weighingId)).length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic bg-slate-950/50 rounded-2xl border border-slate-800">
                  No se registran abonos aún para esta deuda.
                </div>
              ) : (
                payments
                  .filter(p => p.weighingId === viewPaymentsTicket.id || (p.clientId === viewPaymentsTicket.clientId && !p.weighingId))
                  .map((p) => (
                    <div key={p.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-200 uppercase">{p.method}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                            {p.reference || 'S/N'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(p.createdAt).toLocaleString('es-ES')} - por {p.createdBy}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {p.voucherUrl && (
                          <button
                            onClick={() => setActiveZoomImage(p.voucherUrl!)}
                            title="Ver Captura Voucher"
                            className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                        )}
                        <span className="text-xs font-black font-mono text-emerald-400">
                          S/ {p.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  const ticketPayments = payments.filter(p => p.weighingId === viewPaymentsTicket.id);
                  downloadTicketPDF(viewPaymentsTicket, activeCompany || undefined, ticketPayments);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 border border-slate-700 transition-colors"
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>Imprimir Ticket con Pagos (PDF)</span>
              </button>

              <button
                onClick={() => setViewPaymentsTicket(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal for Vouchers */}
      {activeZoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-3 shadow-2xl">
            <button
              onClick={() => setActiveZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={activeZoomImage} 
              alt="Voucher Ampliado" 
              className="w-full max-h-[80vh] object-contain rounded-2xl" 
            />
            <div className="p-2 text-center text-xs text-slate-400 font-mono">
              Comprobante de Voucher Registrado
            </div>
          </div>
        </div>
      )}

      {/* Ticket Visualizer Preview Modal */}
      {previewTicket && (
        <TicketModal
          record={previewTicket}
          onClose={() => setPreviewTicket(null)}
        />
      )}

    </div>
  );
};


