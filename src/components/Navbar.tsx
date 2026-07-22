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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenApiDocs,
  onOpenNotifications,
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
    admin: 'bg-slate-800 text-indigo-300 border-indigo-700/60',
    empresa: 'bg-slate-800 text-blue-300 border-blue-700/60',
    cliente: 'bg-slate-800 text-sky-300 border-sky-700/60',
  };

  const navItems = [
    { id: 'dashboard', label: 'Menú', icon: LayoutGrid, roles: ['admin', 'empresa', 'cliente'] },
    { id: 'pesa', label: 'Pesa', icon: Scale, roles: ['admin', 'empresa'] },
    { id: 'cuentas', label: 'Cobranza', icon: Receipt, roles: ['admin', 'empresa'] },
    { id: 'clientes', label: 'Clientes', icon: Users, roles: ['admin', 'empresa'] },
    { id: 'inventario', label: 'Galpones', icon: Package, roles: ['admin', 'empresa'] },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, roles: ['admin', 'empresa'] },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
    { id: 'mi_portal', label: 'Mi Portal', icon: Scale, roles: ['cliente'] },
  ];

  const filteredNavItems = navItems.filter(item => currentUser && item.roles.includes(currentUser.role));

  return (
    <header className="bg-slate-900/95 backdrop-blur text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand - Corporate Private Enterprise */}
          <div className="flex items-center space-x-3">
            {activeCompany?.logoUrl ? (
              <img 
                src={activeCompany.logoUrl} 
                alt="Logo Empresa" 
                className="w-10 h-10 object-contain rounded-xl bg-slate-800 p-1 border border-slate-700 shadow-md"
              />
            ) : (
              <div className="p-2.5 bg-blue-700 rounded-xl shadow-md shadow-blue-950 flex items-center justify-center text-white border border-blue-500/30">
                <Scale className="w-5 h-5 stroke-[2.5]" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-blue-300 via-sky-200 to-white bg-clip-text text-transparent">
                  {appName}
                </span>
                <span className="text-[9px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/80 font-bold">
                  Perú
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold hidden sm:block">
                {activeCompany?.name || 'Sistema Corporativo Avícola'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation - Executive Buttons */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-md shadow-blue-950 border border-blue-500/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & User Menu */}
          <div className="flex items-center space-x-2.5">
            
            {/* Company Selector (for Admin / Empresa) */}
            {currentUser && currentUser.role !== 'cliente' && companies.length > 0 && (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs px-3 py-1.5 rounded-xl transition-colors text-slate-200"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold max-w-[120px] truncate">{activeCompany?.name || 'Empresa'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {companyDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs">
                    <div className="px-3 py-1 text-slate-400 font-semibold uppercase text-[10px]">
                      Empresa Activa
                    </div>
                    {companies.map((comp) => (
                      <button
                        key={comp.id}
                        onClick={() => {
                          setActiveCompanyId(comp.id);
                          setCompanyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-700/60 flex items-center justify-between ${
                          activeCompany?.id === comp.id ? 'text-emerald-400 font-bold bg-slate-700/30' : 'text-slate-300'
                        }`}
                      >
                        <span className="truncate">{comp.name}</span>
                        {activeCompany?.id === comp.id && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Role Badge / Switcher - ONLY FOR ADMIN */}
            {currentUser?.role === 'admin' ? (
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-extrabold shadow-sm transition-all ${
                    roleColors[currentUser?.role || 'admin']
                  }`}
                >
                  <UserCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Demo Rol (Admin)</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs">
                    <div className="px-3 py-1 text-slate-400 font-semibold uppercase text-[10px] flex items-center justify-between">
                      <span>Cambiar Vista Demo</span>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                    <button
                      onClick={() => {
                        quickDemoLogin('admin');
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700/60 text-slate-200 flex items-center space-x-2"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <div>
                        <div className="font-semibold text-purple-300">Super Administrador</div>
                        <div className="text-[10px] text-slate-400">Acceso total, empresas y API</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        quickDemoLogin('empresa', 'comp_galpon_real');
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700/60 text-slate-200 flex items-center space-x-2"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <div className="font-semibold text-emerald-300">{appName}</div>
                        <div className="text-[10px] text-slate-400">Pesa, cobros, inventario</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        quickDemoLogin('cliente', 'comp_galpon_real', 'cli_san_juan');
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700/60 text-slate-200 flex items-center space-x-2"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <div>
                        <div className="font-semibold text-blue-300">Distribuidora San Juan</div>
                        <div className="text-[10px] text-slate-400">Portal Cliente</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-extrabold flex items-center space-x-1.5 ${roleColors[currentUser?.role || 'empresa']}`}>
                <UserCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{currentUser?.displayName}</span>
              </div>
            )}

            {/* API Docs Button */}
            <button
              onClick={onOpenApiDocs}
              title="Documentación API para terceros"
              className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors hidden sm:flex items-center"
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors"
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
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:bg-slate-800 rounded-xl md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <div className="py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Usuario: <strong className="text-slate-200">{currentUser?.displayName}</strong></span>
            <span className="font-semibold text-emerald-400">{activeCompany?.name}</span>
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
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
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
              className="flex items-center space-x-2 text-xs text-emerald-400 hover:underline"
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

