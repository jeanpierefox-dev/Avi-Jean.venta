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
      badge: 'PDF 2025',
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
    <div className="space-y-8 pb-16 animate-fade-in">
      
      {/* Corporate Executive Hero Header */}
      <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden text-white ring-1 ring-slate-800">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-xs shadow-amber-400" />
              <span className="text-[11px] font-mono font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/30">
                SISTEMA PLATAFORMA 2025 • JEANPIERE BARBOZA
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
              src={activeCompany?.logoUrl || "/src/assets/images/jb_barboza_logo_2025_1785266795162.jpg"} 
              alt="JEANPIERE BARBOZA 2025 Logo" 
              className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-amber-500 shadow-md shadow-amber-500/20 object-cover shrink-0"
            />
            <div className="text-left space-y-0.5 pr-2">
              <span className="text-xs font-black text-white block uppercase">Plataforma Oficial</span>
              <span className="text-[10px] text-amber-400 font-mono block font-bold">EDICIÓN CORPORATIVA 2025</span>
              <span className="inline-flex items-center text-[9px] font-extrabold text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded-md border border-emerald-800">
                ● Servidor Conectado
              </span>
            </div>
          </div>
        </div>

        {/* Executive KPI Summary Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Pesajes</span>
                <span className="text-sm font-black text-white font-mono">{companyWeighings.length} Registros</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-600/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Por Cobrar</span>
                <span className="text-sm font-black text-amber-400 font-mono">S/ {totalPendingSoles.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Stock Aves Vivo</span>
                <span className="text-sm font-black font-mono text-emerald-400">{totalChickensInGalpones} Pollos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid - Clean Module Platform Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            PLATAFORMAS DEL SISTEMA CORPORATIVO
          </h2>
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            {visibleItems.length} MÓDULOS ACTIVOS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`bg-slate-950 border border-slate-800 ${item.borderColor} p-6 rounded-3xl shadow-lg hover:${item.glowColor} transition-all duration-300 text-left flex flex-col justify-between space-y-6 group cursor-pointer relative overflow-hidden active:scale-98`}
              >
                {/* Glowing Top Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.accentColor} opacity-80 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start justify-between">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.accentColor} text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase bg-slate-900 text-amber-400 px-3 py-1 rounded-xl border border-slate-800 shadow-inner">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-lg text-white group-hover:text-amber-400 transition-colors flex items-center justify-between uppercase tracking-tight">
                    <span>{item.title}</span>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1.5 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-black text-slate-400 group-hover:text-white transition-colors uppercase tracking-wider">
                  <span>ACCEDER A PLATAFORMA</span>
                  <span className="font-mono text-amber-400 font-extrabold text-[10px]">2025 →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
