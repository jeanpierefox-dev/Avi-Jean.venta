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
  ArrowLeft,
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

  // Find client record matching current user strictly by name or ID without wrong fallback
  const matchedClient = clients.find(c => 
    (currentUser?.clientId && c.id === currentUser.clientId) ||
    (currentUser?.displayName && c.name.toLowerCase().trim() === currentUser.displayName.toLowerCase().trim()) ||
    (currentUser?.username && c.name.toLowerCase().trim() === currentUser.username.toLowerCase().trim()) ||
    (currentUser?.phone && c.phone && c.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) ||
    (currentUser?.email && c.email && c.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
    (currentUser?.displayName && c.name.toLowerCase().includes(currentUser.displayName.toLowerCase().trim()))
  );

  const matchedCompanyId = matchedClient?.companyId 
    || weighings.find(w => (currentUser?.clientId && w.clientId === currentUser.clientId) || (currentUser?.displayName && w.clientName.toLowerCase().trim() === currentUser.displayName.toLowerCase().trim()))?.companyId 
    || activeCompany?.id 
    || currentUser?.companyId 
    || 'comp_1';

  const clientInfo = matchedClient || {
    id: currentUser?.clientId || `cli_${currentUser?.uid || currentUser?.displayName || 'default'}`,
    companyId: matchedCompanyId,
    name: currentUser?.displayName || currentUser?.username || 'Cliente Comercial',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: 'Atención al Cliente',
    currentBalance: 0,
    creditLimit: 5000,
    creditDays: 15,
    createdAt: new Date().toISOString()
  };

  const normalizedClientName = (clientInfo.name || '').toLowerCase().trim();
  const normalizedUserDisplayName = (currentUser?.displayName || '').toLowerCase().trim();
  const normalizedUsername = (currentUser?.username || '').toLowerCase().trim();

  // Filter weighings strictly for this specific client user
  const clientWeighings = weighings.filter(w => {
    if (w.clientId === clientInfo.id) return true;
    if (currentUser?.clientId && w.clientId === currentUser.clientId) return true;
    const wName = (w.clientName || '').toLowerCase().trim();
    if (!wName) return false;
    if (normalizedClientName && wName === normalizedClientName) return true;
    if (normalizedUserDisplayName && wName === normalizedUserDisplayName) return true;
    if (normalizedUsername && wName === normalizedUsername) return true;
    return false;
  });

  // Filter payments strictly for this specific client user
  const clientPayments = payments.filter(p => {
    if (p.clientId === clientInfo.id) return true;
    if (currentUser?.clientId && p.clientId === currentUser.clientId) return true;
    const pName = (p.clientName || '').toLowerCase().trim();
    if (!pName) return false;
    if (normalizedClientName && pName === normalizedClientName) return true;
    if (normalizedUserDisplayName && pName === normalizedUserDisplayName) return true;
    if (normalizedUsername && pName === normalizedUsername) return true;
    return false;
  });

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
    const currentClientWithBalance = { ...clientInfo, currentBalance: totalPendingDebt };
    generateStatementPDF(currentClientWithBalance, clientWeighings, clientPayments, activeCompany || undefined);
  };

  // WhatsApp Share Balance / Account State
  const handleShareWhatsAppSaldo = () => {
    const text = `*ESTADO DE CUENTA Y SALDO PENDIENTE - AVISCONTROL*%0A` +
      `🏢 *Empresa:* ${activeCompany?.name || 'Avícola Galpón Real'}%0A` +
      `👤 *Cliente:* ${clientInfo.name}%0A` +
      `📅 *Fecha:* ${new Date().toLocaleDateString('es-ES')}%0A` +
      `----------------------------------%0A` +
      `⚠️ *SALDO TOTAL PENDIENTE:* S/ ${totalPendingDebt.toFixed(2)}%0A` +
      `💳 *Límite de Crédito:* S/ ${clientInfo.creditLimit.toFixed(2)}%0A` +
      `📋 *Tickets con Saldo:* ${pendingWeighings.length} compras%0A` +
      `----------------------------------%0A` +
      `¡Muchas gracias por su preferencia!`;

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // WhatsApp Share Payment Voucher / Abono
  const handleShareWhatsAppAbono = (p: any) => {
    const text = `*COMPROBANTE DE ABONO DE PAGO - AVISCONTROL*%0A` +
      `🏢 *Empresa:* ${activeCompany?.name || 'Avícola Galpón Real'}%0A` +
      `👤 *Cliente:* ${p.clientName || clientInfo.name}%0A` +
      `📅 *Fecha Pago:* ${new Date(p.createdAt).toLocaleString('es-ES')}%0A` +
      `----------------------------------%0A` +
      `💰 *MONTO ABONADO:* S/ ${p.amount.toFixed(2)}%0A` +
      `💳 *Método de Pago:* ${p.method.toUpperCase()}%0A` +
      `🔢 *N° Operación / Ref:* ${p.reference || 'N/A'}%0A` +
      `----------------------------------%0A` +
      (p.voucherUrl ? `📷 *FOTO VOUCHER:*%0A${encodeURIComponent(p.voucherUrl)}%0A%0A` : '') +
      `¡Abono procesado correctamente!`;

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
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
      
      {/* Top Header Card for Client Portal */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <img 
              src={activeCompany?.logoUrl || "/src/assets/images/jb_barboza_logo_2025_1785266795162.jpg"} 
              alt="JEANPIERE BARBOZA 2025 Logo" 
              className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-amber-500 shadow-md shadow-amber-500/10 object-cover shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md border border-blue-200">
                  Portal del Cliente
                </span>
                <span className="text-xs text-slate-400 font-semibold">• Sync en Vivo</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {clientInfo.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {clientInfo.address || 'Cliente Frecuente'} {clientInfo.phone ? `• Tel: ${clientInfo.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-3.5 py-2.5 rounded-2xl text-xs flex items-center space-x-2 border border-slate-300 transition-colors shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Volver al Menú</span>
              </button>
            )}

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Registrar Pago / Voucher</span>
            </button>

            <button
              onClick={handleDownloadStatement}
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold px-3.5 py-2.5 rounded-2xl text-xs border border-blue-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Estado de Cuenta PDF</span>
            </button>

            <button
              onClick={handleShareWhatsAppSaldo}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold px-3.5 py-2.5 rounded-2xl text-xs border border-emerald-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              title="Compartir saldo actual por WhatsApp"
            >
              <Send className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Consultar Saldo WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Metrics in Soles - High Visibility Light Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Deuda Pendiente */}
        <div className={`p-5 rounded-3xl border shadow-2xs transition-all ${
          totalPendingDebt > 0 
            ? 'bg-rose-50/70 border-rose-200' 
            : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-black uppercase tracking-wider ${
              totalPendingDebt > 0 ? 'text-rose-800' : 'text-emerald-800'
            }`}>
              Deuda Pendiente
            </span>
            <span className={`p-1.5 rounded-xl ${
              totalPendingDebt > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
            totalPendingDebt > 0 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            S/ {totalPendingDebt.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-1">
            {pendingWeighings.length > 0 ? `${pendingWeighings.length} compra(s) por cancelar` : '¡Al día! Sin deudas pendientes'}
          </p>
        </div>

        {/* Total Compras Realizadas */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Total Compras</span>
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-xl">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            S/ {clientWeighings.reduce((sum, w) => sum + w.totalAmount, 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {clientWeighings.length} tickets de pesaje ({clientWeighings.reduce((sum, w) => sum + w.netWeight, 0).toFixed(1)} kg)
          </p>
        </div>

        {/* Total Abonos Realizados */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Abonos Realizados</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
            S/ {clientPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {clientPayments.length} comprobante(s) registrado(s)
          </p>
        </div>

        {/* Límite de Crédito */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Límite de Crédito</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            S/ {(clientInfo?.creditLimit || 5000).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {clientInfo?.creditDays || 15} días de plazo autorizado
          </p>
        </div>

      </div>

      {/* Navigation Filter Sub-Tabs - Formal Corporate Segmented Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md">
        <button
          onClick={() => setFilterMode('cobranza')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            filterMode === 'cobranza'
              ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400'
              : 'text-rose-300 hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4 text-rose-400" />
          <span>Deudas Pendientes por Pagar ({pendingWeighings.length})</span>
          {totalPendingDebt > 0 && (
            <span className="ml-1 bg-rose-950 text-rose-200 font-mono text-[10px] px-2 py-0.5 rounded-md border border-rose-800 font-black">
              S/ {totalPendingDebt.toFixed(0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilterMode('todas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            filterMode === 'todas'
              ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Todas las Compras ({clientWeighings.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('pagados')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            filterMode === 'pagados'
              ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Compras Canceladas ({paidWeighings.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('vouchers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
            filterMode === 'vouchers'
              ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4 text-amber-300" />
          <span>Mis Abonos / Vouchers ({clientPayments.length})</span>
        </button>
      </div>

      {/* Submitted Vouchers & Payment Abonos History */}
      {(filterMode === 'vouchers' || filterMode === 'todas') && clientPayments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" />
              Historial de Abonos y Vouchers Enviados
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">{clientPayments.length} pagos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientPayments.map((p) => (
              <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-emerald-700 font-mono text-base">S/ {p.amount.toFixed(2)}</span>
                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-lg font-mono">
                    {p.method}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Ref: <strong className="text-slate-900 font-mono">{p.reference || 'N/A'}</strong>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Fecha: {new Date(p.createdAt).toLocaleString('es-ES')}
                </div>

                {p.voucherUrl && (
                  <div 
                    onClick={() => setActiveZoomImage(p.voucherUrl!)}
                    className="relative group rounded-xl overflow-hidden border border-slate-300 h-28 bg-slate-100 cursor-pointer"
                  >
                    <img src={p.voucherUrl} alt="Voucher" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-xs text-white font-bold bg-emerald-600 px-3 py-1 rounded-xl shadow">Ver Voucher</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleShareWhatsAppAbono(p)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer transition-colors"
                    title="Compartir comprobante de abono a WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Compartir WP</span>
                  </button>

                  <button
                    onClick={() => downloadPaymentReceiptPDF(p, clientInfo, activeCompany || undefined)}
                    className="bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs py-2 rounded-xl border border-slate-300 flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>Recibo PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchases / Weighing Tickets Cards with Scale Photos */}
      {filterMode !== 'vouchers' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xs overflow-hidden p-5 space-y-4">
          <div className="font-black text-sm text-slate-900 flex justify-between items-center border-b border-slate-200 pb-3">
            <span className="flex items-center gap-2">
              <Camera className="w-4.5 h-4.5 text-blue-600" />
              {filterMode === 'cobranza' ? 'Detalle de Compras y Deudas Pendientes por Cancelar' : filterMode === 'pagados' ? 'Historial de Compras Canceladas' : 'Historial Completo de Compras y Fotos de Balanza'}
            </span>
            <span className="text-xs font-mono font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {displayedWeighings.length} compras
            </span>
          </div>

          {displayedWeighings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">
              No hay registro de compras en esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedWeighings.map((w) => (
                <div key={w.id} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3.5 hover:border-blue-300 transition-all shadow-2xs">
                  
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-black text-blue-900 font-mono bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200">
                        {w.ticketNumber}
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        {new Date(w.createdAt).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black font-mono uppercase px-3 py-1 rounded-full ${
                      w.paymentStatus === 'pagado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {w.paymentStatus === 'pagado' ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                  </div>

                  {/* Photo of the Scale */}
                  {w.scaleImageUrl ? (
                    <div 
                      onClick={() => setActiveZoomImage(w.scaleImageUrl!)}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 cursor-pointer bg-slate-900"
                    >
                      <img 
                        src={w.scaleImageUrl} 
                        alt="Foto de la Balanza" 
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>Ver Foto de Balanza</span>
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-[10px] text-white font-bold px-2.5 py-0.5 rounded-md font-mono border border-slate-700">
                        📷 Foto Balanza Verificada
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-medium">
                      Sin foto adjunta de balanza
                    </div>
                  )}

                  {/* Weighing Stats Table Breakdown */}
                  <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl text-center border border-slate-200 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Aves</span>
                      <span className="text-xs font-black text-slate-900">{w.chickenCount} <span className="text-[9px] font-normal text-slate-500">pollos</span></span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Peso Neto</span>
                      <span className="text-xs font-black text-emerald-700">{w.netWeight.toFixed(1)} <span className="text-[9px] font-normal text-emerald-600">kg</span></span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Precio S/</span>
                      <span className="text-xs font-bold text-slate-800">S/ {w.unitPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Financial Row */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Monto Total Compra</span>
                      <span className="text-base font-black text-slate-900 font-mono">S/ {w.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Saldo Deuda</span>
                      <span className={`text-base font-black font-mono ${w.pendingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        S/ {w.pendingAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: WhatsApp with Image, Ticket PDF */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleShareWhatsAppPesa(w)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                      title="Compartir ticket e imagen por WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp (Con Foto)</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(w)}
                      className="bg-white hover:bg-slate-100 text-slate-800 font-extrabold px-3 py-2.5 rounded-xl border border-slate-300 text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-blue-600" />
                      <span>Descargar Ticket</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Client Upload Payment Voucher / Abono */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-base text-slate-900">Registrar Pago / Enviar Voucher</span>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Payment Method Selector (Efectivo, Yape, Plim, Transferencia) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipo / Método de Pago</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'yape', label: 'Yape 📱' },
                    { id: 'plim', label: 'Plim 💳' },
                    { id: 'efectivo', label: 'Efectivo 💵' },
                    { id: 'transferencia', label: 'Banco 🏦' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as PaymentMethod)}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        payMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount in Soles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monto Depositado en Soles (S/)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-emerald-700 font-mono font-extrabold text-base">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-2xl pl-10 pr-3 py-2.5 text-base font-mono font-bold outline-none focus:border-emerald-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Operation Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número de Operación / Referencia</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="ej. OP-982134"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Voucher Attachment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Voucher / Capture de Pago</label>
                {payVoucherUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-100">
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
                    <label className="cursor-pointer bg-emerald-50/60 border border-dashed border-emerald-400 hover:border-emerald-600 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition-colors">
                      <Upload className="w-5 h-5 text-emerald-600" />
                      <span className="text-[11px] font-bold text-emerald-900">Subir Voucher (Galería / Foto)</span>
                      <input type="file" accept="image/*" onChange={handleVoucherUpload} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={handlePresetVoucher}
                      className="bg-slate-50 border border-slate-200 hover:bg-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition-colors cursor-pointer"
                    >
                      <Camera className="w-5 h-5 text-blue-600" />
                      <span className="text-[11px] font-bold text-slate-700">Voucher de Prueba</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isSubmittingPay}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl py-3.5 text-xs shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-3xl overflow-hidden p-3 shadow-2xl">
            <button
              onClick={() => setActiveZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={activeZoomImage} 
              alt="Comprobante Ampliado" 
              className="w-full max-h-[80vh] object-contain rounded-2xl bg-slate-950" 
            />
            <div className="p-2 text-center text-xs text-slate-600 font-mono font-bold">
              Comprobante Digital Verificado - JEANPIERE BARBOZA
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

