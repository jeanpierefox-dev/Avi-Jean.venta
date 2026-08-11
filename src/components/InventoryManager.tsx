import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { InventoryItem, AdjustmentReason } from '../types';
import { 
  Warehouse, 
  Plus, 
  Edit3, 
  AlertTriangle, 
  ArrowLeft,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Flame,
  MinusCircle,
  Skull,
  Gift,
  Stethoscope,
  Building2,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface InventoryManagerProps {
  onSelectTab?: (tab: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onSelectTab }) => {
  const { activeCompany, currentUser } = useAuth();
  const { inventory, weighings, adjustments, addInventoryItem, updateInventoryItem, addInventoryAdjustment, deleteWeighing } = useData();

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Lote Entry Form State
  const [headCount, setHeadCount] = useState<number | string>(500);
  const [selectedGalpon, setSelectedGalpon] = useState<string>('Galpón 1');
  const [estimatedAvgWeight, setEstimatedAvgWeight] = useState<number | string>(2.4);

  // Discount/Loss Form State
  const [targetGalponId, setTargetGalponId] = useState<string>('');
  const [discountCount, setDiscountCount] = useState<number | string>(10);
  const [discountReason, setDiscountReason] = useState<AdjustmentReason>('mortandad');
  const [discountNotes, setDiscountNotes] = useState<string>('');

  // Dynamic Galpones List
  const [availableGalpones, setAvailableGalpones] = useState<string[]>([
    'Galpón 1', 'Galpón 2', 'Galpón 3', 'Galpón 4', 'Galpón 5', 'Galpón 6'
  ]);
  const [newGalponInput, setNewGalponInput] = useState<string>('');
  const [showAddGalpon, setShowAddGalpon] = useState<boolean>(false);

  const currentCompanyId = activeCompany?.id || currentUser?.companyId || '';
  const companyInventory = inventory.filter(i => i.companyId === currentCompanyId);
  const companyAdjustments = (adjustments || []).filter(a => a.companyId === currentCompanyId);
  const companyWeighings = weighings.filter(w => w.companyId === currentCompanyId);

  const totalChickensInGalpones = companyInventory.reduce((acc, item) => acc + item.headCount, 0);

  const handleAddNewGalpon = () => {
    const trimmed = newGalponInput.trim();
    if (!trimmed) return;
    if (!availableGalpones.includes(trimmed)) {
      setAvailableGalpones(prev => [...prev, trimmed]);
    }
    setSelectedGalpon(trimmed);
    setNewGalponInput('');
    setShowAddGalpon(false);
  };

  const handleSaveLote = async (e: React.FormEvent) => {
    e.preventDefault();
    const numHead = typeof headCount === 'number' ? headCount : (parseInt(String(headCount), 10) || 0);
    const numAvg = typeof estimatedAvgWeight === 'number' ? estimatedAvgWeight : (parseFloat(String(estimatedAvgWeight)) || 0);

    if (numHead <= 0) {
      alert('Por favor ingrese una cantidad válida de pollos.');
      return;
    }

    const totalWeightCalculated = numHead * numAvg;
    const existing = companyInventory.find(i => (i.name || '').toLowerCase().includes((selectedGalpon || '').toLowerCase()));

    if (existing) {
      const newHeadCount = existing.headCount + numHead;
      const newTotalWeight = existing.totalWeight + totalWeightCalculated;
      const newAvgWeight = newHeadCount > 0 ? (newTotalWeight / newHeadCount) : numAvg;

      await updateInventoryItem(existing.id, {
        headCount: newHeadCount,
        totalWeight: newTotalWeight,
        averageWeight: newAvgWeight,
      });

      alert(`¡Se agregaron +${numHead} pollos a ${selectedGalpon}! Nuevo total: ${newHeadCount} aves en Kardex.`);
    } else {
      await addInventoryItem({
        companyId: currentCompanyId,
        name: selectedGalpon,
        category: 'pollo_vivo',
        headCount: numHead,
        totalWeight: totalWeightCalculated,
        averageWeight: numAvg,
        unit: 'aves',
        minAlertThreshold: 200,
      });

      alert(`¡Lote registrado exitosamente en ${selectedGalpon} con ${numHead} pollos!`);
    }

    resetLoteForm();
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const numDiscount = typeof discountCount === 'number' ? discountCount : (parseInt(String(discountCount), 10) || 0);

    if (!targetGalponId) {
      alert('Seleccione un Galpón para aplicar la baja/descuento.');
      return;
    }
    if (numDiscount <= 0) {
      alert('Ingrese una cantidad mayor a 0 para el descuento.');
      return;
    }

    const targetItem = companyInventory.find(i => i.id === targetGalponId);
    if (!targetItem) {
      alert('Galpón no encontrado.');
      return;
    }

    if (numDiscount > targetItem.headCount) {
      alert(`No puede descontar ${numDiscount} pollos. El Galpón ${targetItem.name} solo tiene ${targetItem.headCount} pollos disponible.`);
      return;
    }

    const newHeadCount = Math.max(0, targetItem.headCount - numDiscount);
    const weightLost = numDiscount * targetItem.averageWeight;
    const newTotalWeight = Math.max(0, targetItem.totalWeight - weightLost);

    await updateInventoryItem(targetItem.id, {
      headCount: newHeadCount,
      totalWeight: newTotalWeight,
    });

    await addInventoryAdjustment({
      companyId: currentCompanyId,
      inventoryItemId: targetItem.id,
      galponName: targetItem.name,
      headCount: numDiscount,
      weight: weightLost,
      reason: discountReason,
      notes: discountNotes || `Baja registrada por ${discountReason.toUpperCase()}`,
    });

    alert(`¡Se descontaron -${numDiscount} pollos de ${targetItem.name} por motivo: ${discountReason.toUpperCase()}! Quedan ${newHeadCount} pollos.`);

    setShowDiscountModal(false);
    setDiscountCount(10);
    setDiscountNotes('');
  };

  const resetLoteForm = () => {
    setHeadCount(500);
    setSelectedGalpon('Galpón 1');
    setEstimatedAvgWeight(2.4);
    setEditingItem(null);
    setShowModal(false);
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setSelectedGalpon(item.name);
    setHeadCount(item.headCount);
    setEstimatedAvgWeight(item.averageWeight || 2.4);
    setShowModal(true);
  };

  // Kardex Combined Movement Rows
  const kardexRows = [
    ...companyInventory.map(item => ({
      id: `k_in_${item.id}`,
      date: item.updatedAt || new Date().toISOString(),
      type: 'ENTRADA' as const,
      category: 'INGRESO DE LOTE',
      galpon: item.name,
      chickenCount: item.headCount,
      totalWeight: item.totalWeight,
      avgWeight: item.averageWeight,
      reference: 'Ingreso inicial / Crianza en Galpón',
      operator: currentUser?.displayName || 'Administrador',
    })),
    ...companyAdjustments.map(adj => ({
      id: `k_adj_${adj.id}`,
      date: adj.createdAt,
      type: 'DESCUENTO' as const,
      category: `BAJA POR ${adj.reason.toUpperCase()}`,
      galpon: adj.galponName,
      chickenCount: adj.headCount,
      totalWeight: adj.weight,
      avgWeight: adj.headCount > 0 ? (adj.weight / adj.headCount) : 0,
      reference: adj.notes || `Descuento por ${adj.reason}`,
      operator: adj.createdBy,
    })),
    ...companyWeighings.map(w => ({
      id: `k_out_${w.id}`,
      date: w.createdAt,
      type: 'SALIDA' as const,
      category: 'VENTA EN BALANZA',
      galpon: w.galponName || 'Galpón 1',
      chickenCount: w.chickenCount,
      totalWeight: w.netWeight,
      avgWeight: w.chickenCount > 0 ? (w.netWeight / w.chickenCount) : 0,
      reference: `Ticket #${w.ticketNumber} - Cliente: ${w.clientName}`,
      operator: w.createdBy,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl shadow-sm text-white relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl border border-emerald-400">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  JEANPIERE BARBOZA • 2026
                </span>
                <span className="text-xs text-slate-400 font-medium">• Galpones & Kardex</span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase">
                Control de Granja, Lotes de Pollos y Kardex de Inventario
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 border border-slate-700 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Volver al Menú</span>
              </button>
            )}

            <button
              onClick={() => {
                if (companyInventory.length === 0) {
                  alert('Primero registre un Lote de Pollos en Galpón para poder aplicar descuentos.');
                  return;
                }
                setTargetGalponId(companyInventory[0]?.id || '');
                setShowDiscountModal(true);
              }}
              className="bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 border border-rose-700/80 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <MinusCircle className="w-4 h-4 text-rose-400" />
              <span>Descuento / Baja de Pollos</span>
            </button>

            <button
              onClick={() => {
                resetLoteForm();
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 border border-emerald-400 shadow-xl transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ingresar Lote de Pollos</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Summary */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Pollos en Stock</span>
                <span className="text-base font-black text-emerald-400 font-mono">{totalChickensInGalpones} Aves</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Galpones Activos</span>
                <span className="text-base font-black text-white font-mono">{companyInventory.length} Lotes</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Movimientos Kardex</span>
                <span className="text-base font-black text-amber-400 font-mono">{kardexRows.length} Registros</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Entry Requirement Banner */}
      {totalChickensInGalpones === 0 && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-500/80 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40 shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-tight">
                ¡INGRESO OBLIGATORIO DE POLLOS REQUERIDO!
              </h3>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                Para iniciar la venta en Balanza y llevar un Kardex exacto, debe registrar la cantidad de pollos vivos ingresados a Galpón.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetLoteForm();
              setShowModal(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs shrink-0 shadow-lg uppercase tracking-wider cursor-pointer"
          >
            ＋ Cargar Pollos Ahora
          </button>
        </div>
      )}

      {/* Grid of Galpón Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companyInventory.map((item) => {
          const isLowStock = item.headCount <= item.minAlertThreshold;

          return (
            <div 
              key={item.id}
              className="bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-6 shadow-xl space-y-5 relative transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-black text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-800">
                    {item.name}
                  </span>
                  <h3 className="font-black text-xl text-white mt-2 uppercase tracking-tight">{item.name}</h3>
                </div>
                <button
                  onClick={() => startEdit(item)}
                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                  title="Editar Lote de Galpón"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Specs Grid */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">Pollos en Stock:</span>
                  <span className="font-black text-emerald-400 font-mono text-lg">{item.headCount} Aves</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">Peso Total Estimado:</span>
                  <span className="font-black text-white font-mono">{item.totalWeight.toFixed(1)} kg</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">Peso Promedio Ave:</span>
                  <span className="font-bold text-amber-400 font-mono">{item.averageWeight.toFixed(2)} kg</span>
                </div>
              </div>

              {isLowStock && (
                <div className="flex items-center space-x-2 text-xs text-amber-300 bg-amber-950/60 p-2.5 rounded-xl border border-amber-800/80 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Stock Bajo (&le; {item.minAlertThreshold} pollos)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* KARDEX MOVEMENTS TABLE SECTION */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">
                Kardex Oficial de Granja (Entradas, Ventas y Bajas)
              </h2>
              <p className="text-xs text-slate-400">Historial de movimientos de inventario de aves en tiempo real</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            {kardexRows.length} Movimientos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-black uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Tipo Movimiento</th>
                <th className="p-3.5">Galpón</th>
                <th className="p-3.5 text-right">Cant. Aves</th>
                <th className="p-3.5 text-right">Peso Estimado (kg)</th>
                <th className="p-3.5 text-right">Prom. Ave</th>
                <th className="p-3.5">Detalle / Referencia</th>
                <th className="p-3.5">Operador</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {kardexRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                    Sin movimientos de Kardex registrados. Ingrese un lote para comenzar.
                  </td>
                </tr>
              )}
              {kardexRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                    {new Date(row.date).toLocaleString('es-ES')}
                  </td>
                  <td className="p-3.5 font-bold">
                    {row.type === 'ENTRADA' && (
                      <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-xl text-[10px] inline-flex items-center gap-1.5 font-black uppercase">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ENTRADA (LOTE)</span>
                      </span>
                    )}
                    {row.type === 'SALIDA' && (
                      <span className="bg-blue-950/90 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-xl text-[10px] inline-flex items-center gap-1.5 font-black uppercase">
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                        <span>SALIDA (VENTA)</span>
                      </span>
                    )}
                    {row.type === 'DESCUENTO' && (
                      <span className="bg-rose-950/90 text-rose-300 border border-rose-800 px-2.5 py-1 rounded-xl text-[10px] inline-flex items-center gap-1.5 font-black uppercase">
                        <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{row.category}</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-bold text-white uppercase">{row.galpon}</td>
                  <td className="p-3.5 text-right font-mono font-black text-sm">
                    {row.type === 'ENTRADA' ? (
                      <span className="text-emerald-400">+{row.chickenCount}</span>
                    ) : (
                      <span className="text-rose-400">-{row.chickenCount}</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-200">
                    {row.totalWeight.toFixed(1)} kg
                  </td>
                  <td className="p-3.5 text-right font-mono text-amber-400">
                    {row.avgWeight.toFixed(2)} kg
                  </td>
                  <td className="p-3.5 text-slate-300 max-w-xs truncate">{row.reference}</td>
                  <td className="p-3.5 text-slate-400 font-bold">{row.operator}</td>
                  <td className="p-3.5 text-center">
                    {currentUser?.role === 'admin' ? (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Desea eliminar este registro del Kardex?`)) {
                            if (row.id.startsWith('k_out_')) {
                              deleteWeighing(row.id.replace('k_out_', ''));
                            } else {
                              alert('Registro eliminado.');
                            }
                          }
                        }}
                        className="p-1.5 bg-rose-900/30 hover:bg-rose-900/60 text-rose-400 border border-rose-800/80 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ingreso de Lote de Pollos */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-white ring-1 ring-slate-700">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Warehouse className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase">
                  {editingItem ? 'Editar Lote en Galpón' : 'Ingresar Pollos a Galpón'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">Registrar la llegada de aves vivas al Kardex</p>
              </div>
            </div>

            <form onSubmit={handleSaveLote} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-300 font-bold uppercase">Seleccionar Galpón de Destino *</label>
                  <button
                    type="button"
                    onClick={() => setShowAddGalpon(!showAddGalpon)}
                    className="text-amber-400 hover:text-amber-300 text-[11px] font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>＋ Crear Galpón</span>
                  </button>
                </div>

                {showAddGalpon && (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/40 mb-3 space-y-2">
                    <label className="text-[10px] text-amber-400 font-bold block uppercase">Nombre del nuevo Galpón:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="ej. Galpón 7 - Crianza Norte"
                        value={newGalponInput}
                        onChange={(e) => setNewGalponInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-400 font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewGalpon}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3 py-2 rounded-xl cursor-pointer"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                )}

                <select
                  value={selectedGalpon}
                  onChange={(e) => setSelectedGalpon(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {availableGalpones.map((galpon) => (
                    <option key={galpon} value={galpon}>
                      {galpon}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold uppercase">Cantidad de Pollos a Ingresar *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={headCount}
                  onChange={(e) => setHeadCount(e.target.value)}
                  placeholder="ej. 500"
                  className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-black text-xl rounded-2xl px-3.5 py-2.5 outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold uppercase">Peso Promedio Estimado por Ave (kg)</label>
                <input
                  type="number"
                  step="0.05"
                  value={estimatedAvgWeight}
                  onChange={(e) => setEstimatedAvgWeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-2xl px-3.5 py-2 text-xs outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 font-bold uppercase">Peso Total Calculado:</span>
                <span className="font-black text-emerald-400 text-sm">
                  {(
                    (typeof headCount === 'number' ? headCount : (parseInt(String(headCount), 10) || 0)) *
                    (typeof estimatedAvgWeight === 'number' ? estimatedAvgWeight : (parseFloat(String(estimatedAvgWeight)) || 0))
                  ).toFixed(1)} kg
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetLoteForm}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-2xl transition-colors shadow-lg cursor-pointer uppercase"
                >
                  Guardar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Descuento / Baja de Pollos (Muertos, Obsequio, Enfermedad) */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-900/60 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-white ring-1 ring-rose-500/30">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-rose-600/20 text-rose-400 rounded-2xl border border-rose-500/30">
                <MinusCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase">
                  Registrar Descuento / Baja de Pollos
                </h2>
                <p className="text-xs text-slate-400 font-medium">Descontar aves por muertas, muestras o enfermedad</p>
              </div>
            </div>

            <form onSubmit={handleSaveDiscount} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold uppercase">Seleccionar Galpón *</label>
                <select
                  value={targetGalponId}
                  onChange={(e) => setTargetGalponId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-rose-400 cursor-pointer"
                >
                  {companyInventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.headCount} pollos en stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold uppercase">Motivo del Descuento *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountReason('mortandad')}
                    className={`p-2.5 rounded-2xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      discountReason === 'mortandad' 
                        ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Skull className="w-4 h-4 text-rose-400" />
                    <span>Pollos Muertos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountReason('obsequio')}
                    className={`p-2.5 rounded-2xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      discountReason === 'obsequio' 
                        ? 'bg-amber-950 border-amber-500 text-amber-300 ring-2 ring-amber-500' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>Obsequio / Muestra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountReason('enfermedad')}
                    className={`p-2.5 rounded-2xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      discountReason === 'enfermedad' 
                        ? 'bg-purple-950 border-purple-500 text-purple-300 ring-2 ring-purple-500' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-purple-400" />
                    <span>Enfermedad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountReason('merma')}
                    className={`p-2.5 rounded-2xl border text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      discountReason === 'merma' 
                        ? 'bg-blue-950 border-blue-500 text-blue-300 ring-2 ring-blue-500' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4 text-blue-400" />
                    <span>Merma / Otro</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold uppercase">Cantidad de Aves a Descontar *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={discountCount}
                  onChange={(e) => setDiscountCount(e.target.value)}
                  placeholder="ej. 10"
                  className="w-full bg-slate-950 border border-slate-700 text-rose-400 font-black text-xl rounded-2xl px-3.5 py-2.5 outline-none focus:border-rose-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold uppercase">Observaciones / Notas (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. Hallados 5 pollos muertos en el Galpón 2 turno mañana"
                  value={discountNotes}
                  onChange={(e) => setDiscountNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-medium rounded-2xl px-3.5 py-2.5 outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-2xl transition-colors shadow-lg cursor-pointer uppercase"
                >
                  Confirmar Baja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
