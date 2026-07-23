import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { InventoryItem } from '../types';
import { 
  Package, 
  Plus, 
  Edit3, 
  AlertTriangle, 
  Layers, 
  RefreshCw,
  Scale,
  ArrowLeft,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2
} from 'lucide-react';

interface InventoryManagerProps {
  onSelectTab?: (tab: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onSelectTab }) => {
  const { activeCompany, currentUser } = useAuth();
  const { inventory, weighings, addInventoryItem, updateInventoryItem, deleteWeighing } = useData();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form State
  const [headCount, setHeadCount] = useState<number>(500);
  const [selectedGalpon, setSelectedGalpon] = useState<string>('Galpón 1');
  const [estimatedAvgWeight, setEstimatedAvgWeight] = useState<number>(2.4);

  // Dynamic Galpones List
  const [availableGalpones, setAvailableGalpones] = useState<string[]>([
    'Galpón 1', 'Galpón 2', 'Galpón 3', 'Galpón 4', 'Galpón 5', 'Galpón 6'
  ]);
  const [newGalponInput, setNewGalponInput] = useState<string>('');
  const [showAddGalpon, setShowAddGalpon] = useState<boolean>(false);

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

  const currentCompanyId = activeCompany?.id || currentUser?.companyId || '';
  const companyInventory = inventory.filter(i => i.companyId === currentCompanyId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (headCount <= 0) {
      alert('Ingrese una cantidad válida de pollos.');
      return;
    }

    const totalWeightCalculated = headCount * estimatedAvgWeight;

    // Check if item for selected galpon already exists
    const existing = companyInventory.find(i => i.name.toLowerCase().includes(selectedGalpon.toLowerCase()));

    if (existing) {
      const newHeadCount = existing.headCount + headCount;
      const newTotalWeight = existing.totalWeight + totalWeightCalculated;
      const newAvgWeight = newHeadCount > 0 ? (newTotalWeight / newHeadCount) : estimatedAvgWeight;

      await updateInventoryItem(existing.id, {
        headCount: newHeadCount,
        totalWeight: newTotalWeight,
        averageWeight: newAvgWeight,
      });

      alert(`¡Se agregaron ${headCount} pollos a ${selectedGalpon}! Nuevo total: ${newHeadCount} aves.`);
    } else {
      await addInventoryItem({
        companyId: currentCompanyId,
        name: selectedGalpon,
        category: 'pollo_vivo',
        headCount,
        totalWeight: totalWeightCalculated,
        averageWeight: estimatedAvgWeight,
        unit: 'aves',
        minAlertThreshold: 200,
      });

      alert(`¡Lote registrado exitosamente en ${selectedGalpon} con ${headCount} pollos!`);
    }

    resetForm();
  };

  const resetForm = () => {
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

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-xs">
        <div className="flex items-center space-x-4">
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors flex items-center justify-center shrink-0"
              title="Volver al Menú"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xs shrink-0">
            <Package className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Gestión de Inventario y Galpones
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Control corporativo de lotes, existencias vivas y balance por galpón.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Menú</span>
            </button>
          )}

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xs transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Ingresar Pollos a Galpón</span>
          </button>
        </div>
      </div>

      {/* Grid of Inventory Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {companyInventory.map((item) => {
          const isLowStock = item.headCount <= item.minAlertThreshold;

          return (
            <div 
              key={item.id}
              className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-3xl p-5 shadow-xs space-y-4 relative transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {item.name}
                  </span>
                  <h3 className="font-extrabold text-lg text-slate-900 mt-2">{item.name}</h3>
                </div>
                <button
                  onClick={() => startEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Specs */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Total Pollos:</span>
                  <span className="font-black text-emerald-700 font-mono text-base">{item.headCount} aves</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Peso Estimado Total:</span>
                  <span className="font-bold text-slate-800 font-mono">{item.totalWeight.toFixed(1)} kg</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Peso Promed. Ave:</span>
                  <span className="font-bold text-slate-600 font-mono">{item.averageWeight.toFixed(2)} kg</span>
                </div>
              </div>

              {isLowStock && (
                <div className="flex items-center space-x-1.5 text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Stock Bajo (&le; {item.minAlertThreshold} aves)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* KARDEX MOVEMENTS TABLE SECTION */}
      {(() => {
        const companyWeighings = weighings.filter(w => w.companyId === currentCompanyId);
        const kardexRows = [
          ...companyInventory.map(item => ({
            id: `k_in_${item.id}`,
            date: item.updatedAt || new Date().toISOString(),
            type: 'ENTRADA' as const,
            galpon: item.name,
            chickenCount: item.headCount,
            totalWeight: item.totalWeight,
            avgWeight: item.averageWeight,
            reference: 'Ingreso de Lote / Crianza',
            operator: currentUser?.displayName || 'Administrador',
          })),
          ...companyWeighings.map(w => ({
            id: `k_out_${w.id}`,
            date: w.createdAt,
            type: 'SALIDA (VENTA)' as const,
            galpon: w.galponName || 'Galpón 1',
            chickenCount: w.chickenCount,
            totalWeight: w.netWeight,
            avgWeight: w.chickenCount > 0 ? (w.netWeight / w.chickenCount) : 0,
            reference: `Venta Balanza Ticket #${w.ticketNumber} - Cliente: ${w.clientName}`,
            operator: w.createdBy,
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden space-y-3 p-5">
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Kardex de Inventario (Entradas y Salidas de Aves)
                </h2>
              </div>
              <span className="text-xs text-slate-600 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {kardexRows.length} movimientos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Fecha / Hora</th>
                    <th className="p-3">Tipo Movimiento</th>
                    <th className="p-3">Galpón</th>
                    <th className="p-3 text-right">Cant. Aves</th>
                    <th className="p-3 text-right">Peso Total (kg)</th>
                    <th className="p-3 text-right">Prom. Ave</th>
                    <th className="p-3">Detalle / Referencia</th>
                    <th className="p-3">Operador</th>
                    <th className="p-3 text-center">Acciones (Adm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {kardexRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                        Sin movimientos de Kardex registrados.
                      </td>
                    </tr>
                  )}
                  {kardexRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {new Date(row.date).toLocaleString('es-ES')}
                      </td>
                      <td className="p-3 font-bold">
                        {row.type === 'ENTRADA' ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 font-bold">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            <span>ENTRADA</span>
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 font-bold">
                            <ArrowUpRight className="w-3 h-3 text-amber-600" />
                            <span>SALIDA (VENTA)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{row.galpon}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {row.type === 'ENTRADA' ? `+${row.chickenCount}` : `-${row.chickenCount}`} aves
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {row.totalWeight.toFixed(1)} kg
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {row.avgWeight.toFixed(2)} kg
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{row.reference}</td>
                      <td className="p-3 text-slate-500">{row.operator}</td>
                      <td className="p-3 text-center">
                        {currentUser?.role === 'admin' ? (
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Está seguro de eliminar este registro de Kardex (${row.type} - ${row.galpon})? Solo el Administrador tiene esta atribución.`)) {
                                if (row.id.startsWith('k_out_')) {
                                  const weighingId = row.id.replace('k_out_', '');
                                  deleteWeighing(weighingId);
                                } else {
                                  alert('Entrada de lote registrada.');
                                }
                              }
                            }}
                            title="Eliminar Movimiento de Kardex (Solo Administrador)"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors inline-flex items-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-mono">Restringido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200/90 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              {editingItem ? 'Editar Stock en Galpón' : 'Ingresar Pollos a Galpón'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-700 font-semibold">Seleccionar Galpón de Destino *</label>
                  <button
                    type="button"
                    onClick={() => setShowAddGalpon(!showAddGalpon)}
                    className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>＋ Crear Nuevo Galpón</span>
                  </button>
                </div>

                {showAddGalpon && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-emerald-300 mb-3 space-y-2 animate-fade-in">
                    <label className="text-[10px] text-slate-600 font-bold block">Nombre del nuevo Galpón:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="ej. Galpón 7 - Crianza Norte"
                        value={newGalponInput}
                        onChange={(e) => setNewGalponInput(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewGalpon}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                )}

                {/* Dropdown select for Galpón */}
                <select
                  value={selectedGalpon}
                  onChange={(e) => setSelectedGalpon(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-500 cursor-pointer"
                >
                  {availableGalpones.map((galpon) => (
                    <option key={galpon} value={galpon}>
                      {galpon}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Cantidad de Pollos a Ingresar *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={headCount}
                  onChange={(e) => setHeadCount(parseInt(e.target.value) || 0)}
                  placeholder="ej. 500"
                  className="w-full bg-slate-50 border border-slate-300 text-emerald-700 font-extrabold text-lg rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Peso Promedio Estimado por Pollo (kg)</label>
                <input
                  type="number"
                  step="0.05"
                  value={estimatedAvgWeight}
                  onChange={(e) => setEstimatedAvgWeight(parseFloat(e.target.value) || 2.4)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500 font-medium">Peso Total Estimado:</span>
                <span className="font-extrabold text-emerald-700">
                  {(headCount * estimatedAvgWeight).toFixed(1)} kg
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-xs"
                >
                  Guardar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

