import React, { useState } from 'react';
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
import { Scale, Lock, UserCheck, ShieldCheck, Sparkles, Building2, KeyRound, User } from 'lucide-react';

function MainAppContent() {
  const { currentUser, login, quickDemoLogin, activeCompany } = useAuth();
  const { appName } = useData();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showApiDocs, setShowApiDocs] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 animate-fade-in">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 bg-blue-700 rounded-2xl shadow-lg shadow-blue-950 mb-1 border border-blue-500/30">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {appName}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Plataforma Corporativa de Gestión Avícola, Pesa Industrial y Cobranza (S/)
            </p>
          </div>

          <form onSubmit={handleLoginFormSubmit} className="space-y-4 text-xs">
            {loginError && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-xl text-center font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[11px]">Usuario de Ingreso</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Ej. admin u operador1"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-medium rounded-xl pl-9 pr-3.5 py-2.5 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[11px]">Contraseña Corporativa</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-3.5 py-2.5 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-600 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-950 transition-transform active:scale-95"
            >
              Ingresar al Sistema Corporativo
            </button>
          </form>

        </div>
      </div>
    );
  }

  // Adjust active tab for client role
  const effectiveTab = currentUser.role === 'cliente' 
    ? (activeTab === 'dashboard' ? 'dashboard' : 'mi_portal') 
    : activeTab;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={effectiveTab}
        setActiveTab={setActiveTab}
        onOpenApiDocs={() => setShowApiDocs(true)}
        onOpenNotifications={() => setShowNotifications(true)}
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
