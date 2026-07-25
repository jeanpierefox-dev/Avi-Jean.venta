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
  ShieldAlert,
  Camera,
  Image as ImageIcon,
  X,
  FolderOpen,
  Eye
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
  const [unitPrice, setUnitPrice] = useState<number>(8.50); // Default price in Soles (S/)
  const [paymentType, setPaymentType] = useState<PaymentType>('credito');
  const [creditDays, setCreditDays] = useState<number>(15); // 7, 15, 30 días
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Multi-Scale / Pesadas State
  const [scaleEntries, setScaleEntries] = useState<ScaleEntry[]>([
    { id: '1', chickens: 120, grossWeight: 288.0, photoUrl: '' }
  ]);

  // Overall / Default scale image if not specified per entry
  const [scaleImageUrl, setScaleImageUrl] = useState<string>('');

  // Quick Client Modal State
  const [showQuickClientModal, setShowQuickClientModal] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientLimit, setQuickClientLimit] = useState<number>(5000);

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

  // Calculated Totals Summed Across All Scale Entries
  const totalChickens = scaleEntries.reduce((sum, item) => sum + (Number(item.chickens) || 0), 0);
  const totalGrossWeight = scaleEntries.reduce((sum, item) => sum + (Number(item.grossWeight) || 0), 0);
  const totalNetWeight = totalGrossWeight;

  const averageWeightPerChicken = totalChickens > 0 ? (totalNetWeight / totalChickens) : 0;
  const totalAmountToCharge = totalNetWeight * unitPrice;

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
        unitPrice,
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
      unitPrice: unitPrice,
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
      
      {/* Module Title Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm text-slate-900">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors border border-slate-200 flex items-center justify-center"
                title="Volver al Menú"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-sm">
              <Scale className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                Pesa Directa de Pollos (Múltiples Pesas)
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md font-mono font-bold">
                  Soles Peruanos (S/)
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Ingrese una o varias pesadas con foto individual. Limpieza automática para nuevos pesajes.
              </p>
            </div>
          </div>

          {onSelectTab && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="self-start md:self-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold text-xs rounded-2xl border border-slate-200 flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Volver al Menú Principal</span>
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
                    step="0.10"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
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
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-700 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                2. Detalle de Pesas / Balanzas ({scaleEntries.length} {scaleEntries.length === 1 ? 'Pesa' : 'Pesas'})
              </h2>

              <button
                type="button"
                onClick={handleAddScaleEntry}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ AGREGAR OTRA PESA</span>
              </button>
            </div>

            <div className="space-y-4">
              {scaleEntries.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 relative space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                    <span className="font-extrabold text-xs text-blue-900 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-blue-600" />
                      PESA #{index + 1}
                    </span>

                    {scaleEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveScaleEntry(entry.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar pesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Cantidad de Pollos (Aves)
                      </label>
                      <input
                        type="number"
                        value={entry.chickens === 0 ? '' : entry.chickens}
                        onChange={(e) => handleUpdateScaleEntry(entry.id, 'chickens', e.target.value === '' ? 0 : parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 text-base font-black font-mono outline-none focus:border-emerald-600"
                        placeholder="ej. 120"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Peso Directo Balanza (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={entry.grossWeight === 0 ? '' : entry.grossWeight}
                        onChange={(e) => handleUpdateScaleEntry(entry.id, 'grossWeight', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        className="w-full bg-white border border-slate-300 text-emerald-700 rounded-xl px-3 py-2.5 text-base font-black font-mono outline-none focus:border-emerald-600"
                        placeholder="ej. 288.0"
                      />
                    </div>
                  </div>

                  {/* Photo for this specific scale entry */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Foto de esta Pesa #{index + 1}
                    </label>
                    {entry.photoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white h-28">
                        <img src={entry.photoUrl} alt={`Foto Pesa ${index+1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleUpdateScaleEntry(entry.id, 'photoUrl', '')}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer bg-white border border-dashed border-blue-300 hover:border-blue-500 p-2.5 rounded-xl flex items-center justify-center space-x-2 text-slate-700 transition-colors">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold">Tomar / Adjuntar Foto de Pesa #{index + 1}</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleScalePhotoUploadForEntry(entry.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddScaleEntry}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-3 rounded-2xl text-xs border border-slate-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>+ AGREGAR OTRA PESA / BALANZA AL REGISTRO</span>
            </button>
          </div>

          {/* Notes / Observation */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
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

        </div>

        {/* RIGHT COLUMN: Real-Time Total Calculations & Ticket Generator */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md relative overflow-hidden space-y-6 sticky top-20">

            <div className="flex items-center justify-between border-b border-slate-200/90 pb-4">
              <div className="flex items-center space-x-3">
                <Receipt className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Monto a Cobrar (Soles)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Suma Total de {scaleEntries.length} {scaleEntries.length === 1 ? 'Pesa' : 'Pesas'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 bg-slate-100 text-blue-700 font-bold rounded-lg border border-slate-200">
                {paymentType.toUpperCase()}
              </span>
            </div>

            {/* Main Calculation Cards */}
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Total Pollos Vivos</span>
                <span className="text-xl font-black text-slate-900 font-mono">{totalChickens} aves</span>
              </div>

              <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase text-blue-800 block">Peso Neto Total</span>
                  <span className="text-[11px] text-slate-500">Promedio: {averageWeightPerChicken.toFixed(2)} kg/ave</span>
                </div>
                <span className="text-2xl font-black text-blue-900 font-mono">
                  {totalNetWeight.toFixed(2)} <span className="text-xs font-normal">kg</span>
                </span>
              </div>
            </div>

            {/* Total Amount Big Banner */}
            <div className="bg-slate-900 border-2 border-blue-600 p-5 rounded-2xl text-center space-y-1 shadow-sm text-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Monto Total a Cobrar en Soles
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                S/ {totalAmountToCharge.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-300">
                {totalNetWeight.toFixed(1)} kg × S/ {unitPrice.toFixed(2)}/kg
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handlePreviewTicket}
                disabled={totalNetWeight <= 0 || !selectedClient}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-blue-700 font-extrabold rounded-2xl py-3 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 border border-blue-200 transition-all shadow-xs"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>VISUALIZAR TICKET ANTES DE REGISTRAR</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitWeighing}
                disabled={isSubmitting || totalNetWeight <= 0 || !selectedClient}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-2xl py-4 text-xs uppercase tracking-wider shadow-md flex items-center justify-center space-x-3 transition-transform active:scale-95"
              >
                <Receipt className="w-5 h-5" />
                <span>{isSubmitting ? 'Generando Ticket...' : 'GENERAR TICKET Y REGISTRAR'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl py-2.5 text-xs flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Limpiar Todo para Nuevo Pesaje</span>
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

    </div>
  );
};

