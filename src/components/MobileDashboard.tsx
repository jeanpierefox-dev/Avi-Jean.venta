import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Zap, 
  Coins, 
  Briefcase, 
  Warehouse, 
  FileSpreadsheet, 
  Sliders, 
  UserCheck, 
  ChevronRight,
  Building2,
  Receipt,
  Scale,
  Users
} from 'lucide-react';

interface MobileDashboardProps {
  onSelectTab: (tab: string) => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({ onSelectTab }) => {
  const { currentUser, activeCompany, clients } = useAuth();
  const { weighings, inventory } = useData();

  const currentCompanyId = activeCompany?.id || currentUser?.companyId || '';
  const companyWeighings = weighings.filter(w => w.companyId === currentCompanyId);
  const pendingWeighings = companyWeighings.filter(w => w.pendingAmount > 0);
  const totalPendingSoles = companyWeighings.reduce((sum, w) => sum + w.pendingAmount, 0);
  
  const companyInventory = inventory.filter(i => i.companyId === currentCompanyId);
  const totalChickensInGalpones = companyInventory.reduce((sum, item) => sum + item.headCount, 0);

  const appGridItems = [
    {
      id: 'pesa',
      title: 'Módulo Pesa Rápida',
      subtitle: 'Balanza digital y captura de fotos',
      icon: Zap,
      badge: companyWeighings.length > 0 ? `${companyWeighings.length} Pesajes` : 'Listo',
      accentColor: 'from-blue-600 to-indigo-600',
      borderColor: 'hover:border-blue-500',
      glowColor: 'shadow-blue-500/20',
      allowedRoles: ['admin', 'empresa', 'operador'],
    },
    {
      id: 'cuentas',
      title: 'Módulo de Cobranzas',
      subtitle: 'Control de abonos, saldos y cuentas en S/',
      icon: Coins,
      badge: pendingWeighings.length > 0 ? `S/ ${totalPendingSoles.toFixed(0)} Pendiente` : 'Al Día',
      accentColor: 'from-amber-500 to-amber-700',
      borderColor: 'hover:border-amber-500',
      glowColor: 'shadow-amber-500/20',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'clientes',
      title: 'Directorio de Clientes',
      subtitle: 'Límites de crédito y registro comercial',
      icon: Briefcase,
      badge: `${clients.length} Clientes`,
      accentColor: 'from-cyan-600 to-blue-600',
      borderColor: 'hover:border-cyan-500',
      glowColor: 'shadow-cyan-500/20',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'inventario',
      title: 'Galpones & Kardex',
      subtitle: 'Carga de pollos viva, mortandad y mermas',
      icon: Warehouse,
      badge: totalChickensInGalpones > 0 ? `${totalChickensInGalpones} Aves` : 'Ingreso Req.',
      accentColor: 'from-emerald-600 to-teal-700',
      borderColor: 'hover:border-emerald-500',
      glowColor: 'shadow-emerald-500/20',
      allowedRoles: ['admin', 'empresa', 'operador'],
    },
    {
      id: 'reportes',
      title: 'Reportes Financieros',
      subtitle: 'Balance mensual y descarga de PDF',
      icon: FileSpreadsheet,
      badge: 'PDF 2026',
      accentColor: 'from-purple-600 to-indigo-700',
      borderColor: 'hover:border-purple-500',
      glowColor: 'shadow-purple-500/20',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'admin',
      title: currentUser?.role === 'empresa' ? 'Gestión de Empresa' : 'Panel Administrador',
      subtitle: currentUser?.role === 'empresa' ? 'Logo, razón social y usuarios' : 'Seguridad y parámetros',
      icon: Sliders,
      badge: 'Seguridad',
      accentColor: 'from-slate-700 to-slate-900',
      borderColor: 'hover:border-amber-400',
      glowColor: 'shadow-amber-500/10',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'mi_portal',
      title: 'Portal de Clientes',
      subtitle: 'Consulta de tickets y vouchers',
      icon: UserCheck,
      badge: 'Mis Compras',
      accentColor: 'from-blue-600 to-emerald-600',
      borderColor: 'hover:border-blue-400',
      glowColor: 'shadow-blue-500/20',
      allowedRoles: ['cliente'],
    },
  ];

  const visibleItems = appGridItems.filter(item => {
    if (currentUser?.role === 'cliente') {
      return item.id === 'mi_portal';
    }
    if (currentUser?.role === 'operador') {
      return item.id === 'pesa' || item.id === 'inventario';
    }
    if (currentUser?.role === 'empresa') {
      return item.id !== 'mi_portal';
    }
    return true; // admin
  });

  return (
    <div className="space-y-8 pb-16 animate-fade-in bg-slate-100/90 p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xl relative">
      
      {/* Corporate Executive Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden text-white ring-1 ring-slate-800">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-xs shadow-amber-400" />
              <span className="text-[11px] font-mono font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/30">
                SISTEMA PLATAFORMA 2026 • JEANPIERE BARBOZA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {currentUser?.displayName || 'Usuario Corporativo'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center space-x-2 font-semibold">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{activeCompany?.name || 'Empresa Avícola'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-300 font-mono text-[11px] uppercase bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-700">
                ROL: {currentUser?.role?.toUpperCase()}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-xl shrink-0">
            <img 
              src={currentUser?.role === 'empresa' && activeCompany?.logoUrl ? activeCompany.logoUrl : "/src/assets/images/jb_barboza_logo_2025_1785266795162.jpg"} 
              alt="Logo Principal" 
              className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-amber-500 shadow-md shadow-amber-500/20 object-cover shrink-0"
            />
            <div className="text-left space-y-0.5 pr-2">
              <span className="text-xs font-black text-white block uppercase">
                {currentUser?.role === 'empresa' ? activeCompany?.name || 'Empresa Avícola' : 'Plataforma Oficial'}
              </span>
              <span className="inline-flex items-center text-[9px] font-extrabold text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded-md border border-emerald-800 mt-1">
                ● Servidor Conectado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid - Clean Icon Buttons Without Platform Titles */}
      <div className="space-y-4">
        {/* High-Tech Icon Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.title}
                className={`group bg-white border border-slate-200 hover:border-blue-500 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-md hover:bg-blue-50/50 transition-all duration-200 flex flex-col items-center justify-center space-y-2.5 cursor-pointer relative overflow-hidden active:scale-95`}
              >
                {/* Top Accent Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.accentColor}`} />

                {/* Platform Icon Container */}
                <div className={`p-3.5 sm:p-4 rounded-xl bg-gradient-to-br ${item.accentColor} text-white shadow-xs group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>

                {/* Minimalist Badge Tag */}
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 group-hover:text-blue-900 transition-colors bg-slate-100 group-hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
