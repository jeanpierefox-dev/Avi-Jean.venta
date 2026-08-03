import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import systemLogo from '../assets/images/jbalance_circular_j_rooster_logo_1785729209928.jpg';
import { 
  Scale, 
  Users, 
  Receipt, 
  Package, 
  BarChart3, 
  ShieldCheck, 
  Bell, 
  LogOut, 
  Code2, 
  ChevronDown, 
  Building2, 
  UserCircle,
  Sparkles,
  Menu,
  X,
  LayoutGrid
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenApiDocs: () => void;
  onOpenNotifications: () => void;
  onOpenCompanySelector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenApiDocs,
  onOpenNotifications,
  onOpenCompanySelector,
}) => {
  const { currentUser, logout, companies, activeCompany, setActiveCompanyId, quickDemoLogin } = useAuth();
  const { notifications, appName } = useData();

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Set Favicon dynamically to System Logo
  useEffect(() => {
    const faviconEl = document.getElementById('favicon');
    if (faviconEl) {
      faviconEl.setAttribute('href', systemLogo);
    }
  }, []);

  const roleLabels = {
    admin: 'Super Administrador',
    empresa: 'Administración Empresa',
    cliente: 'Portal Cliente',
  };

  const roleColors = {
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    empresa: 'bg-blue-50 text-blue-700 border-blue-200',
    cliente: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const navItems = [
    { id: 'pesa', label: '⚖️ Pesa Rápida', icon: Scale, roles: ['admin', 'empresa', 'operador'], isPriority: true },
    { id: 'dashboard', label: 'Menú', icon: LayoutGrid, roles: ['admin', 'empresa', 'cliente', 'operador'] },
    { id: 'cuentas', label: 'Cobranza', icon: Receipt, roles: ['admin', 'empresa'] },
    { id: 'clientes', label: 'Clientes', icon: Users, roles: ['admin', 'empresa'] },
    { id: 'inventario', label: 'Galpones (Kardex)', icon: Package, roles: ['admin', 'empresa', 'operador'] },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, roles: ['admin', 'empresa'] },
    { id: 'admin', label: 'Adm', icon: ShieldCheck, roles: ['admin'] },
    { id: 'mi_portal', label: 'Mi Portal', icon: Scale, roles: ['cliente'] },
  ];

  const filteredNavItems = navItems.filter(item => currentUser && item.roles.includes(currentUser.role));

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand - Clean Emblem Design */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <img 
                src={systemLogo} 
                alt="Logo Principal" 
                className="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-full shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Desktop Navigation - Responsive & Segmented formal corporate bar */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto no-scrollbar shrink min-w-0 max-w-full">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isPriority = (item as any).isPriority;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`flex items-center space-x-1.5 px-3 xl:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 border border-blue-400 ring-1 ring-blue-400/30'
                      : isPriority
                      ? 'bg-blue-950/90 text-amber-300 hover:bg-blue-900 border border-amber-500/30 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/90 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : isPriority ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & User Menu */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            
            {/* Company Selector (for Admin / Empresa) */}
            {currentUser && currentUser.role !== 'cliente' && companies.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (currentUser.role === 'admin' && onOpenCompanySelector) {
                      onOpenCompanySelector();
                    } else {
                      setCompanyDropdownOpen(!companyDropdownOpen);
                    }
                  }}
                  title="Cambiar de Empresa / Ver Movimientos"
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors font-bold shadow-2xs shrink-0 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="max-w-[75px] sm:max-w-[140px] truncate">{activeCompany?.name || 'Empresa'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {companyDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-fade-in text-slate-100">
                    <div className="px-3 py-1 text-slate-400 font-bold uppercase text-[10px] flex items-center justify-between">
                      <span>Empresas Registradas</span>
                      <span className="text-amber-400 font-extrabold">{companies.length}</span>
                    </div>

                    {currentUser.role === 'admin' && onOpenCompanySelector && (
                      <button
                        onClick={() => {
                          setCompanyDropdownOpen(false);
                          onOpenCompanySelector();
                        }}
                        className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 border-y border-slate-700 text-amber-400 font-black flex items-center space-x-2 my-1 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>🔄 Panel Modal Cambiar Empresa</span>
                      </button>
                    )}

                    <div className="max-h-56 overflow-y-auto">
                      {companies.map((comp) => (
                        <button
                          key={comp.id}
                          onClick={() => {
                            setActiveCompanyId(comp.id);
                            setCompanyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between cursor-pointer ${
                            activeCompany?.id === comp.id ? 'text-amber-400 font-extrabold bg-slate-800/80' : 'text-slate-300 font-medium'
                          }`}
                        >
                          <span className="truncate">{comp.name}</span>
                          {activeCompany?.id === comp.id && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Badge with Menu Dropdown (Cerrar Sesión) */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setCompanyDropdownOpen(false);
                }}
                title="Menú de Usuario / Cerrar Sesión"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-extrabold flex items-center space-x-1.5 shadow-xs bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                <UserCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">{currentUser?.displayName || 'Usuario'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-slate-200">
                  <div className="px-4 py-2.5 border-b border-slate-800 space-y-0.5">
                    <p className="text-xs font-black text-white truncate">{currentUser?.displayName}</p>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      {roleLabels[currentUser?.role || 'admin']}
                    </p>
                    {activeCompany && (
                      <p className="text-[10px] text-slate-400 font-medium truncate pt-0.5">
                        🏢 {activeCompany.name}
                      </p>
                    )}
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 text-left px-3 py-2.5 text-xs font-black text-rose-400 hover:bg-rose-950/70 hover:text-rose-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* API Docs Button */}
            <button
              onClick={onOpenApiDocs}
              title="Documentación API para terceros"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors hidden sm:flex items-center cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:bg-slate-800 rounded-xl md:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 shadow-2xl">
          <div className="py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Usuario: <strong className="text-white">{currentUser?.displayName}</strong></span>
            <span className="font-semibold text-amber-400">{activeCompany?.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenApiDocs();
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-2 text-xs text-amber-400 hover:underline font-bold"
            >
              <Code2 className="w-4 h-4" />
              <span>Documentación API</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center space-x-1.5 bg-rose-950 text-rose-300 border border-rose-800 px-3 py-1.5 rounded-xl text-xs font-black"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

