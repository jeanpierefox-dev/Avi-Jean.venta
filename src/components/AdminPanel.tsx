import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Company, UserProfile, AccessLevel } from '../types';
import { 
  ShieldCheck, 
  Building2, 
  UserPlus, 
  Plus, 
  Key, 
  Lock, 
  Users, 
  Sliders, 
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Image,
  Upload,
  X,
  Edit3,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface AdminPanelProps {
  onSelectTab?: (tab: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onSelectTab }) => {
  const { companies, createUserProfile, updateUserProfile, deleteUserProfile, resetUsersExceptAdmin, currentUser, allUsers, activeCompany, setActiveCompanyId } = useAuth();
  const { addCompany, updateCompany, deleteCompany, resetSystemToDefault, appName, updateAppName } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'empresas' | 'usuarios' | 'permisos'>('empresas');
  const [appNameInput, setAppNameInput] = useState(appName);
  const [appSavedSuccess, setAppSavedSuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Company Creation Form
  const [showCompModal, setShowCompModal] = useState(false);
  const [compName, setCompName] = useState('');
  const [compTaxId, setCompTaxId] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compLogoUrl, setCompLogoUrl] = useState('');

  // Company Edit Modal State
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompName, setEditCompName] = useState('');
  const [editCompTaxId, setEditCompTaxId] = useState('');
  const [editCompPhone, setEditCompPhone] = useState('');
  const [editCompAddress, setEditCompAddress] = useState('');
  const [editCompLogoUrl, setEditCompLogoUrl] = useState('');

  // Logo Edit Modal State
  const [editingCompanyLogo, setEditingCompanyLogo] = useState<Company | null>(null);
  const [newLogoInput, setNewLogoInput] = useState('');

  // User Creation Form
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'empresa' | 'cliente'>('empresa');
  const [userCompanyId, setUserCompanyId] = useState(companies[0]?.id || '');
  const [userAccessLevel, setUserAccessLevel] = useState<AccessLevel>('operador');

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'empresa' | 'cliente'>('empresa');
  const [editAccessLevel, setEditAccessLevel] = useState<AccessLevel>('operador');
  const [editPassword, setEditPassword] = useState('');

  // Default sample users for initial scroll view
  const defaultUsersList: UserProfile[] = [
    { uid: 'u1', email: 'admin@aviscontrol.com', displayName: 'Administrador Principal', role: 'admin', companyId: 'comp_galpon_real', accessLevel: 'super_admin', permissions: ['all'], createdAt: new Date().toISOString() },
    { uid: 'u2', email: 'empresa@galponreal.com', displayName: 'María Administradora', role: 'empresa', companyId: 'comp_galpon_real', accessLevel: 'supervisor', permissions: ['manage_weighing'], createdAt: new Date().toISOString() },
    { uid: 'u3', email: 'operador1@galponreal.com', displayName: 'Carlos Pesador Galpón', role: 'empresa', companyId: 'comp_galpon_real', accessLevel: 'operador', permissions: ['manage_weighing'], createdAt: new Date().toISOString() },
    { uid: 'u4', email: 'cliente.sanjuan@gmail.com', displayName: 'Avícola San Juan', role: 'cliente', clientId: 'cli_san_juan', companyId: 'comp_galpon_real', accessLevel: 'operador', permissions: [], createdAt: new Date().toISOString() },
    { uid: 'u5', email: 'cliente.pollerias@gmail.com', displayName: 'Pollerías El Rancho', role: 'cliente', clientId: 'cli_pollerias_rancho', companyId: 'comp_galpon_real', accessLevel: 'operador', permissions: [], createdAt: new Date().toISOString() },
    { uid: 'u6', email: 'supervisor2@aviscontrol.com', displayName: 'Roberto Supervisor', role: 'empresa', companyId: 'comp_galpon_real', accessLevel: 'supervisor', permissions: ['manage_weighing'], createdAt: new Date().toISOString() },
  ];

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;

    const newComp = await addCompany({
      name: compName,
      taxId: compTaxId,
      phone: compPhone,
      address: compAddress,
      logoUrl: compLogoUrl || undefined,
      active: true,
    });

    setActiveCompanyId(newComp.id);
    setCompName('');
    setCompTaxId('');
    setCompPhone('');
    setCompAddress('');
    setCompLogoUrl('');
    setShowCompModal(false);
  };

  const handleStartEditCompany = (comp: Company) => {
    setEditingCompany(comp);
    setEditCompName(comp.name);
    setEditCompTaxId(comp.taxId || '');
    setEditCompPhone(comp.phone || '');
    setEditCompAddress(comp.address || '');
    setEditCompLogoUrl(comp.logoUrl || '');
  };

  const handleSaveEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !editCompName.trim()) return;

    await updateCompany(editingCompany.id, {
      name: editCompName,
      taxId: editCompTaxId,
      phone: editCompPhone,
      address: editCompAddress,
      logoUrl: editCompLogoUrl || undefined,
    });

    setEditingCompany(null);
    alert('¡Empresa actualizada con éxito!');
  };

  const handleDeleteCompany = async (comp: Company) => {
    if (companies.length <= 1) {
      alert('No se puede eliminar la única empresa registrada en el sistema.');
      return;
    }
    if (confirm(`¿Está seguro de eliminar permanentemente la empresa "${comp.name}"?`)) {
      await deleteCompany(comp.id);
      alert('Empresa eliminada correctamente.');
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'create') setCompLogoUrl(reader.result as string);
        else setNewLogoInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompanyLogo = async () => {
    if (!editingCompanyLogo || !newLogoInput) return;
    await updateCompany(editingCompanyLogo.id, { logoUrl: newLogoInput });
    alert(`Logo actualizado para la empresa ${editingCompanyLogo.name}. Saldrá impreso en los tickets de los clientes.`);
    setEditingCompanyLogo(null);
    setNewLogoInput('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !userName.trim()) return;

    // Check permissions
    const isSuperAdmin = currentUser?.role === 'admin';
    const isEmpresaAdmin = currentUser?.role === 'empresa';

    if (!isSuperAdmin && !isEmpresaAdmin) {
      alert('No tienes permisos suficientes para crear usuarios.');
      return;
    }

    // Empresa admin can only create operadores or clientes
    const finalRole = isSuperAdmin ? userRole : 'empresa';
    const finalAccessLevel = isSuperAdmin ? userAccessLevel : 'operador';
    const finalCompanyId = isSuperAdmin ? userCompanyId : (currentUser?.companyId || activeCompany?.id || 'comp_galpon_real');

    const cleanUsername = (userUsername || userName.toLowerCase().replace(/\s+/g, '_') || 'usuario').trim();

    const newProf = await createUserProfile({
      email: `${cleanUsername}@aviscontrol.pe`,
      username: cleanUsername,
      displayName: userName,
      role: finalRole,
      companyId: finalCompanyId,
      accessLevel: finalAccessLevel,
      permissions: finalAccessLevel === 'super_admin' ? ['all'] : ['manage_weighing'],
      password: userPass || '1234',
    });

    setUserName('');
    setUserUsername('');
    setUserEmail('');
    setUserPass('');
    setShowUserModal(false);
    alert(`Usuario ${newProf.displayName} (@${newProf.username}) creado correctamente.`);
  };

  const handleStartEditUser = (userToEdit: UserProfile) => {
    const isSuperAdmin = currentUser?.role === 'admin';
    const isEmpresaAdmin = currentUser?.role === 'empresa';

    // Empresa admin can only edit operadores or clients
    if (!isSuperAdmin && (userToEdit.role === 'admin' || (userToEdit.role === 'empresa' && userToEdit.accessLevel !== 'operador'))) {
      alert('Los usuarios empresa solo pueden modificar a sus usuarios operadores.');
      return;
    }

    setEditingUser(userToEdit);
    setEditName(userToEdit.displayName);
    setEditUsername(userToEdit.username || userToEdit.email?.split('@')[0] || '');
    setEditEmail(userToEdit.email || '');
    setEditRole(userToEdit.role);
    setEditAccessLevel(userToEdit.accessLevel || 'operador');
    setEditPassword(userToEdit.password || '');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const cleanUsername = editUsername.trim() || editingUser.username || 'usuario';

    await updateUserProfile(editingUser.uid, {
      displayName: editName,
      username: cleanUsername,
      email: `${cleanUsername}@aviscontrol.pe`,
      role: editRole,
      accessLevel: editAccessLevel,
      password: editPassword,
    });

    alert(`Usuario ${editName} actualizado exitosamente.`);
    setEditingUser(null);
  };

  const handleDeleteUserClick = async (userToDelete: UserProfile) => {
    const isSuperAdmin = currentUser?.role === 'admin';
    const isEmpresaAdmin = currentUser?.role === 'empresa';

    if (!isSuperAdmin && (userToDelete.role === 'admin' || (userToDelete.role === 'empresa' && userToDelete.accessLevel !== 'operador'))) {
      alert('Solo el Administrador Principal puede eliminar administradores. Los usuarios empresa solo pueden eliminar operadores.');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar al usuario "${userToDelete.displayName}" (${userToDelete.email})?`)) {
      await deleteUserProfile(userToDelete.uid);
      alert(`Usuario ${userToDelete.displayName} eliminado.`);
    }
  };

  const displayUsers = allUsers;

  const handleFullSystemReset = async () => {
    setIsResetting(true);
    try {
      await resetSystemToDefault();
      await resetUsersExceptAdmin();
      setIsResetting(false);
      setShowResetModal(false);
      setTimeout(() => {
        alert('¡Sistema restaurado con éxito! Se han eliminado todos los pesajes, cobros, clientes, inventarios y usuarios excepto el Administrador Principal.');
        window.location.reload();
      }, 100);
    } catch (e) {
      console.error('Error al restaurar sistema:', e);
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-colors border border-slate-700 flex items-center justify-center"
              title="Volver al Menú Principal"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Panel de Administración Global
              <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full font-mono">
                Multi-Empresa &amp; Roles
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Creación de Empresas, gestión del logo de la empresa para tickets, usuarios y niveles de acceso.
            </p>
          </div>
        </div>

        {/* Sub Tabs and Navigation */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 border border-slate-700"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Volver al Menú</span>
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('¿Desea RESTAURAR EL SISTEMA a los datos por defecto de fábrica? Esta acción reiniciará los tickets y usuarios de prueba.')) {
                resetSystemToDefault();
              }
            }}
            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 border border-rose-800 transition-colors shadow"
            title="Restaurar datos y estado de fábrica"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Restaurar Sistema</span>
          </button>

          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('empresas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'empresas' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Empresas ({companies.length})
            </button>
            <button
              onClick={() => setActiveSubTab('usuarios')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'usuarios' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Usuarios ({allUsers.length})
            </button>
            <button
              onClick={() => setActiveSubTab('permisos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'permisos' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Niveles de Seguridad
            </button>
          </div>
        </div>
      </div>

      {/* App Name Customization Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-950 text-blue-400 border border-blue-800 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Nombre del Sistema / App</h3>
              <p className="text-[11px] text-slate-400">Personalice el título de la aplicación que aparece en la barra superior.</p>
            </div>
          </div>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              updateAppName(appNameInput);
              setAppSavedSuccess(true);
              setTimeout(() => setAppSavedSuccess(false), 3000);
            }}
            className="flex items-center gap-2 w-full"
          >
            <input
              type="text"
              value={appNameInput}
              onChange={(e) => setAppNameInput(e.target.value)}
              placeholder="Ej. Mi Sistema Avícola..."
              className="bg-slate-950 border border-slate-700 text-white font-bold text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 w-full"
            />
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-transform active:scale-95 shrink-0 shadow-md shadow-blue-950"
            >
              Guardar
            </button>
            {appSavedSuccess && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded-lg animate-fade-in shrink-0">
                ¡OK!
              </span>
            )}
          </form>
        </div>

        {/* System Restoration & Wipe Card */}
        <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-2xl shadow-lg flex flex-col items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-950 text-rose-400 border border-rose-800 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Restaurar Sistema (Borrado Total)</h3>
              <p className="text-[11px] text-slate-400">Elimina todos los datos (pesajes, cobros, clientes, inventarios y usuarios) conservando únicamente la cuenta Admin.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="w-full bg-rose-700 hover:bg-rose-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-transform active:scale-95 shadow-md shadow-rose-950 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Sistema (Conservar Solo Admin)</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: EMPRESAS & LOGO MANAGEMENT */}
      {activeSubTab === 'empresas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Empresas Registradas y Logos para Tickets
            </h2>
            <button
              onClick={() => setShowCompModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-purple-900/40"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nueva Empresa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((comp) => (
              <div 
                key={comp.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3 relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {comp.logoUrl ? (
                        <div className="w-12 h-12 bg-slate-950 border border-slate-700 rounded-2xl p-1 flex items-center justify-center overflow-hidden">
                          <img src={comp.logoUrl} alt="Logo Empresa" className="w-full h-full object-contain rounded-xl" />
                        </div>
                      ) : (
                        <div className="p-3 bg-purple-950/80 text-purple-400 border border-purple-800/60 rounded-2xl">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-base text-white">{comp.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono">RUC/RIF: {comp.taxId || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Action buttons for company */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditCompany(comp)}
                        title="Editar Empresa"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl border border-slate-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(comp)}
                        title="Eliminar Empresa"
                        className="p-2 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-xl border border-slate-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div><strong>Teléfono:</strong> {comp.phone || 'N/A'}</div>
                    <div><strong>Dirección:</strong> {comp.address || 'N/A'}</div>
                    <div className="pt-1 text-[10px] text-emerald-400 font-extrabold uppercase">● Sincronizado en Firebase Cloud</div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      setEditingCompanyLogo(comp);
                      setNewLogoInput(comp.logoUrl || '');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold py-2 px-3 rounded-xl border border-slate-700 text-xs flex items-center justify-center space-x-1.5"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>{comp.logoUrl ? 'Cambiar Logo para Tickets' : 'Agregar Logo para Tickets'}</span>
                  </button>

                  <button
                    onClick={() => setActiveCompanyId(comp.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition-colors ${
                      activeCompany?.id === comp.id
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {activeCompany?.id === comp.id ? '✓ Empresa Seleccionada' : 'Seleccionar Esta Empresa'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SCROLLABLE USUARIOS TABLE */}
      {activeSubTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Gestión de Usuarios (Deslizable Verticalmente)
            </h2>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-purple-900/40"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Nuevo Usuario</span>
            </button>
          </div>

          {/* Scrollable Container with Max Height */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="max-h-96 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Usuario / Nombre</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Nivel Acceso</th>
                    <th className="p-4">Empresa</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {allUsers.map((u, idx) => (
                    <tr key={u.uid + idx} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold text-white flex items-center space-x-2">
                        <div className="w-7 h-7 bg-purple-950 border border-purple-800 rounded-full flex items-center justify-center text-purple-300 font-mono text-xs shrink-0">
                          {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="truncate">
                          <div className="text-slate-100 font-bold">{u.displayName}</div>
                          <div className="text-[11px] text-emerald-400 font-mono font-bold">
                            @{u.username || u.email?.split('@')[0]}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                          u.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          u.role === 'empresa' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          'bg-sky-950 text-sky-300 border border-sky-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-emerald-400 font-bold">{u.accessLevel || 'operador'}</td>
                      <td className="p-4 text-slate-400 font-medium">
                        {companies.find(c => c.id === u.companyId)?.name || 'Galpón Real'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleStartEditUser(u)}
                          title="Editar Usuario"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg border border-slate-700 inline-flex items-center"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUserClick(u)}
                          title="Eliminar Usuario"
                          className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg border border-slate-700 hover:border-rose-800 inline-flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-950 text-center text-[10px] text-slate-500 border-t border-slate-800 font-mono">
              ↑ Deslice hacia arriba o abajo para navegar entre los usuarios registrados ↑
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PERMISOS Y NIVELES */}
      {activeSubTab === 'permisos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-purple-800/60 p-5 rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-purple-400">
              <Key className="w-5 h-5" />
              <h3 className="font-extrabold text-base text-white">Super Admin</h3>
            </div>
            <p className="text-xs text-slate-400">
              Control total del ecosistema multi-tenant, creación de empresas, auditoría global y API.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Crear y editar Empresas</li>
              <li>Configurar Roles y Niveles</li>
              <li>Cargar logo oficial de la empresa para tickets</li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-emerald-800/60 p-5 rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Sliders className="w-5 h-5" />
              <h3 className="font-extrabold text-base text-white">Supervisor Empresa</h3>
            </div>
            <p className="text-xs text-slate-400">
              Administración de clientes de la empresa, listas de precios, cobranzas e inventario en soles.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Crear clientes de la empresa</li>
              <li>Aprobar créditos (7, 15, 30 días)</li>
              <li>Ver reportes mensuales y abonos Yape/Plim</li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-blue-800/60 p-5 rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-blue-400">
              <Lock className="w-5 h-5" />
              <h3 className="font-extrabold text-base text-white">Operador Pesador</h3>
            </div>
            <p className="text-xs text-slate-400">
              Encargado de pesa directa de pollos, foto de balanza y emisión de tickets térmicos con logo.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Ingresar cantidad de pollos y peso directo</li>
              <li>Imprimir y exportar tickets PDF en Soles</li>
              <li>Descontar inventario por Galpón</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal Company Logo Upload */}
      {editingCompanyLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-400" />
                Logo para Tickets: {editingCompanyLogo.name}
              </h2>
              <button
                onClick={() => setEditingCompanyLogo(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Este logo se mostrará en el encabezado de los tickets PDF e impresos emitidos a sus clientes.
              </p>

              {newLogoInput ? (
                <div className="relative rounded-2xl overflow-hidden border border-purple-500 p-2 bg-slate-950 flex flex-col items-center justify-center">
                  <img src={newLogoInput} alt="Vista Previa Logo" className="h-28 object-contain rounded-xl" />
                  <button
                    onClick={() => setNewLogoInput('')}
                    className="mt-2 text-[10px] text-rose-400 hover:underline font-bold"
                  >
                    Quitar Logo
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer bg-slate-950 border border-dashed border-purple-500/50 hover:border-purple-400 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                  <Upload className="w-8 h-8 text-purple-400" />
                  <span className="text-xs font-bold text-white">Subir Imagen del Logo</span>
                  <span className="text-[10px] text-slate-400">PNG / JPG recomendados</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoFileUpload(e, 'edit')}
                    className="hidden"
                  />
                </label>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCompanyLogo(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompanyLogo}
                  disabled={!newLogoInput}
                  className="w-1/2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold py-3 rounded-2xl shadow-lg shadow-purple-900/40"
                >
                  Guardar Logo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Company Creation */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Crear Nueva Empresa Comercial</h2>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="ej. Avícola Los Andes S.A.C."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">RUC / NIT Tax ID</label>
                <input
                  type="text"
                  value={compTaxId}
                  onChange={(e) => setCompTaxId(e.target.value)}
                  placeholder="RUC 20109283401"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Teléfono</label>
                <input
                  type="text"
                  value={compPhone}
                  onChange={(e) => setCompPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Logo de la Empresa (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoFileUpload(e, 'create')}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 outline-none text-[11px]"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-purple-900/40"
                >
                  Guardar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Company Editing */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                Editar Empresa: {editingCompany.name}
              </h2>
              <button onClick={() => setEditingCompany(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  value={editCompName}
                  onChange={(e) => setEditCompName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">RUC / NIT Tax ID</label>
                <input
                  type="text"
                  value={editCompTaxId}
                  onChange={(e) => setEditCompTaxId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Teléfono</label>
                <input
                  type="text"
                  value={editCompPhone}
                  onChange={(e) => setEditCompPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Dirección</label>
                <input
                  type="text"
                  value={editCompAddress}
                  onChange={(e) => setEditCompAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-900/40"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal User Creation */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Crear Usuario e Integración</h2>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="ej. Juan Pérez Operador"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Usuario de Ingreso (Username para Login) *</label>
                <input
                  type="text"
                  required
                  value={userUsername}
                  onChange={(e) => setUserUsername(e.target.value)}
                  placeholder="ej. operador1 o juan_pesador"
                  className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Usuario con el que iniciará sesión en el sistema.</p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Contraseña</label>
                <input
                  type="password"
                  value={userPass}
                  onChange={(e) => setUserPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentUser?.role === 'admin' ? (
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Rol General</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                    >
                      <option value="empresa">Usuario Empresa</option>
                      <option value="admin">Administrador Global</option>
                      <option value="cliente">Cliente Portal</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Rol General</label>
                    <input
                      type="text"
                      disabled
                      value="Operador Empresa"
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-400 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nivel Acceso</label>
                  <select
                    value={userAccessLevel}
                    onChange={(e) => setUserAccessLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  >
                    <option value="operador">Operador Pesaje</option>
                    {currentUser?.role === 'admin' && <option value="supervisor">Supervisor</option>}
                    {currentUser?.role === 'admin' && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-purple-900/40"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal User Edit */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h2 className="text-lg font-bold text-white">Editar Usuario</h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Usuario de Ingreso (Username para Login) *</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="ej. operador1 o admin_carlos"
                  className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Nombre de usuario con el que inicia sesión en el sistema.</p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nueva Contraseña</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Dejar igual o escribir nueva"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Rol</label>
                  {currentUser?.role === 'admin' ? (
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                    >
                      <option value="empresa">Empresa</option>
                      <option value="admin">Administrador</option>
                      <option value="cliente">Cliente</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={editRole}
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-400 rounded-xl px-3 py-2 capitalize font-bold"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nivel Acceso</label>
                  <select
                    value={editAccessLevel}
                    onChange={(e) => setEditAccessLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                  >
                    <option value="operador">Operador</option>
                    {currentUser?.role === 'admin' && <option value="supervisor">Supervisor</option>}
                    {currentUser?.role === 'admin' && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-purple-900/40"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for System Reset / Wipe */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-rose-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center space-x-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-rose-950 border border-rose-800 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">¿Restaurar el Sistema?</h2>
                <p className="text-[11px] text-slate-400">Acción irreversible de limpieza general</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="font-semibold text-rose-300">
                Se eliminarán permanentemente de la base de datos:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Todos los registros de pesaje de pollos y tickets</li>
                <li>Todos los cobros, abonos e historial de pagos</li>
                <li>Todos los clientes y empresas secundarias</li>
                <li>Todo el inventario y galpones cargados</li>
                <li>Todos los usuarios creados (supervisores, operadores, clientes)</li>
              </ul>
              <p className="pt-2 text-emerald-400 font-bold border-t border-slate-800">
                ✓ ÚNICA EXCEPCIÓN: La cuenta de Administrador Principal permanecerá intacta e iniciada.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFullSystemReset}
                disabled={isResetting}
                className="w-1/2 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl shadow-lg shadow-rose-950 text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isResetting ? 'Restaurando...' : 'Sí, Borrar Todo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
