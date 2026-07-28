import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { BarChart3, Calendar, FileDown, TrendingUp, Scale, DollarSign, Users, ArrowLeft } from 'lucide-react';
import { generateMonthlyReportPDF, downloadTicketPDF } from '../lib/pdfGenerator';

interface MonthlyReportsProps {
  onSelectTab?: (tab: string) => void;
}

export const MonthlyReports: React.FC<MonthlyReportsProps> = ({ onSelectTab }) => {
  const { activeCompany, currentUser } = useAuth();
  const { weighings } = useData();


  const [selectedMonth, setSelectedMonth] = useState<string>('2026-07');

  const companyWeighings = weighings.filter(w => w.companyId === (activeCompany?.id || currentUser?.companyId || ''));

  // Filter weighings by selected YYYY-MM
  const monthWeighings = companyWeighings.filter(w => {
    return w.createdAt.startsWith(selectedMonth);
  });

  const totalChickens = monthWeighings.reduce((sum, w) => sum + w.chickenCount, 0);
  const totalNetWeight = monthWeighings.reduce((sum, w) => sum + w.netWeight, 0);
  const totalAmount = monthWeighings.reduce((sum, w) => sum + w.totalAmount, 0);
  const totalPaid = monthWeighings.reduce((sum, w) => sum + w.paidAmount, 0);
  const totalPending = monthWeighings.reduce((sum, w) => sum + w.pendingAmount, 0);

  const cashSales = monthWeighings.filter(w => w.paymentType === 'contado').reduce((sum, w) => sum + w.totalAmount, 0);
  const creditSales = monthWeighings.filter(w => w.paymentType === 'credito').reduce((sum, w) => sum + w.totalAmount, 0);

  const avgPricePerKg = totalNetWeight > 0 ? (totalAmount / totalNetWeight) : 0;
  const avgWeightPerChicken = totalChickens > 0 ? (totalNetWeight / totalChickens) : 0;

  const handleExportPDF = () => {
    if (!activeCompany) return;
    generateMonthlyReportPDF(selectedMonth, activeCompany, monthWeighings);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card for Monthly Reports */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-600 rounded-2xl shadow-md border border-emerald-400">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/40">
                  JEANPIERE BARBOZA • 2025
                </span>
                <span className="text-xs text-slate-400 font-semibold">• Consolidado Mensual</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                Reportes Financieros y Balance de Ventas en PDF
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

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-2xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-400 cursor-pointer"
            />

            <button
              onClick={handleExportPDF}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 border border-emerald-400 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Aves Pesadas</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalChickens.toLocaleString()} <span className="text-xs font-normal text-slate-500">aves</span>
          </div>
          <p className="text-[11px] text-slate-500">Promedios: {avgWeightPerChicken.toFixed(2)} kg / pollo</p>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Kilos Netos Vendidos</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {totalNetWeight.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-500">Precio Promedio: S/ {avgPricePerKg.toFixed(2)} / kg</p>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Monto Total Ventas</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            S/ {totalAmount.toFixed(2)}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold">Total Recaudado: S/ {totalPaid.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Pendiente de Cobro</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            S/ {totalPending.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">{monthWeighings.filter(w => w.pendingAmount > 0).length} tickets con saldo</p>
        </div>
      </div>

      {/* Contado vs Credito Financial Breakdown Bar */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-100 text-emerald-700 rounded-2xl border border-slate-200">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Desglose Modalidad de Venta</h3>
            <p className="text-xs text-slate-500">Resumen de colocación al Contado vs Crédito en el período</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 font-mono text-xs">
          <div className="bg-slate-50 border border-emerald-200 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] text-emerald-800 block font-sans font-bold">AL CONTADO</span>
            <span className="text-sm font-extrabold text-slate-900">S/ {cashSales.toFixed(2)}</span>
          </div>

          <div className="bg-slate-50 border border-amber-200 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] text-amber-800 block font-sans font-bold">A CRÉDITO</span>
            <span className="text-sm font-extrabold text-slate-900">S/ {creditSales.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Activity Table Breakdown */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/90 font-bold text-sm text-slate-900 flex justify-between items-center">
          <span>Detalle de Operaciones en el Mes</span>
          <span className="text-xs text-slate-500 font-mono">{monthWeighings.length} Registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Ticket</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Pollos</th>
                <th className="p-4">Peso Neto</th>
                <th className="p-4">Precio/kg</th>
                <th className="p-4">Monto Total</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {monthWeighings.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                    No hay pesajes registrados en el mes seleccionado ({selectedMonth}).
                  </td>
                </tr>
              )}
              {monthWeighings.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-slate-500">
                    {new Date(w.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="p-4 font-bold text-slate-900">{w.ticketNumber}</td>
                  <td className="p-4 font-semibold text-slate-800">{w.clientName}</td>
                  <td className="p-4 font-mono text-slate-700">{w.chickenCount} aves</td>
                  <td className="p-4 font-bold font-mono text-emerald-700">{w.netWeight.toFixed(1)} kg</td>
                  <td className="p-4 font-mono text-slate-700">S/ {w.unitPrice.toFixed(2)}</td>
                  <td className="p-4 font-bold font-mono text-slate-900">S/ {w.totalAmount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                      w.paymentStatus === 'pagado' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {w.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => downloadTicketPDF(w, activeCompany || undefined)}
                      title="Ver / Descargar Ticket de esta Venta"
                      className="bg-slate-100 hover:bg-slate-200 text-emerald-700 hover:text-emerald-800 font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] inline-flex items-center space-x-1 transition-colors"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Ticket Venta</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
