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
  const [scaleEntries, setScaleEntries] = useState<ScaleEntry[]>([]);

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
    if (companyClients.length > 0 && (!selectedClientId || !companyClients.some(c => c.id === selectedClientId))) {
      setSelectedClientId(companyClients[0].id);
    }
  }, [clients, currentCompanyId]);

  useEffect(() => {
    if (galponesList.length > 0 && (!selectedGalponId || !galponesList.some(g => g.id === selectedGalponId))) {
      setSelectedGalponId(galponesList[0].id);
    }
  }, [inventory, currentCompanyId]);

  const selectedClient = companyClients.find(c => c.id === selectedClientId) || companyClients[0] || null;
  const selectedGalpon = galponesList.find(g => g.id === selectedGalponId) || galponesList[0] || null;

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
    setScaleEntries([]);
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
      
      {/* Streamlined Compact Header Bar */}
      <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl shadow-sm text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-xl border border-blue-400">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                JEANPIERE BARBOZA • 2026
              </span>
              <span className="text-xs text-slate-400 font-medium">• Operación de Balanza</span>
            </div>
          </div>
        </div>

        {onSelectTab && (
          <button
            onClick={() => onSelectTab('dashboard')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Volver</span>
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Main Input & Pesas Workstation */}
        <div className="space-y-4">
          
          {/* Client & Sale Configuration - Compact Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Client Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Cliente
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickClientModal(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Nuevo Cliente</span>
                  </button>
                </div>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {companyClients.length === 0 && (
                    <option value="">⚠️ Sin clientes registrados</option>
                  )}
                  {companyClients.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.name} {cli.phone ? `(${cli.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Galpón Inventory Origin Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Galpón / Lote Origen
                </label>
                <select
                  value={selectedGalponId}
                  onChange={(e) => setSelectedGalponId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-blue-900 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {galponesList.length === 0 && (
                    <option value="">Galpón General de Granja</option>
                  )}
                  {galponesList.map((gal) => (
                    <option key={gal.id} value={gal.id}>
                      {gal.name} ({gal.headCount || (gal as any).quantity || 0} aves)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price & Payment Type Compact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              {/* Unit Price Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio Kilo (S/ / kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-mono font-black text-xs">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="8.50"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-8 pr-3 py-1.5 text-xs font-black font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo Venta
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentType('contado')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                      paymentType === 'contado'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Contado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('credito')}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                      paymentType === 'credito'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Crédito</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Credit Days Selector */}
            {paymentType === 'credito' && (
              <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Plazo Crédito:</span>
                <div className="flex items-center space-x-1.5">
                  {[7, 15, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setCreditDays(days)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        creditDays === days
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-amber-200'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MULTI-SCALE PESADAS SECTION - COMPACT & ORDERED */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
            
            {/* Quick Summary Header */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3 shadow-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs uppercase tracking-wide">
                  Resumen de Pesaje ({scaleEntries.length} {scaleEntries.length === 1 ? 'pesa' : 'pesas'})
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono font-bold">
                <span className="text-amber-400">{totalChickens} aves</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400">{totalNetWeight.toFixed(1)} kg</span>
                <span className="text-slate-500">•</span>
                <span className="text-sky-300">{averageWeightPerChicken.toFixed(2)} kg/ave</span>
              </div>
            </div>

            {/* Formulario Compacto para Agregar Pesa */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>+ Agregar Pesa #{scaleEntries.length + 1}</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('chickens')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                      inputMode === 'chickens'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    Pollos
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('weight')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                      inputMode === 'weight'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    Peso kg
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-7">
                  {inputMode === 'chickens' ? (
                    <input
                      type="number"
                      value={quickChickens}
                      onChange={(e) => setQuickChickens(e.target.value)}
                      placeholder="Cantidad de pollos (aves)"
                      className="w-full bg-white border border-amber-400 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.1"
                      value={quickGrossWeight}
                      onChange={(e) => setQuickGrossWeight(e.target.value)}
                      placeholder="Peso en kilos (kg)"
                      className="w-full bg-white border border-emerald-400 rounded-xl px-3 py-2 text-sm font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  )}
                </div>

                <div className="sm:col-span-5 flex items-center space-x-2">
                  <label className="cursor-pointer bg-white border border-slate-300 hover:border-slate-400 px-2.5 py-2 rounded-xl flex items-center justify-center space-x-1 text-slate-700 text-xs font-bold shrink-0">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>{quickPhotoUrl ? '✓ Foto' : 'Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleQuickPhotoUpload(e)}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddQuickPesa}
                    disabled={!quickChickens && !quickGrossWeight}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla Compacta de Pesas Registradas */}
            <div className="space-y-2">
              {scaleEntries.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center text-slate-500 text-xs font-medium">
                  Aún no hay pesas registradas.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                        <th className="py-2 px-3 text-center w-12">#</th>
                        <th className="py-2 px-3 text-center">Pollos</th>
                        <th className="py-2 px-3 text-center">Peso kg</th>
                        <th className="py-2 px-3 text-center hidden sm:table-cell">Prom. kg/ave</th>
                        <th className="py-2 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {scaleEntries.map((entry, index) => {
                        const entryAvg = entry.chickens > 0 ? (entry.grossWeight / entry.chickens) : 0;
                        return (
                          <tr key={entry.id} className="hover:bg-blue-50/50">
                            <td className="py-2 px-3 text-center font-bold text-slate-600">
                              #{index + 1}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-900">
                              {entry.chickens} <span className="text-[10px] text-slate-400 font-normal">aves</span>
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-emerald-700">
                              {entry.grossWeight.toFixed(1)} <span className="text-[10px] text-emerald-600 font-normal">kg</span>
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-slate-600 hidden sm:table-cell">
                              {entryAvg.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                {entry.photoUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setViewingPhotoUrl(entry.photoUrl)}
                                    className="p-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-300"
                                    title="Ver Foto"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveScaleEntry(entry.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

        {/* Step 3: Resumen Total Unificado & Emisión de Ticket (SIN REDUNDANCIAS) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                3. Resumen Total y Generar Ticket
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {scaleEntries.length} {scaleEntries.length === 1 ? 'pesa registrada' : 'pesas registradas'}
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 text-xs text-center">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Aves</span>
              <span className="text-base font-black text-slate-900 font-mono">{totalChickens}</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-2xl">
              <span className="text-[10px] font-extrabold text-blue-800 uppercase block">Peso Neto Total</span>
              <span className="text-base font-black text-blue-900 font-mono">{totalNetWeight.toFixed(1)} <span className="text-xs font-normal">kg</span></span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Prom. Ave</span>
              <span className="text-base font-bold text-slate-800 font-mono">{averageWeightPerChicken.toFixed(2)} <span className="text-xs font-normal">kg</span></span>
            </div>
          </div>

          {/* Banner Principal del Monto Total a Cobrar */}
          <div className="bg-slate-900 border-2 border-blue-600 p-4 rounded-2xl text-center space-y-1 text-white shadow-sm">
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

          {/* Observaciones Input */}
          <div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del pesaje (opcional)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 font-medium"
            />
          </div>

          {/* ÚNICOS BOTONES DE ACCIÓN (Sin Duplicados) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handlePreviewTicket}
              disabled={totalNetWeight <= 0 || !selectedClient}
              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-blue-700 font-extrabold rounded-2xl py-3.5 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 border border-blue-200 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Visualizar Ticket (Previa)</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitWeighing}
              disabled={isSubmitting || totalNetWeight <= 0 || !selectedClient}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-2xl py-3.5 text-xs uppercase tracking-wider shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Generar Ticket Final'}</span>
            </button>
          </div>

          {scaleEntries.length > 0 && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors inline-flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Limpiar pesas para un nuevo registro</span>
              </button>
            </div>
          )}
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
                <label className="block text-slate-800 font-extrabold mb-1 uppercase text-[11px] tracking-wider">
                  Nombre Completo / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={quickClientName}
                  onChange={(e) => setQuickClientName(e.target.value)}
                  placeholder="ej. Distribuidora San Juan / Pollería El Rancho"
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:border-blue-600 text-slate-900 rounded-2xl px-4 py-3 outline-none font-bold text-sm shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1 uppercase text-[10px] tracking-wider">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={quickClientPhone}
                  onChange={(e) => setQuickClientPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs outline-none font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-3xl sm:max-w-4xl rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                Fotografía Original de Pesa / Balanza — Sin Recortes
              </h3>
              <button
                onClick={() => setViewingPhotoUrl(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[78vh] flex items-center justify-center bg-slate-950 p-2">
              <img src={viewingPhotoUrl} alt="Foto de Pesa" className="max-h-[72vh] w-full h-auto object-contain rounded-xl" />
            </div>
            <button
              onClick={() => setViewingPhotoUrl(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-3 rounded-2xl text-xs uppercase tracking-wider transition-colors"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

