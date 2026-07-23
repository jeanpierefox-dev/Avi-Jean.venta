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

  const companyWeighings = weighings.filter(w => w.companyId === (activeCompany?.id || currentUser?.companyId || ''));
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
      color: 'bg-blue-600 text-white',
      shadow: 'shadow-blue-100',
      allowedRoles: ['admin', 'empresa', 'operador'],
    },
    {
      id: 'cuentas',
      title: 'Cobranzas',
      subtitle: 'Pagos y abonos en S/',
      icon: Receipt,
      badge: pendingWeighings.length > 0 ? `S/ ${totalPendingSoles.toFixed(0)}` : 'Ok',
      color: 'bg-amber-50 text-amber-700 border border-amber-200',
      shadow: 'shadow-amber-100',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'clientes',
      title: 'Clientes',
      subtitle: 'Créditos y cartera S/',
      icon: Users,
      badge: `${clients.length} reg.`,
      color: 'bg-blue-50 text-blue-700 border border-blue-200',
      shadow: 'shadow-blue-100',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'inventario',
      title: 'Galpones (Kardex)',
      subtitle: 'Aves vivas y granja',
      icon: Package,
      badge: 'Galpones',
      color: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      shadow: 'shadow-indigo-100',
      allowedRoles: ['admin', 'empresa', 'operador'],
    },
    {
      id: 'reportes',
      title: 'Reportes',
      subtitle: 'Ventas y PDF Mensual',
      icon: BarChart3,
      badge: 'PDF',
      color: 'bg-slate-100 text-slate-700 border border-slate-200',
      shadow: 'shadow-slate-100',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'admin',
      title: currentUser?.role === 'empresa' ? 'Mi Empresa & Usuarios' : 'Panel Adm',
      subtitle: currentUser?.role === 'empresa' ? 'Completar datos y logo' : 'Empresas y Seguridad',
      icon: ShieldCheck,
      badge: 'Adm',
      color: 'bg-purple-50 text-purple-700 border border-purple-200',
      shadow: 'shadow-purple-100',
      allowedRoles: ['admin', 'empresa'],
    },
    {
      id: 'mi_portal',
      title: 'Portal Cliente',
      subtitle: 'Ver foto de pesa y saldo',
      icon: UserCheck,
      badge: 'Mis pesas',
      color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      shadow: 'shadow-emerald-100',
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
    <div className="space-y-6 pb-16 animate-fade-in">
      
      {/* Mobile Top Header Banner - Corporate Private Enterprise */}
      <div className="bg-white border border-slate-200/90 p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-blue-700 uppercase">
                Consola Corporativa
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {currentUser?.displayName || 'Usuario Corporativo'}
            </h1>
            <p className="text-xs text-slate-500 flex items-center space-x-1 font-medium">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeCompany?.name || 'Empresa Avícola'}</span>
            </p>
          </div>
        </div>

        {/* Quick Kpi Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Cuentas por Cobrar Total:</span>
            <span className="text-sm sm:text-base md:text-lg font-black text-amber-600 font-mono tracking-tight whitespace-nowrap">
              S/ {totalPendingSoles.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Direct Quick Weight Priority Hero Banner */}
      {currentUser?.role !== 'cliente' && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 border border-blue-500 p-6 rounded-3xl shadow-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="flex items-center space-x-3.5 z-10">
            <div className="p-3.5 bg-white/10 backdrop-blur rounded-2xl text-white shadow-inner ring-2 ring-white/20 shrink-0">
              <Scale className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-white/20 text-white border border-white/30 uppercase">
                  Acceso Prioritario
                </span>
                <span className="text-[10px] font-bold text-emerald-300">● Listo para pesaje</span>
              </div>
              <h3 className="font-black text-base text-white tracking-tight mt-1">
                Ingreso Rápido de Pesas (Balanza + Foto)
              </h3>
              <p className="text-xs text-blue-100">
                Abono inmediato, descuento automático de galpón e impresión de ticket.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('pesa')}
            className="bg-white hover:bg-slate-50 text-blue-800 font-black px-6 py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all self-start sm:self-auto shrink-0"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>INGRESAR PESA RÁPIDA AHORA</span>
          </button>
        </div>
      )}

      {/* Grid title */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          Módulos del Sistema
        </h2>
        <span className="text-[10px] text-slate-400 font-mono">Seleccione un módulo</span>
      </div>

      {/* App Icon Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="bg-white border border-slate-200/90 hover:border-blue-400 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between space-y-4 group relative active:scale-95"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${item.color} shadow-xs ${item.shadow} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
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
