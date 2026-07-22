import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Scale, 
  Receipt, 
  Users, 
  Package, 
  BarChart3, 
  ShieldCheck, 
  UserCheck, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Building2,
  Sparkles,
  ChevronRight,
  Camera
} from 'lucide-react';

interface MobileDashboardProps {
  onSelectTab: (tab: string) => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({ onSelectTab }) => {
  const { currentUser, activeCompany, clients } = useAuth();
  const { weighings, notifications } = useData();

  const companyWeighings = weighings.filter(w => w.companyId === (activeCompany?.id || 'comp_galpon_real'));
  const pendingWeighings = companyWeighings.filter(w => w.pendingAmount > 0);
  const totalPendingSoles = companyWeighings.reduce((sum, w) => sum + w.pendingAmount, 0);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const appGridItems = [
    {
      id: 'pesa',
      title: 'Nueva Pesa',
      subtitle: 'Registrar balanza y foto',
      icon: Scale,
      badge: companyWeighings.length > 0 ? `${companyWeighings.length} hoy` : 'Listo',
      color: 'bg-blue-700 text-white border border-blue-500/30',
      shadow: 'shadow-blue-950',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'cuentas',
      title: 'Cobranzas',
      subtitle: 'Pagos y abonos en S/',
      icon: Receipt,
      badge: pendingWeighings.length > 0 ? `S/ ${totalPendingSoles.toFixed(0)}` : 'Ok',
      color: 'bg-slate-800 text-amber-300 border border-amber-600/40',
      shadow: 'shadow-amber-950',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'clientes',
      title: 'Clientes',
      subtitle: 'Créditos y cartera S/',
      icon: Users,
      badge: `${clients.length} reg.`,
      color: 'bg-slate-800 text-sky-300 border border-sky-600/40',
      shadow: 'shadow-sky-950',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'inventario',
      title: 'Inventario',
      subtitle: 'Aves vivas y granja',
      icon: Package,
      badge: 'Galpones',
      color: 'bg-slate-800 text-indigo-300 border border-indigo-600/40',
      shadow: 'shadow-indigo-950',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'reportes',
      title: 'Reportes',
      subtitle: 'Ventas y PDF Mensual',
      icon: BarChart3,
      badge: 'PDF',
      color: 'bg-slate-800 text-blue-300 border border-blue-600/40',
      shadow: 'shadow-blue-950',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'admin',
      title: 'Panel Admin',
      subtitle: 'Usuarios y Seguridad',
      icon: ShieldCheck,
      badge: 'Seguridad',
      color: 'bg-slate-800 text-slate-200 border border-slate-600/40',
      shadow: 'shadow-slate-950',
      allowedRoles: ['admin'],
    },
    {
      id: 'mi_portal',
      title: 'Portal Cliente',
      subtitle: 'Ver foto de pesa y saldo',
      icon: UserCheck,
      badge: 'Mis pesas',
      color: 'bg-blue-800 text-white border border-blue-600/40',
      shadow: 'shadow-blue-950',
      allowedRoles: ['admin', 'empresa', 'cliente'],
    },
  ];

  const visibleItems = appGridItems.filter(item => {
    if (currentUser?.role === 'cliente') {
      return item.id === 'mi_portal';
    }
    if (currentUser?.role === 'empresa') {
      return item.id !== 'admin';
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Mobile Top Header Banner - Corporate Private Enterprise */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-blue-400 uppercase">
                Consola Corporativa
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {currentUser?.displayName || 'Usuario Corporativo'}
            </h1>
            <p className="text-xs text-slate-400 flex items-center space-x-1 font-medium">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{activeCompany?.name || 'Empresa Avícola'}</span>
            </p>
          </div>
        </div>

        {/* Quick Kpi Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Cuentas por Cobrar Total:</span>
            <span className="text-xl font-black text-amber-400 font-mono tracking-tight">
              S/ {totalPendingSoles.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Direct Quick Weight Priority Hero Banner */}
      {currentUser?.role !== 'cliente' && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border-2 border-blue-500/80 p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center space-x-3.5 z-10">
            <div className="p-3.5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-950 ring-2 ring-blue-400/30 shrink-0">
              <Scale className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700 uppercase">
                  Acceso Prioritario
                </span>
                <span className="text-[10px] font-bold text-emerald-400">● Listo para pesaje</span>
              </div>
              <h3 className="font-black text-base text-white tracking-tight mt-1">
                Ingreso Rápido de Pesas (Balanza + Foto)
              </h3>
              <p className="text-xs text-slate-300">
                Abono inmediato, descuento automático de galpón e impresión de ticket.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('pesa')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-xl shadow-blue-950 active:scale-95 transition-all self-start sm:self-auto shrink-0 border border-blue-400/50"
          >
            <Camera className="w-4 h-4" />
            <span>INGRESAR PESA RÁPIDA AHORA</span>
          </button>
        </div>
      )}

      {/* Grid title */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          Módulos del Sistema
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">Seleccione un módulo</span>
      </div>

      {/* App Icon Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/60 p-4 rounded-2xl shadow-lg hover:bg-slate-800/80 transition-all duration-200 text-left flex flex-col justify-between space-y-4 group relative active:scale-95"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${item.color} shadow-md ${item.shadow} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
                  {item.badge}
                </span>
              </div>

              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};
