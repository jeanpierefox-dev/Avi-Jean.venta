import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ScaleEntry, WeighingRecord, Client, PaymentType } from '../types';
import { 
  Scale, 
  Plus, 
  Trash2, 
  Receipt, 
  User, 
  Calendar, 
  CheckCircle2, 
  Share2, 
  FileDown, 
  Calculator,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Camera,
  Image as ImageIcon,
  X,
  FolderOpen,
  Eye,
  Bird,
  PlusCircle
} from 'lucide-react';
import { TicketModal } from './TicketModal';

interface WeighingSystemProps {
  onSelectTab?: (tab: string) => void;
}

export const WeighingSystem: React.FC<WeighingSystemProps> = ({ onSelectTab }) => {
  const { activeCompany, currentUser } = useAuth();
  const { clients, addClient, addWeighing, deleteWeighing, weighings, inventory } = useData();

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedGalponId, setSelectedGalponId] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<number | string>(8.50); // Default price in Soles (S/)
  const [paymentType, setPaymentType] = useState<PaymentType>('credito');
  const [creditDays, setCreditDays] = useState<number>(15); // 7, 15, 30 días
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Multi-Scale / Pesadas State
  const [scaleEntries, setScaleEntries] = useState<ScaleEntry[]>([
    { id: '1', chickens: 120, grossWeight: 288.0, photoUrl: '' }
  ]);

  // Quick Pesa Form State & Single Input Toggle Mode
  const [inputMode, setInputMode] = useState<'chickens' | 'weight'>('chickens');
  const [quickChickens, setQuickChickens] = useState<string>('');
  const [quickGrossWeight, setQuickGrossWeight] = useState<string>('');
  const [quickPhotoUrl, setQuickPhotoUrl] = useState<string>('');

  const handleQuickPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuickPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddQuickPesa = () => {
    const chickensNum = Number(quickChickens) || 0;
    const weightNum = Number(quickGrossWeight) || 0;
    if (chickensNum <= 0 && weightNum <= 0) return;

    const newEntry: ScaleEntry = {
      id: `scale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chickens: chickensNum,
      grossWeight: weightNum,
      photoUrl: quickPhotoUrl
    };

    setScaleEntries(prev => [...prev, newEntry]);
    setQuickChickens('');
    setQuickGrossWeight('');
    setQuickPhotoUrl('');
  };

  // Overall / Default scale image if not specified per entry
  const [scaleImageUrl, setScaleImageUrl] = useState<string>('');
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  // Quick Client Modal State
  const [showQuickClientModal, setShowQuickClientModal] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientLimit, setQuickClientLimit] = useState<number | string>(5000);

  const currentCompanyId = activeCompany?.id || currentUser?.companyId || '';

  const handleCreateQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim()) return;

    try {
      const newClient = await addClient({
        companyId: currentCompanyId,
        name: quickClientName,
        phone: quickClientPhone,
        creditLimit: quickClientLimit,
        creditDays: 15,
        currentBalance: 0,
      });

      setSelectedClientId(newClient.id);
      setQuickClientName('');
      setQuickClientPhone('');
      setShowQuickClientModal(false);
      const assignedUser = (newClient as any).assignedUsername || 'cliente';
      alert(`¡Cliente "${newClient.name}" y Usuario Creados Con Éxito!\n\n• Usuario Cliente: ${assignedUser}\n• Contraseña: 1234\n\nEl cliente ya puede ingresar al sistema con su usuario para ver sus pesajes, deudas y realizar abonos.`);
    } catch (err) {
      console.error('Error creando cliente directo:', err);
      alert('Error al crear el cliente.');
    }
  };

  // Active Ticket for Modal preview
  const [createdTicket, setCreatedTicket] = useState<WeighingRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter clients and galpones by active company
  const companyClients = clients.filter(c => c.companyId === currentCompanyId);
  const galponesList = inventory.filter(i => i.companyId === currentCompanyId && (i.category === 'pollo_vivo' || i.unit === 'aves'));

  useEffect(() => {
    if (companyClients.length > 0 && !selectedClientId) {
      setSelectedClientId(companyClients[0].id);
    }
  }, [companyClients]);

  useEffect(() => {
    if (galponesList.length > 0 && !selectedGalponId) {
      setSelectedGalponId(galponesList[0].id);
    }
  }, [galponesList]);

  const selectedClient = companyClients.find(c => c.id === selectedClientId) || companyClients[0];
  const selectedGalpon = galponesList.find(g => g.id === selectedGalponId) || galponesList[0];

  const numericUnitPrice = unitPrice === '' ? 0 : Number(unitPrice) || 0;

  // Calculated Totals Summed Across All Scale Entries
  const totalChickens = scaleEntries.reduce((sum, item) => sum + (Number(item.chickens) || 0), 0);
  const totalGrossWeight = scaleEntries.reduce((sum, item) => sum + (Number(item.grossWeight) || 0), 0);
  const totalNetWeight = totalGrossWeight;

  const averageWeightPerChicken = totalChickens > 0 ? (totalNetWeight / totalChickens) : 0;
  const totalAmountToCharge = totalNetWeight * numericUnitPrice;

  // Auto set paid amount if paymentType is 'contado'
  useEffect(() => {
    if (paymentType === 'contado') {
      setPaidAmount(totalAmountToCharge);
    } else {
      setPaidAmount(0);
    }
  }, [paymentType, totalAmountToCharge]);

  // Scale Entries Handlers
  const handleAddScaleEntry = () => {
    const newId = Date.now().toString();
    setScaleEntries(prev => [
      ...prev,
      { id: newId, chickens: 0, grossWeight: 0, photoUrl: '' }
    ]);
  };

  const handleRemoveScaleEntry = (id: string) => {
    if (scaleEntries.length <= 1) {
      alert('Debe mantener al menos una pesa o balanza en el registro.');
      return;
    }
    setScaleEntries(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateScaleEntry = (id: string, field: keyof ScaleEntry, value: any) => {
    setScaleEntries(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleScalePhotoUploadForEntry = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result as string;
        handleUpdateScaleEntry(id, 'photoUrl', photoData);
        if (!scaleImageUrl) {
          setScaleImageUrl(photoData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Overall Main Image Upload
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScaleImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset sample scale photo selector
  const handlePresetScalePhoto = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
    ];
    const chosen = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setScaleImageUrl(chosen);
  };

  // Completely Reset / Clear All Weighing Form Fields
  const handleClearAll = () => {
    setScaleEntries([
      { id: Date.now().toString(), chickens: 0, grossWeight: 0, photoUrl: '' }
    ]);
    setScaleImageUrl('');
    setNotes('');
    setPaidAmount(0);
  };

  // Calculate Due Date based on selected credit days
  const calculateDueDate = (): string => {
    const days = creditDays || selectedClient?.creditDays || 15;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Submit Weighing Record
  const handleSubmitWeighing = async () => {
    if (!selectedClient) {
      alert('Por favor seleccione un cliente.');
      return;
    }
    if (totalChickens <= 0 || totalNetWeight <= 0) {
      alert('Debe ingresar al menos una pesa con cantidad de pollos y peso directo de balanza.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find first photo from entries or overall
      const primaryPhoto = scaleEntries.find(s => s.photoUrl)?.photoUrl || scaleImageUrl || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80';

      const newTicket = await addWeighing({
        companyId: currentCompanyId,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        chickenCount: totalChickens,
        grossWeight: totalGrossWeight,
        tareWeight: 0,
        netWeight: totalNetWeight,
        unitPrice: numericUnitPrice,
        totalAmount: totalAmountToCharge,
        paidAmount: paymentType === 'contado' ? totalAmountToCharge : paidAmount,
        paymentType,
        creditDays: paymentType === 'credito' ? creditDays : undefined,
        dueDate: calculateDueDate(),
        notes,
        scaleImageUrl: primaryPhoto,
        scaleEntries: scaleEntries,
        galponId: selectedGalpon?.id,
        galponName: selectedGalpon?.name,
      });

      // Show generated ticket modal
      setCreatedTicket(newTicket);

      // Limpiar todo el pesaje para un nuevo pesaje automáticamente
      handleClearAll();

    } catch (e) {
      console.error('Error recording weighing:', e);
      alert('Error al registrar el pesaje.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewTicket = () => {
    if (!selectedClient) {
      alert('Por favor seleccione un cliente para visualizar el ticket.');
      return;
    }
    const primaryPhoto = scaleEntries.find(s => s.photoUrl)?.photoUrl || scaleImageUrl || undefined;

    const mockRecord: WeighingRecord = {
      id: `preview_${Date.now()}`,
      ticketNumber: `TKT-PREVIO`,
      companyId: currentCompanyId,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      chickenCount: totalChickens,
      grossWeight: totalGrossWeight,
      tareWeight: 0,
      netWeight: totalNetWeight,
      unitPrice: numericUnitPrice,
      totalAmount: totalAmountToCharge,
      paidAmount: paymentType === 'contado' ? totalAmountToCharge : 0,
      pendingAmount: paymentType === 'credito' ? totalAmountToCharge : 0,
      paymentType: paymentType,
      paymentStatus: paymentType === 'contado' ? 'pagado' : 'pendiente',
      creditDays: creditDays,
      dueDate: calculateDueDate(),
      scaleImageUrl: primaryPhoto,
      scaleEntries: scaleEntries,
      notes: notes || 'Vista Previa del Ticket',
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.displayName || 'Operador',
    };
    setCreatedTicket(mockRecord);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top Header Card for Weighing System */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-md border border-blue-400">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/40">
                  JEANPIERE BARBOZA • 2026
                </span>
                <span className="text-xs text-slate-400 font-semibold">• Operación de Balanza</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                Sistema de Pesaje Industrial y Generación de Tickets
              </h1>
            </div>
          </div>

          {onSelectTab && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 border border-slate-700 transition-colors shadow-2xs active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Volver al Menú</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Client & Price Configuration Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              1. Seleccionar Cliente y Galpón de Origen
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Cliente Destinatario
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickClientModal(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Crear Cliente Directo</span>
                  </button>
                </div>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-2xl px-3.5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {companyClients.length === 0 && (
                    <option value="">⚠️ Sin clientes registrados</option>
                  )}
                  {companyClients.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.name} (Límite S/ {cli.creditLimit})
                    </option>
                  ))}
                </select>

                {companyClients.length === 0 && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-2xl text-xs flex items-center justify-between">
                    <span>No hay clientes en esta empresa.</span>
                    <button
                      type="button"
                      onClick={() => setShowQuickClientModal(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-extrabold text-[11px] shrink-0"
                    >
                      + Crear Ahora
                    </button>
                  </div>
                )}
              </div>

              {/* Galpón Inventory Origin Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Galpón / Lote de Origen (Inventario)
                </label>
                <select
                  value={selectedGalponId}
                  onChange={(e) => setSelectedGalponId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-blue-800 rounded-2xl px-3.5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {galponesList.length === 0 && (
                    <option value="">Galpón General de Granja</option>
                  )}
                  {galponesList.map((gal) => (
                    <option key={gal.id} value={gal.id}>
                      {gal.name} (Stock: {gal.headCount || (gal as any).quantity || 0} aves)
                    </option>
                  ))}
                </select>

                {(!selectedGalpon || selectedGalpon.headCount === 0) && (
                  <div className="mt-2.5 bg-amber-950/90 border border-amber-500/80 text-amber-300 p-2.5 rounded-2xl text-xs flex items-center justify-between shadow-md">
                    <span className="font-semibold">⚠️ Galpón sin pollos en Kardex.</span>
                    {onSelectTab && (
                      <button
                        type="button"
                        onClick={() => onSelectTab('inventario')}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl font-black text-[11px] shrink-0 uppercase cursor-pointer"
                      >
                        ＋ Cargar Aves
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Price & Payment Term row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Unit Price Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Precio por Kilo en Soles (S/ / kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500 font-mono font-black text-xs">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="8.50"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-2xl pl-9 pr-3 py-2.5 text-sm font-black font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Venta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('contado')}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center space-x-1 ${
                      paymentType === 'contado'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Contado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('credito')}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center space-x-1 ${
                      paymentType === 'credito'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>A Crédito</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Credit Days Selector Options: 7, 15, 30 días */}
            {paymentType === 'credito' && (
              <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-amber-900">
                  Plazo de Crédito Otorgado
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 15, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setCreditDays(days)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                        creditDays === days
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-amber-200 hover:border-amber-400'
                      }`}
                    >
                      {days} Días
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-amber-800 text-right">
                  Fecha Vencimiento: <strong className="text-amber-900 font-mono">{calculateDueDate()}</strong>
                </p>
              </div>
            )}
          </div>

          {/* MULTI-SCALE PESADAS SECTION */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                2. Detalle de Pesas / Balanzas ({scaleEntries.length} {scaleEntries.length === 1 ? 'Pesa' : 'Pesas'})
              </h2>
            </div>

            {/* 1. CUADRO RESUMEN EN LA PARTE SUPERIOR */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900 text-white rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-blue-800/60 pb-2">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-slate-100">
                    Resumen del Pesaje Total
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {scaleEntries.length} {scaleEntries.length === 1 ? 'Pesa' : 'Pesas'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                {/* Cantidad de Pollos */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 sm:p-3">
                  <div className="flex items-center justify-center space-x-1 text-amber-400 mb-1">
                    <Bird className="w-4 h-4" />
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-tight text-slate-300">Pollos</span>
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-amber-400 font-mono">
                    {totalChickens}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">aves</span>
                </div>

                {/* Total Kilos */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 sm:p-3">
                  <div className="flex items-center justify-center space-x-1 text-emerald-400 mb-1">
                    <Scale className="w-4 h-4" />
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-tight text-slate-300">Total Kilos</span>
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-emerald-400 font-mono">
                    {totalNetWeight.toFixed(2)}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">kg</span>
                </div>

                {/* Promedio Pesa */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 sm:p-3">
                  <div className="flex items-center justify-center space-x-1 text-sky-400 mb-1">
                    <Layers className="w-4 h-4" />
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-tight text-slate-300">Promedio</span>
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-sky-300 font-mono">
                    {averageWeightPerChicken.toFixed(2)}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">kg / ave</span>
                </div>
              </div>
            </div>

            {/* 2. FORMULARIO CON ICONOS PARA INGRESAR NUEVA PESA */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  Ingresar Nueva Pesa #{scaleEntries.length + 1}
                </span>
              </div>

              {/* Iconos Horizontales Interactivos como Pestañas de Selección */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setInputMode('chickens')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    inputMode === 'chickens'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300/60'
                      : 'bg-white/90 text-slate-700 border-emerald-200 hover:bg-white'
                  }`}
                >
                  <Bird className={`w-5 h-5 shrink-0 ${inputMode === 'chickens' ? 'text-white' : 'text-amber-600'}`} />
                  <span className="text-xs font-black">
                    Pollos {quickChickens ? `(${quickChickens})` : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('weight')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    inputMode === 'weight'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300/60'
                      : 'bg-white/90 text-slate-700 border-emerald-200 hover:bg-white'
                  }`}
                >
                  <Scale className={`w-5 h-5 shrink-0 ${inputMode === 'weight' ? 'text-white' : 'text-emerald-600'}`} />
                  <span className="text-xs font-black">
                    Peso {quickGrossWeight ? `(${quickGrossWeight} kg)` : ''}
                  </span>
                </button>
              </div>

              {/* Un Solo Cuadro de Ingreso Central */}
              <div className="pt-1">
                {inputMode === 'chickens' ? (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-extrabold text-amber-900 px-1">
                      <span>Ingresar Cantidad de Pollos (Aves)</span>
                      <button
                        type="button"
                        onClick={() => setInputMode('weight')}
                        className="text-emerald-700 hover:underline font-bold text-[10px]"
                      >
                        Cambiar a Peso Kilos →
                      </button>
                    </div>
                    <input
                      type="number"
                      value={quickChickens}
                      onChange={(e) => setQuickChickens(e.target.value)}
                      placeholder="Ingrese cantidad de pollos (ej. 120)"
                      autoFocus
                      className="w-full bg-white border-2 border-amber-500 rounded-2xl px-4 py-3 text-lg sm:text-xl font-black font-mono text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/20 text-center shadow-2xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-extrabold text-emerald-900 px-1">
                      <span>Ingresar Peso Kilos (Balanza)</span>
                      <button
                        type="button"
                        onClick={() => setInputMode('chickens')}
                        className="text-amber-700 hover:underline font-bold text-[10px]"
                      >
                        ← Cambiar a Cantidad Pollos
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={quickGrossWeight}
                      onChange={(e) => setQuickGrossWeight(e.target.value)}
                      placeholder="Ingrese peso en kg (ej. 288.5)"
                      autoFocus
                      className="w-full bg-white border-2 border-emerald-500 rounded-2xl px-4 py-3 text-lg sm:text-xl font-black font-mono text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-500/20 text-center shadow-2xs"
                    />
                  </div>
                )}
              </div>

              {/* Debajo para poner la imagen de la pesa */}
              <div className="pt-1 space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Imagen de la Pesa (Opcional)</span>
                </label>

                {quickPhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-400 bg-white h-11 flex items-center px-3">
                    <img src={quickPhotoUrl} alt="Vista previa" className="w-8 h-8 object-cover rounded-lg mr-2" />
                    <span className="text-xs text-emerald-800 font-bold truncate flex-1">Foto Adjuntada Correctamente</span>
                    <button
                      type="button"
                      onClick={() => setQuickPhotoUrl('')}
                      className="p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="cursor-pointer bg-white border border-dashed border-blue-400 hover:border-blue-600 py-2 px-3 rounded-xl flex items-center justify-center space-x-2 text-slate-800 transition-colors shadow-2xs">
                      <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-extrabold">Galería</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleQuickPhotoUpload(e)}
                        className="hidden"
                      />
                    </label>

                    <label className="cursor-pointer bg-white border border-slate-300 hover:border-slate-400 py-2 px-3 rounded-xl flex items-center justify-center space-x-2 text-slate-800 transition-colors shadow-2xs">
                      <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-extrabold">Cámara</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleQuickPhotoUpload(e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddQuickPesa}
                disabled={!quickChickens && !quickGrossWeight}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>+ AGREGAR PESA A LA LISTA</span>
              </button>
            </div>

            {/* 3. LISTADO DE PESAS REGISTRADAS EN UN SOLO LISTADO */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-600" />
                  Detalle de Pesas ({scaleEntries.length})
                </span>
                {scaleEntries.length > 0 && (
                  <span className="text-[11px] font-mono font-extrabold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                    Suma: {totalChickens} aves | {totalGrossWeight.toFixed(1)} kg
                  </span>
                )}
              </div>

              {scaleEntries.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-500 text-xs font-medium">
                  Aún no se han registrado pesas. Utilice el formulario superior para agregar la primera pesa.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3 text-center w-16 whitespace-nowrap"># Pesa</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Pollos (Aves)</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Peso Bruto</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap hidden sm:table-cell">Promedio</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {scaleEntries.map((entry, index) => {
                        const entryAvg = entry.chickens > 0 ? (entry.grossWeight / entry.chickens) : 0;
                        return (
                          <tr key={entry.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className="font-mono font-black text-xs text-blue-900 bg-blue-100/80 border border-blue-200/80 px-2.5 py-1 rounded-lg">
                                #{index + 1}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-slate-900 whitespace-nowrap">
                              {entry.chickens} <span className="text-[10px] text-slate-500 font-normal">aves</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-emerald-700 whitespace-nowrap">
                              {entry.grossWeight.toFixed(1)} <span className="text-[10px] text-emerald-600 font-normal">kg</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-extrabold text-slate-700 hidden sm:table-cell whitespace-nowrap">
                              {entryAvg.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">kg/a</span>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1.5">
                                {entry.photoUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingPhotoUrl(entry.photoUrl)}
                                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-1 font-extrabold text-[11px] shadow-2xs transition-colors cursor-pointer"
                                    title="Ver Imagen de la Pesa"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="hidden sm:inline">Foto</span>
                                  </button>
                                ) : (
                                  <label className="cursor-pointer p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-1 text-[11px] font-bold transition-colors" title="Adjuntar foto a esta pesa">
                                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="hidden sm:inline">Foto</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleScalePhotoUploadForEntry(entry.id, e)}
                                      className="hidden"
                                    />
                                  </label>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRemoveScaleEntry(entry.id)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                  title="Eliminar pesa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Notes / Observation */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Observaciones del Pesaje (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej. Galpón 1 Norte - Pollo en pie de calidad"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            {/* Direct Action Buttons at bottom of pesas section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePreviewTicket}
                disabled={totalNetWeight <= 0 || !selectedClient}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-blue-700 font-extrabold rounded-xl py-2.5 text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 border border-blue-200 transition-all"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>VISUALIZAR TICKET</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitWeighing}
                disabled={isSubmitting || totalNetWeight <= 0 || !selectedClient}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl py-2.5 text-xs uppercase tracking-wider shadow-sm flex items-center justify-center space-x-2 transition-transform active:scale-95"
              >
                <Receipt className="w-4 h-4" />
                <span>{isSubmitting ? 'Generando...' : 'GENERAR TICKET'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Real-Time Total Calculations & Ticket Generator */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4 sticky top-20">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <Receipt className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Resumen Total de Pesas ({scaleEntries.length} {scaleEntries.length === 1 ? 'pesa' : 'pesas'})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Cálculo automático de balanza en Soles (S/)
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-xl border border-blue-200 uppercase">
                {paymentType}
              </span>
            </div>

            {/* Grid de métricas completas de pesaje */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pollos</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">{totalChickens} <span className="text-xs font-normal text-slate-500">aves</span></span>
              </div>

              <div className="bg-blue-50/80 border border-blue-200/90 p-3 rounded-2xl">
                <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">Peso Neto Total</span>
                <span className="text-base sm:text-lg font-black text-blue-900 font-mono">{totalNetWeight.toFixed(1)} <span className="text-xs font-normal text-blue-700">kg</span></span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Peso Bruto</span>
                <span className="text-xs font-bold text-slate-800 font-mono">{totalGrossWeight.toFixed(1)} kg</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Promedio / Ave</span>
                <span className="text-xs font-bold text-slate-800 font-mono">{averageWeightPerChicken.toFixed(2)} kg/a</span>
              </div>

              <div className="col-span-2 bg-emerald-50/60 border border-emerald-200/80 p-2.5 rounded-2xl flex justify-between items-center">
                <span className="text-[11px] font-extrabold text-emerald-900 uppercase">Precio por Kilo:</span>
                <span className="text-sm font-black text-emerald-800 font-mono">S/ {numericUnitPrice.toFixed(2)} / kg</span>
              </div>
            </div>

            {/* Banner Destacado del Monto Total a Cobrar */}
            <div className="bg-slate-900 border-2 border-blue-600 p-4 rounded-2xl text-center space-y-1 shadow-xs text-white">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-blue-300 block">
                MONTO TOTAL A COBRAR EN SOLES
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                S/ {totalAmountToCharge.toFixed(2)}
              </div>
              <p className="text-[10px] text-slate-300 font-mono">
                {totalNetWeight.toFixed(1)} kg × S/ {numericUnitPrice.toFixed(2)} / kg
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handlePreviewTicket}
                disabled={totalNetWeight <= 0 || !selectedClient}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-blue-700 font-extrabold rounded-xl py-3 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 border border-blue-200 transition-all shadow-2xs cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Visualizar Ticket (Previa)</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitWeighing}
                disabled={isSubmitting || totalNetWeight <= 0 || !selectedClient}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-2xl py-3.5 text-xs uppercase tracking-wider shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98 cursor-pointer"
              >
                <Receipt className="w-4.5 h-4.5" />
                <span>{isSubmitting ? 'Generando Ticket...' : 'GENERAR TICKET Y REGISTRAR VENTA'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl py-2 text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Limpiar Formulario para Nuevo Pesaje</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Ticket Modal */}
      {createdTicket && (
        <TicketModal
          record={createdTicket}
          onClose={() => setCreatedTicket(null)}
        />
      )}

      {/* Quick Client Creation Modal */}
      {showQuickClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200/90 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Crear Cliente Directo para Pesa
              </h2>
              <button
                onClick={() => setShowQuickClientModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Nombre Completo del Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={quickClientName}
                  onChange={(e) => setQuickClientName(e.target.value)}
                  placeholder="ej. Distribuidora San Juan / Pollería El Rancho"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={quickClientPhone}
                  onChange={(e) => setQuickClientPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Límite de Crédito Inicial (S/)
                </label>
                <input
                  type="number"
                  value={quickClientLimit}
                  onChange={(e) => setQuickClientLimit(Number(e.target.value))}
                  placeholder="5000"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickClientModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-2xl shadow-sm"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {viewingPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Fotografía de la Pesa / Balanza
              </h3>
              <button
                onClick={() => setViewingPhotoUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-[65vh] flex items-center justify-center bg-slate-950">
              <img src={viewingPhotoUrl} alt="Foto de Pesa" className="max-h-[60vh] w-auto object-contain" />
            </div>
            <button
              onClick={() => setViewingPhotoUrl(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-2xl text-xs uppercase tracking-wider"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

