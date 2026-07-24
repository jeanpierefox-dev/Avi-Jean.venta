import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Set Favicon dynamically to Company Logo or default
  useEffect(() => {
    const faviconEl = document.getElementById('favicon');
    if (faviconEl) {
      if (activeCompany?.logoUrl) {
        faviconEl.setAttribute('href', activeCompany.logoUrl);
      } else {
        faviconEl.setAttribute('href', "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐔</text></svg>");
      }
    }
  }, [activeCompany]);

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
    <header className="bg-white/95 backdrop-blur text-slate-800 border-b border-slate-200/90 sticky top-0 z-40 shadow-sm max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {activeCompany?.logoUrl ? (
              <img 
                src={activeCompany.logoUrl} 
                alt="Logo Empresa" 
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="p-2 sm:p-2.5 bg-blue-600 rounded-xl shadow-md shadow-blue-100 flex items-center justify-center text-white ring-2 ring-blue-50 shrink-0">
                <Scale className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-slate-900 truncate max-w-[130px] sm:max-w-none">
                  {appName}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold hidden sm:block">
                Plataforma de Gestión Avícola
              </p>
            </div>
          </div>

          {/* Desktop Navigation - Executive Buttons */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isPriority = (item as any).isPriority;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100 border border-blue-500'
                      : isPriority
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
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
                  className="flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-xl transition-colors text-purple-900 font-bold shadow-2xs shrink-0"
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="max-w-[75px] sm:max-w-[140px] truncate">{activeCompany?.name || 'Empresa'}</span>
                  <ChevronDown className="w-3 h-3 text-purple-400 shrink-0" />
                </button>

                {companyDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-fade-in">
                    <div className="px-3 py-1 text-slate-400 font-bold uppercase text-[10px] flex items-center justify-between">
                      <span>Empresas Registradas</span>
                      <span className="text-purple-600 font-extrabold">{companies.length}</span>
                    </div>

                    {currentUser.role === 'admin' && onOpenCompanySelector && (
                      <button
                        onClick={() => {
                          setCompanyDropdownOpen(false);
                          onOpenCompanySelector();
                        }}
                        className="w-full text-left px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-y border-purple-100 text-purple-900 font-black flex items-center space-x-2 my-1"
                      >
                        <Sparkles className="w-4 h-4 text-purple-600" />
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
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between ${
                            activeCompany?.id === comp.id ? 'text-purple-800 font-extrabold bg-purple-50/70' : 'text-slate-700 font-medium'
                          }`}
                        >
                          <span className="truncate">{comp.name}</span>
                          {activeCompany?.id === comp.id && <div className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Badge */}
            <div className={`px-2 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-extrabold flex items-center space-x-1 shadow-xs ${roleColors[currentUser?.role || 'empresa']}`}>
              <UserCircle className="w-3.5 h-3.5 sm:hidden text-slate-600" />
              <span className="hidden sm:inline">{currentUser?.displayName || 'Usuario'}</span>
            </div>

            {/* API Docs Button */}
            <button
              onClick={onOpenApiDocs}
              title="Documentación API para terceros"
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors hidden sm:flex items-center"
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <div className="py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Usuario: <strong className="text-slate-800">{currentUser?.displayName}</strong></span>
            <span className="font-semibold text-blue-700">{activeCompany?.name}</span>
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
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenApiDocs();
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-2 text-xs text-blue-600 hover:underline font-bold"
            >
              <Code2 className="w-4 h-4" />
              <span>Documentación API REST</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

