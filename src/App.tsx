import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { MobileDashboard } from './components/MobileDashboard';
import { WeighingSystem } from './components/WeighingSystem';
import { AccountsReceivable } from './components/AccountsReceivable';
import { ClientsManager } from './components/ClientsManager';
import { InventoryManager } from './components/InventoryManager';
import { MonthlyReports } from './components/MonthlyReports';
import { AdminPanel } from './components/AdminPanel';
import { ClientPortalView } from './components/ClientPortalView';
import { ApiDocsModal } from './components/ApiDocsModal';
import { NotificationsPopover } from './components/NotificationsPopover';
import { CompanySelectorModal } from './components/CompanySelectorModal';
import { Scale, Lock, ShieldCheck, Building2, User, RefreshCw, Eye } from 'lucide-react';

function MainAppContent() {
  const { currentUser, login, companies, activeCompany, setActiveCompanyId } = useAuth();
  const { appName } = useData();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showApiDocs, setShowApiDocs] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showCompanySelector, setShowCompanySelector] = useState<boolean>(false);

  // Route user directly based on role when logged in
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setActiveTab('admin');
    } else if (currentUser?.role === 'cliente') {
      setActiveTab('mi_portal');
    }
  }, [currentUser?.uid]);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('admin');
  const [loginPass, setLoginPass] = useState('1234');
  const [loginError, setLoginError] = useState('');

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login(loginEmail, loginPass);
    } catch (err: any) {
      setLoginError('Credenciales incorrectas. Pruebe usuario admin / contraseña 1234 o seleccione Acceso Rápido.');
    }
  };

  // If no logged in user, show corporate auth landing with 1-tap quick access
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex flex-col justify-center items-center p-4 animate-fade-in relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white text-slate-900 border border-slate-200/80 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
          
          <div className="text-center space-y-3">
            <div className="inline-block relative">
              <img 
                src="/src/assets/images/jb_barboza_logo_2025_1785266795162.jpg" 
                alt="JEANPIERE BARBOZA 2025 Logo" 
                className="w-20 h-20 mx-auto object-cover rounded-2xl bg-slate-900 border-2 border-amber-500 shadow-xl shadow-amber-500/10 ring-4 ring-amber-50"
              />
              <span className="absolute -bottom-2 -right-2 bg-blue-900 text-amber-400 font-mono font-black text-[9px] uppercase px-2 py-0.5 rounded-full border border-amber-400/40 shadow-sm">
                2025
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                JEANPIERE BARBOZA
              </h1>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mt-0.5">
                Control & Pesaje Avícola
              </p>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Sistema Corporativo de Pesa Industrial de Pollos, Emisión de Tickets y Control de Cobranzas en Soles (S/)
            </p>
          </div>

          <form onSubmit={handleLoginFormSubmit} className="space-y-4 text-xs">
            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-center font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-black mb-1.5 uppercase tracking-wider text-[11px]">Usuario de Ingreso</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Ej. admin u operador1"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-black mb-1.5 uppercase tracking-wider text-[11px]">Contraseña Corporativa</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Ingresar al Sistema Corporativo</span>
            </button>
          </form>

        </div>
      </div>
    );
  }

  // Adjust active tab for roles
  let effectiveTab = activeTab;
  if (currentUser.role === 'cliente') {
    effectiveTab = (activeTab === 'dashboard' ? 'dashboard' : 'mi_portal');
  } else if (currentUser.role === 'operador') {
    if (['cuentas', 'clientes', 'reportes', 'admin'].includes(activeTab)) {
      effectiveTab = 'pesa';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      {/* Top Admin Navigation Bar (for Super Admin user) */}
      {currentUser?.role === 'admin' && (
        <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md border-b border-purple-800/40 w-full max-w-full">
          <div className="flex items-center space-x-2 truncate">
            <span className="bg-purple-500/20 text-purple-300 font-black text-[10px] uppercase px-2 py-0.5 rounded-md border border-purple-400/30 flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              SUPER ADM
            </span>
            <span className="font-semibold text-slate-200 truncate">
              Empresa activa: <strong className="text-white font-extrabold">{activeCompany?.name || 'Menú Principal Admin'}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowCompanySelector(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] sm:text-xs flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-200" />
              <span>Cambiar de Empresa</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-[11px] sm:text-xs flex items-center space-x-1.5 border border-white/20 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Menú Admin</span>
            </button>
          </div>
        </div>
      )}

      <Navbar
        activeTab={effectiveTab}
        setActiveTab={setActiveTab}
        onOpenApiDocs={() => setShowApiDocs(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenCompanySelector={() => setShowCompanySelector(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {effectiveTab === 'dashboard' && <MobileDashboard onSelectTab={setActiveTab} />}
        {effectiveTab === 'pesa' && <WeighingSystem onSelectTab={setActiveTab} />}
        {effectiveTab === 'cuentas' && <AccountsReceivable onSelectTab={setActiveTab} />}
        {effectiveTab === 'clientes' && <ClientsManager onSelectTab={setActiveTab} />}
        {effectiveTab === 'inventario' && <InventoryManager onSelectTab={setActiveTab} />}
        {effectiveTab === 'reportes' && <MonthlyReports onSelectTab={setActiveTab} />}
        {effectiveTab === 'admin' && <AdminPanel onSelectTab={setActiveTab} />}
        {effectiveTab === 'mi_portal' && <ClientPortalView onSelectTab={setActiveTab} />}
      </main>

      {/* Company Selector Modal */}
      <CompanySelectorModal
        isOpen={showCompanySelector}
        onClose={() => setShowCompanySelector(false)}
        companies={companies}
        activeCompany={activeCompany}
        onSelectCompany={(companyId) => {
          setActiveCompanyId(companyId);
          setActiveTab('pesa');
        }}
        onSelectGlobalAdmin={() => {
          setActiveTab('admin');
        }}
        onCreateCompanyClick={() => {
          setActiveTab('admin');
        }}
      />

      {/* API Documentation Modal */}
      {showApiDocs && (
        <ApiDocsModal onClose={() => setShowApiDocs(false)} />
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <NotificationsPopover onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
