import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Scale, 
  Receipt, 
  FileDown, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Eye, 
  Camera, 
  X, 
  Upload, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  QrCode
} from 'lucide-react';
import { downloadTicketPDF, generateStatementPDF, downloadPaymentReceiptPDF } from '../lib/pdfGenerator';
import { PaymentMethod } from '../types';

interface ClientPortalViewProps {
  onSelectTab?: (tab: string) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ onSelectTab }) => {
  const { currentUser, activeCompany, clients } = useAuth();
  const { weighings, payments, addPayment } = useData();
  
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'todas' | 'cobranza' | 'pagados' | 'vouchers'>('todas');

  // Client Payment Form State
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('yape');
  const [payRef, setPayRef] = useState<string>('');
  const [payVoucherUrl, setPayVoucherUrl] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Find client record matching current user with flexible fallback
  const matchedClient = clients.find(c => 
    (currentUser?.clientId && c.id === currentUser.clientId) ||
    (currentUser?.displayName && c.name.toLowerCase().trim() === currentUser.displayName.toLowerCase().trim()) ||
    (currentUser?.username && c.name.toLowerCase().trim() === currentUser.username.toLowerCase().trim()) ||
    (currentUser?.phone && c.phone && c.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) ||
    (currentUser?.email && c.email && c.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
    (currentUser?.displayName && c.name.toLowerCase().includes(currentUser.displayName.toLowerCase().trim())) ||
    (currentUser?.displayName && currentUser.displayName.toLowerCase().includes(c.name.toLowerCase().trim()))
  ) || clients.find(c => c.companyId === (activeCompany?.id || currentUser?.companyId));

  const clientInfo = matchedClient || {
    id: currentUser?.clientId || `cli_${currentUser?.uid || 'default'}`,
    companyId: activeCompany?.id || currentUser?.companyId || 'comp_1',
    name: currentUser?.displayName || currentUser?.username || 'Cliente Comercial',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: 'Atención al Cliente',
    currentBalance: 0,
    creditLimit: 5000,
    creditDays: 15,
    createdAt: new Date().toISOString()
  };

  const clientWeighings = weighings.filter(w => 
    w.clientId === clientInfo.id ||
    (currentUser?.clientId && w.clientId === currentUser.clientId) ||
    (clientInfo.name && w.clientName && w.clientName.toLowerCase().trim() === clientInfo.name.toLowerCase().trim()) ||
    (currentUser?.displayName && w.clientName && w.clientName.toLowerCase().trim() === currentUser.displayName.toLowerCase().trim()) ||
    (currentUser?.username && w.clientName && w.clientName.toLowerCase().trim() === currentUser.username.toLowerCase().trim())
  );

  const clientPayments = payments.filter(p => 
    p.clientId === clientInfo.id ||
    (currentUser?.clientId && p.clientId === currentUser.clientId) ||
    (clientInfo.name && p.clientName && p.clientName.toLowerCase().trim() === clientInfo.name.toLowerCase().trim()) ||
    (currentUser?.displayName && p.clientName && p.clientName.toLowerCase().trim() === currentUser.displayName.toLowerCase().trim()) ||
    (currentUser?.username && p.clientName && p.clientName.toLowerCase().trim() === currentUser.username.toLowerCase().trim())
  );

  const pendingWeighings = clientWeighings.filter(w => w.pendingAmount > 0);
  const paidWeighings = clientWeighings.filter(w => w.pendingAmount <= 0);
  const totalPendingDebt = clientWeighings.reduce((sum, w) => sum + w.pendingAmount, 0);

  // Filter weighings based on selected sub-tab
  const displayedWeighings = filterMode === 'cobranza' 
    ? pendingWeighings 
    : filterMode === 'pagados' 
    ? paidWeighings 
    : clientWeighings;

  const handleDownloadPDF = (w: any) => {
    downloadTicketPDF(w, activeCompany || undefined);
  };

  const handleDownloadStatement = () => {
    if (!clientInfo) return;
    generateStatementPDF(clientInfo, clientWeighings, clientPayments, activeCompany || undefined);
  };

  // WhatsApp Share with Scale Image
  const handleShareWhatsAppPesa = (w: any) => {
    const scaleImg = w.scaleImageUrl || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80';
    const avgW = w.chickenCount > 0 ? (w.netWeight / w.chickenCount).toFixed(2) : '0.00';

    const text = `*COMPROBANTE DE PESAJE DE POLLOS - TICKET #${w.ticketNumber}*%0A` +
      `🏢 *Empresa:* ${activeCompany?.name || 'Avícola Galpón Real'}%0A` +
      `👤 *Cliente:* ${w.clientName}%0A` +
      `📅 *Fecha:* ${new Date(w.createdAt).toLocaleString('es-ES')}%0A` +
      `----------------------------------%0A` +
      `🐔 *Aves:* ${w.chickenCount} pollos vivos%0A` +
      `⚖️ *Peso Neto:* ${w.netWeight.toFixed(2)} kg (Prom: ${avgW} kg/ave)%0A` +
      `💲 *Precio/kg:* S/ ${w.unitPrice.toFixed(2)}%0A` +
      `----------------------------------%0A` +
      `💰 *MONTO TOTAL VENTA:* S/ ${w.totalAmount.toFixed(2)}%0A` +
      `💵 *Monto Pagado:* S/ ${w.paidAmount.toFixed(2)}%0A` +
      `⚠️ *SALDO PENDIENTE COBRANZA:* S/ ${w.pendingAmount.toFixed(2)}%0A` +
      `----------------------------------%0A` +
      `📷 *FOTO / IMAGEN DE LA PESA EN BALANZA:*%0A${encodeURIComponent(scaleImg)}%0A%0A` +
      `¡Muchas gracias por su preferencia!`;

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Upload voucher image handler
  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPayVoucherUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset sample voucher handler for demo
  const handlePresetVoucher = () => {
    const vouchers = [
      'https://images.unsplash.com/photo-1556742049-0a67dd3861c8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80'
    ];
    setPayVoucherUrl(vouchers[Math.floor(Math.random() * vouchers.length)]);
  };

  // Submit client payment abono
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Ingrese un monto válido en Soles (S/).');
      return;
    }
    if (!payVoucherUrl) {
      alert('Por favor adjunte la foto o captura del voucher de pago (Yape/Plim/Transferencia).');
      return;
    }

    setIsSubmittingPay(true);
    try {
      await addPayment({
        companyId: activeCompany?.id || currentUser?.companyId || clientInfo.companyId || '',
        clientId: clientInfo.id,
        clientName: clientInfo.name,
        amount: amountNum,
        method: payMethod,
        reference: payRef || `VOUCHER-${Math.floor(Math.random() * 899999 + 100000)}`,
        status: 'aprobado',
        notes: payNotes || 'Abono registrado directamente por el cliente',
        voucherUrl: payVoucherUrl,
      });

      alert(`¡Pago de S/ ${amountNum.toFixed(2)} enviado exitosamente! La empresa ha sido notificada.`);
      setIsPaymentModalOpen(false);
      setPayAmount('');
      setPayRef('');
      setPayVoucherUrl('');
      setPayNotes('');
    } catch (err) {
      console.error(err);
      alert('Error al registrar el pago.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 border border-sky-800/60 p-6 rounded-3xl shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-colors border border-slate-700 flex items-center justify-center"
                title="Volver al Menú"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase bg-sky-900/80 text-sky-300 border border-sky-700 px-3 py-1 rounded-full">
                Portal Móvil del Cliente
              </span>
              <h1 className="text-2xl font-black mt-1.5">{clientInfo?.name || 'Cliente Comercial'}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Verifique sus pesas de pollos en Soles, fotos de la balanza en tiempo real, descargue comprobantes y suba sus vouchers de pago Yape/Plim.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-3 rounded-2xl text-xs flex items-center space-x-1.5 border border-slate-700"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>Volver al Menú</span>
              </button>
            )}

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/40 transition-transform active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Voucher / Registrar Pago</span>
            </button>

            <button
              onClick={handleDownloadStatement}
              className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-4 py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-sky-900/40 transition-transform active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>Estado de Cuenta PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Metrics in Soles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-1">
          <span className="text-xs font-bold text-slate-400">Saldo Pendiente a Pagar</span>
          <div className="text-2xl font-black text-rose-400 font-mono">
            S/ {totalPendingDebt.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">Sincronizado en la nube</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-1">
          <span className="text-xs font-bold text-slate-400">Límite de Crédito Autorizado</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            S/ {(clientInfo?.creditLimit || 5000).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">{clientInfo?.creditDays || 15} días de crédito autorizado</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg space-y-1">
          <span className="text-xs font-bold text-slate-400">Total Abonos / Pagos Realizados</span>
          <div className="text-2xl font-black text-sky-400 font-mono">
            S/ {clientPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">
            {clientPayments.length} comprobantes de pago subidos
          </p>
        </div>
      </div>

      {/* Filter Bar & Sub-Tabs for Cobranza / Mis Pesas */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-md">
        <button
          onClick={() => setFilterMode('todas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            filterMode === 'todas'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Todas las Pesas ({clientWeighings.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('cobranza')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            filterMode === 'cobranza'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-amber-400 hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Cobranza / Por Cobrar ({pendingWeighings.length})</span>
          {totalPendingDebt > 0 && (
            <span className="ml-1 bg-amber-950 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-full border border-amber-800">
              S/ {totalPendingDebt.toFixed(0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilterMode('pagados')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            filterMode === 'pagados'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Pesas Canceladas ({paidWeighings.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('vouchers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
            filterMode === 'vouchers'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4 text-purple-400" />
          <span>Mis Abonos & Vouchers ({clientPayments.length})</span>
        </button>
      </div>

      {/* Submitted Vouchers & Payment Abonos History */}
      {(filterMode === 'vouchers' || filterMode === 'todas') && clientPayments.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-400" />
              Mis Vouchers de Pago y Abonos Registrados (Soles)
            </h3>
            <span className="text-xs font-mono text-slate-400">{clientPayments.length} pagos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientPayments.map((p) => (
              <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-emerald-400 font-mono text-sm">S/ {p.amount.toFixed(2)}</span>
                  <span className="text-[9px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {p.method}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Ref: <strong className="text-slate-200">{p.reference || 'N/A'}</strong>
                </div>
                <div className="text-[10px] text-slate-500">
                  Fecha: {new Date(p.createdAt).toLocaleString('es-ES')}
                </div>

                {p.voucherUrl && (
                  <div 
                    onClick={() => setActiveZoomImage(p.voucherUrl!)}
                    className="relative group rounded-lg overflow-hidden border border-slate-800 h-24 bg-slate-900 cursor-pointer"
                  >
                    <img src={p.voucherUrl} alt="Voucher" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] text-white font-bold bg-emerald-600 px-2 py-1 rounded">Ver Voucher</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => downloadPaymentReceiptPDF(p, clientInfo, activeCompany || undefined)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[10px] py-1.5 rounded-xl border border-slate-700 flex items-center justify-center space-x-1"
                >
                  <FileDown className="w-3 h-3" />
                  <span>Recibo de Abono PDF</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weighing Tickets Cards & Scale Images */}
      {filterMode !== 'vouchers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden p-5 space-y-4">
          <div className="font-extrabold text-sm text-white flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              {filterMode === 'cobranza' ? 'Pesas Pendientes de Cobranza (Por Pagar)' : filterMode === 'pagados' ? 'Pesas Canceladas' : 'Historial de Pesas y Foto de Balanza'}
            </span>
            <span className="text-xs font-mono text-slate-400">{displayedWeighings.length} comprobantes</span>
          </div>

          {displayedWeighings.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold">
              No hay tickets de pesaje en esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedWeighings.map((w) => (
                <div key={w.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-colors">
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-black text-emerald-400 font-mono">{w.ticketNumber}</span>
                      <p className="text-[10px] text-slate-400">{new Date(w.createdAt).toLocaleString('es-ES')}</p>
                    </div>
                    <span className={`text-[10px] font-extrabold font-mono uppercase px-2 py-0.5 rounded-full ${
                      w.paymentStatus === 'pagado' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {w.paymentStatus}
                    </span>
                  </div>

                  {/* Photo of the Scale */}
                  {w.scaleImageUrl ? (
                    <div 
                      onClick={() => setActiveZoomImage(w.scaleImageUrl!)}
                      className="relative group rounded-xl overflow-hidden border border-slate-800 cursor-pointer bg-slate-900"
                    >
                      <img 
                        src={w.scaleImageUrl} 
                        alt="Foto de la Balanza" 
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Foto Completa</span>
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-sm text-[9px] text-emerald-300 font-bold px-2 py-0.5 rounded font-mono border border-emerald-800/60">
                        📷 Foto Balanza Verificada
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-center text-slate-500 text-xs">
                      Sin Foto de Balanza
                    </div>
                  )}

                  {/* Weighing Stats Breakdown */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl text-center border border-slate-800/60">
                    <div>
                      <span className="text-[9px] text-slate-400 font-semibold block">Pollos</span>
                      <span className="text-xs font-extrabold text-white font-mono">{w.chickenCount} aves</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-semibold block">Peso Neto</span>
                      <span className="text-xs font-black text-emerald-400 font-mono">{w.netWeight.toFixed(1)} kg</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-semibold block">Precio S/</span>
                      <span className="text-xs font-bold text-slate-300 font-mono">S/ {w.unitPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Total Row & Actions */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Total a Pagar</span>
                        <span className="text-base font-black text-white font-mono">S/ {w.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Saldo Pendiente</span>
                        <span className={`text-sm font-black font-mono ${w.pendingAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          S/ {w.pendingAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: WhatsApp with Image, Ticket PDF */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleShareWhatsAppPesa(w)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md transition-transform active:scale-95"
                        title="Compartir ticket e imagen por WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Compartir WP (con Foto)</span>
                      </button>

                      <button
                        onClick={() => handleDownloadPDF(w)}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold px-3 py-2 rounded-xl border border-slate-700 text-xs flex items-center justify-center space-x-1.5"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Ticket PDF</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Client Upload Payment Voucher / Abono */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span className="font-extrabold text-base text-white">Subir Voucher / Registrar Abono</span>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Payment Method Selector (Efectivo, Yape, Plim, Transferencia) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-semibold">Tipo / Método de Pago</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'efectivo', label: 'Efectivo 💵' },
                    { id: 'yape', label: 'Yape 📱' },
                    { id: 'plim', label: 'Plim 💳' },
                    { id: 'transferencia', label: 'Transferencia 🏦' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as PaymentMethod)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        payMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount in Soles */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Monto Depositado en Soles (S/)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-emerald-400 font-mono font-bold text-sm">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl pl-10 pr-3 py-2.5 text-base font-mono font-bold outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Operation Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Número de Operación / Referencia</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="ej. OP-982134"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs outline-none focus:border-slate-700"
                />
              </div>

              {/* Voucher Attachment */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Voucher / Recibo Adjunto</label>
                {payVoucherUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                    <img src={payVoucherUrl} alt="Voucher" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => setPayVoucherUrl('')}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="cursor-pointer bg-slate-950 border border-dashed border-emerald-500/50 hover:border-emerald-400 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                      <Camera className="w-5 h-5 text-emerald-400" />
                      <span className="text-[11px] font-bold text-white">Capturar Voucher</span>
                      <input type="file" accept="image/*" onChange={handleVoucherUpload} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={handlePresetVoucher}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1"
                    >
                      <Upload className="w-5 h-5 text-sky-400" />
                      <span className="text-[11px] font-bold text-slate-300">Voucher Ejemplo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isSubmittingPay}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl py-3.5 text-xs shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2 transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingPay ? 'Enviando Pago...' : 'ENVIAR ABONO A EMPRESA'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal for Scale Photos & Vouchers */}
      {activeZoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-3 shadow-2xl">
            <button
              onClick={() => setActiveZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={activeZoomImage} 
              alt="Comprobante Ampliado" 
              className="w-full max-h-[80vh] object-contain rounded-2xl" 
            />
            <div className="p-3 text-center text-xs text-slate-300 font-mono font-bold">
              Comprobante Digital Oficial
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

