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
  ArrowLeft,
  Image,
  Upload,
  X,
  Edit3,
  Trash2,
  RotateCcw,
  Crown,
  Shield,
  UserCheck
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
  const [empresaCompName, setEmpresaCompName] = useState('');
  const [empresaTaxId, setEmpresaTaxId] = useState('');
  const [empresaPhone, setEmpresaPhone] = useState('');
  const [empresaAddress, setEmpresaAddress] = useState('');

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'empresa' | 'cliente'>('empresa');
  const [editAccessLevel, setEditAccessLevel] = useState<AccessLevel>('operador');
  const [editPassword, setEditPassword] = useState('');

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
    if (!userName.trim()) {
      alert('Por favor ingrese el nombre completo del usuario.');
      return;
    }

    // Check permissions
    const isSuperAdmin = currentUser?.role === 'admin';
    const isEmpresaAdmin = currentUser?.role === 'empresa';

    if (!isSuperAdmin && !isEmpresaAdmin) {
      alert('No tienes permisos suficientes para crear usuarios.');
      return;
    }

    // Role & Access setup
    const finalRole = isSuperAdmin ? userRole : (userRole === 'cliente' ? 'cliente' : 'operador');
    const finalAccessLevel = isSuperAdmin ? userAccessLevel : 'operador';
    let finalCompanyId = isSuperAdmin ? userCompanyId : (currentUser?.companyId || activeCompany?.id || '');

    // If creating a new empresa user, create their company record automatically so they can complete profile and logo
    if (finalRole === 'empresa' && (!finalCompanyId || finalCompanyId === 'new' || isSuperAdmin)) {
      const newComp = await addCompany({
        name: empresaCompName.trim() || `Empresa ${userName}`,
        taxId: empresaTaxId.trim() || '',
        phone: empresaPhone.trim() || '',
        address: empresaAddress.trim() || '',
        active: true,
      });
      finalCompanyId = newComp.id;
      setActiveCompanyId(newComp.id);
    }

    const cleanUsername = (userUsername || userName.toLowerCase().replace(/\s+/g, '_') || 'usuario').trim();
    const finalEmail = (userEmail || `${cleanUsername}@aviscontrol.pe`).trim();

    try {
      const newProf = await createUserProfile({
        email: finalEmail,
        username: cleanUsername,
        displayName: userName,
        role: finalRole as any,
        companyId: finalCompanyId,
        accessLevel: finalAccessLevel,
        permissions: finalAccessLevel === 'super_admin' ? ['all'] : ['manage_weighing'],
        password: userPass || '1234',
      });

      setUserName('');
      setUserUsername('');
      setUserEmail('');
      setUserPass('');
      setEmpresaCompName('');
      setEmpresaTaxId('');
      setEmpresaPhone('');
      setEmpresaAddress('');
      setShowUserModal(false);
      alert(`¡Usuario "${newProf.displayName}" creado correctamente!\n• Usuario: ${newProf.username}\n• Rol: ${newProf.role}\n• Clave: ${newProf.password}`);
    } catch (err) {
      console.error('Error al crear usuario:', err);
      alert('Ocurrió un error al crear el usuario. Por favor intente nuevamente.');
    }
  };

  const handleStartEditUser = (userToEdit: UserProfile) => {
    const isSuperAdmin = currentUser?.role === 'admin';

    if (!isSuperAdmin && userToEdit.role === 'admin') {
      alert('Los usuarios de empresa no pueden modificar a Administradores Globales.');
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

    if (!isSuperAdmin && userToDelete.role === 'admin') {
      alert('Solo el Administrador Principal puede eliminar administradores.');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar al usuario "${userToDelete.displayName}" (${userToDelete.email})?`)) {
      await deleteUserProfile(userToDelete.uid);
      alert(`Usuario ${userToDelete.displayName} eliminado.`);
    }
  };

  const displayCompanies = currentUser?.role === 'admin'
    ? companies
    : companies.filter(c => c.id === (currentUser?.companyId || activeCompany?.id));

  const displayUsers = currentUser?.role === 'admin' 
    ? allUsers 
    : allUsers.filter(u => u.companyId === (currentUser?.companyId || activeCompany?.id) && u.role !== 'admin');

  const handleFullSystemReset = async () => {
    setIsResetting(true);
    try {
      await resetSystemToDefault();
      await resetUsersExceptAdmin();
      setIsResetting(false);
      setShowResetModal(false);
      alert('¡Sistema restaurado con éxito! Se han eliminado todos los pesajes, cobros, clientes, inventarios y usuarios excepto el Administrador Principal.');
      window.location.reload();
    } catch (e) {
      console.error('Error al restaurar sistema:', e);
      setIsResetting(false);
      setShowResetModal(false);
      alert('Se realizó la restauración del sistema.');
      window.location.reload();
    }
  };

  const renderUserTable = (usersList: UserProfile[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-800">
        <thead className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
          <tr>
            <th className="p-3 pl-4">Usuario / Nombre</th>
            <th className="p-3">Rol / Tipo</th>
            <th className="p-3">Nivel Acceso</th>
            <th className="p-3">Empresa</th>
            <th className="p-3 text-right pr-4">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {usersList.map((u, idx) => (
            <tr key={u.uid + idx} className="hover:bg-slate-50 transition-colors">
              <td className="p-3 pl-4 font-bold text-slate-900 flex items-center space-x-2.5">
                <div className="w-8 h-8 bg-purple-100 border border-purple-200 rounded-full flex items-center justify-center text-purple-800 font-mono text-xs font-black shrink-0">
                  {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <div className="text-slate-900 font-bold">{u.displayName}</div>
                  <div className="text-[11px] text-blue-600 font-mono font-bold">
                    @{u.username || u.email?.split('@')[0]}
                  </div>
                </div>
              </td>
              <td className="p-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                  u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                  u.role === 'empresa' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  u.role === 'cliente' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                  'bg-sky-100 text-sky-800 border border-sky-200'
                }`}>
                  {u.role === 'empresa' ? '👑 Empresa' : u.role === 'admin' ? '⭐ Admin' : u.role === 'cliente' ? '👤 Cliente' : '🛠️ Operador'}
                </span>
              </td>
              <td className="p-3 font-mono text-emerald-700 font-bold">{u.accessLevel || 'operador'}</td>
              <td className="p-3 text-slate-600 font-medium">
                {companies.find(c => c.id === u.companyId)?.name || 'Galpón Real'}
              </td>
              <td className="p-3 text-right pr-4 space-x-2">
                <button
                  onClick={() => handleStartEditUser(u)}
                  title="Editar Usuario"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-purple-700 rounded-lg border border-slate-200 inline-flex items-center cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteUserClick(u)}
                  title="Eliminar Usuario"
                  className="p-1.5 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 hover:border-rose-300 inline-flex items-center cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top Header Card for Admin Panel */}
      <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl shadow-sm text-white space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-xl border border-purple-400">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  JEANPIERE BARBOZA • 2026
                </span>
                <span className="text-xs text-slate-400 font-medium">• Panel de Administración</span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase">
                Gestión Empresarial, Seguridad y Control de Usuarios
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold px-3.5 py-2.5 rounded-2xl text-xs flex items-center space-x-2 border border-slate-700 transition-colors shadow-2xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Volver al Menú</span>
              </button>
            )}

            <button
              onClick={() => {
                if (window.confirm('¿Desea RESTAURAR EL SISTEMA a los datos por defecto de fábrica? Esta acción reiniciará los tickets y usuarios de prueba.')) {
                  resetSystemToDefault();
                }
              }}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-extrabold px-3 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 border border-rose-500/40 transition-colors cursor-pointer"
              title="Restaurar datos y estado de fábrica"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Restaurar Sistema</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('empresas')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'empresas' ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Empresas ({companies.length})
          </button>
          <button
            onClick={() => setActiveSubTab('usuarios')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'usuarios' ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Usuarios ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('permisos')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'permisos' ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Niveles de Seguridad
          </button>
        </div>
      </div>

      {/* App Name Customization Box & System Restoration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-sm flex flex-col items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Nombre del Sistema / App</h3>
              <p className="text-[11px] text-slate-500 font-medium">Personalice el título de la aplicación que aparece en la barra superior.</p>
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
              className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-600 w-full"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-transform active:scale-95 shrink-0 shadow-xs"
            >
              Guardar
            </button>
            {appSavedSuccess && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg animate-fade-in shrink-0">
                ¡OK!
              </span>
            )}
          </form>
        </div>

        {/* System Restoration Card */}
        <div className="bg-white border border-rose-200 p-5 rounded-3xl shadow-sm flex flex-col items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Restaurar Sistema (Borrado Total)</h3>
              <p className="text-[11px] text-slate-500 font-medium">Elimina pesajes, cobros, clientes e inventarios conservando la cuenta Admin.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-transform active:scale-95 shadow-xs flex items-center justify-center gap-2"
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
            <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Empresas Registradas ({companies.length}) y Logos para Tickets
            </h2>
            <button
              onClick={() => setShowCompModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-sm transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nueva Empresa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayCompanies.map((comp) => (
              <div 
                key={comp.id}
                className={`p-5 rounded-3xl shadow-sm space-y-4 border transition-all flex flex-col justify-between ${
                  activeCompany?.id === comp.id
                    ? 'bg-purple-50/50 border-purple-300 ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200/90 hover:border-purple-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {comp.logoUrl ? (
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl p-1 flex items-center justify-center overflow-hidden shadow-xs">
                          <img src={comp.logoUrl} alt="Logo Empresa" className="w-full h-full object-contain rounded-xl" />
                        </div>
                      ) : (
                        <div className="p-3 bg-purple-100 text-purple-700 border border-purple-200 rounded-2xl">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">{comp.name}</h3>
                        <p className="text-[11px] text-slate-500 font-mono font-bold">RUC/RIF: {comp.taxId || '20601234567'}</p>
                      </div>
                    </div>

                    {/* Action buttons for company */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditCompany(comp)}
                        title="Editar Empresa"
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(comp)}
                        title="Eliminar Empresa"
                        className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl border border-slate-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 font-medium">
                    <div><strong>Teléfono:</strong> {comp.phone || '+51 987 654 321'}</div>
                    <div><strong>Dirección:</strong> {comp.address || 'Av. Panamericana Sur Km 35, Lima'}</div>
                    <div className="pt-1 text-[10px] text-emerald-700 font-extrabold uppercase">● Empresa Activa en Firebase Cloud</div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      setEditingCompanyLogo(comp);
                      setNewLogoInput(comp.logoUrl || '');
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-purple-900 font-bold py-2 px-3 rounded-xl border border-slate-200 text-xs flex items-center justify-center space-x-1.5"
                  >
                    <Image className="w-3.5 h-3.5 text-purple-600" />
                    <span>{comp.logoUrl ? 'Cambiar Logo para Ticket' : 'Agregar Logo para Ticket'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveCompanyId(comp.id);
                      if (onSelectTab) {
                        onSelectTab('cuentas');
                      } else {
                        alert(`Ha ingresado a la empresa "${comp.name}". Ahora puede ver sus clientes, cobros y ventas.`);
                      }
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 shadow-xs ${
                      activeCompany?.id === comp.id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{activeCompany?.id === comp.id ? '✓ Ingresar a Ventas / Clientes' : 'Ingresar a esta Empresa'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SCROLLABLE USUARIOS TABLE */}
      {activeSubTab === 'usuarios' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-purple-600" />
                {currentUser?.role === 'admin' ? 'Administración Global de Usuarios por Empresa' : `Usuarios de ${activeCompany?.name || 'la Empresa'}`}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {currentUser?.role === 'admin' 
                  ? 'Vista jerárquica de Administradores de Empresa, Operadores y Clientes.' 
                  : 'Gestione los administradores, operadores de balanza y clientes asignados a su empresa.'}
              </p>
            </div>

            <button
              onClick={() => setShowUserModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Nuevo Usuario</span>
            </button>
          </div>

          {currentUser?.role === 'admin' ? (
            /* SUPER ADMIN VIEW: GROUPED BY COMPANY */
            <div className="space-y-6">
              {/* Global Super Admins Section */}
              {allUsers.filter(u => u.role === 'admin').length > 0 && (
                <div className="bg-white border border-purple-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="bg-purple-900 text-white p-3.5 px-5 flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-extrabold text-xs">
                      <ShieldCheck className="w-4 h-4 text-purple-300" />
                      <span>Super Administradores Globales del Sistema</span>
                    </div>
                    <span className="bg-purple-800 text-purple-200 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                      {allUsers.filter(u => u.role === 'admin').length} usuarios
                    </span>
                  </div>
                  {renderUserTable(allUsers.filter(u => u.role === 'admin'))}
                </div>
              )}

              {/* Iterate each Company */}
              {companies.map(comp => {
                const compUsers = allUsers.filter(u => u.companyId === comp.id && u.role !== 'admin');
                const empresaAdmins = compUsers.filter(u => u.role === 'empresa');
                const operadores = compUsers.filter(u => u.role !== 'empresa' && u.role !== 'cliente');
                const clientes = compUsers.filter(u => u.role === 'cliente');

                return (
                  <div key={comp.id} className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm space-y-0">
                    {/* Company Header */}
                    <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-600/30 border border-purple-400/30 rounded-xl flex items-center justify-center text-purple-300 font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-tight">
                            Empresa: {comp.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                            <span>RUC: {comp.taxId || '20601234567'}</span>
                            <span>•</span>
                            <span>Tel: {comp.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] font-mono font-bold">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                          👑 Admin: {empresaAdmins.length}
                        </span>
                        <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-full">
                          🛠️ Operadores: {operadores.length}
                        </span>
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full">
                          👥 Clientes: {clientes.length}
                        </span>
                      </div>
                    </div>

                    {compUsers.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs italic font-medium">
                        No hay usuarios registrados para esta empresa todavía.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {/* 1. Usuario Empresa Admins */}
                        {empresaAdmins.length > 0 && (
                          <div>
                            <div className="bg-emerald-50/80 px-4 py-2 text-[11px] font-extrabold text-emerald-900 border-b border-emerald-100 flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Usuario Administrador de Empresa ({comp.name})</span>
                            </div>
                            {renderUserTable(empresaAdmins)}
                          </div>
                        )}

                        {/* 2. Operadores */}
                        {operadores.length > 0 && (
                          <div>
                            <div className="bg-sky-50/80 px-4 py-2 text-[11px] font-extrabold text-sky-900 border-b border-sky-100 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-sky-600" />
                              <span>Operadores de Balanza</span>
                            </div>
                            {renderUserTable(operadores)}
                          </div>
                        )}

                        {/* 3. Clientes */}
                        {clientes.length > 0 && (
                          <div>
                            <div className="bg-purple-50/80 px-4 py-2 text-[11px] font-extrabold text-purple-900 border-b border-purple-100 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                              <span>Clientes de Portal</span>
                            </div>
                            {renderUserTable(clientes)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* COMPANY USER VIEW: ONLY SHOW CURRENT COMPANY USERS GROUPED */
            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm space-y-0">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span className="font-extrabold text-xs text-white">
                    Usuarios de {activeCompany?.name || 'su Empresa'}
                  </span>
                </div>
                <span className="text-[10px] bg-purple-600/40 text-purple-200 px-3 py-1 rounded-full font-mono font-bold">
                  Total: {displayUsers.length} usuarios
                </span>
              </div>

              {displayUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-medium">
                  No se encontraron otros usuarios registrados para su empresa.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* 1. Empresa Admins */}
                  {displayUsers.filter(u => u.role === 'empresa').length > 0 && (
                    <div>
                      <div className="bg-emerald-50 px-4 py-2 text-[11px] font-extrabold text-emerald-900 border-b border-emerald-100 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Administradores de Empresa</span>
                      </div>
                      {renderUserTable(displayUsers.filter(u => u.role === 'empresa'))}
                    </div>
                  )}

                  {/* 2. Operadores */}
                  {displayUsers.filter(u => u.role !== 'empresa' && u.role !== 'cliente').length > 0 && (
                    <div>
                      <div className="bg-sky-50 px-4 py-2 text-[11px] font-extrabold text-sky-900 border-b border-sky-100 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-sky-600" />
                        <span>Operadores de Balanza</span>
                      </div>
                      {renderUserTable(displayUsers.filter(u => u.role !== 'empresa' && u.role !== 'cliente'))}
                    </div>
                  )}

                  {/* 3. Clientes */}
                  {displayUsers.filter(u => u.role === 'cliente').length > 0 && (
                    <div>
                      <div className="bg-purple-50 px-4 py-2 text-[11px] font-extrabold text-purple-900 border-b border-purple-100 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>Clientes de Portal</span>
                      </div>
                      {renderUserTable(displayUsers.filter(u => u.role === 'cliente'))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: PERMISOS Y NIVELES */}
      {activeSubTab === 'permisos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-purple-200 p-5 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-purple-700">
              <Key className="w-5 h-5" />
              <h3 className="font-extrabold text-base text-slate-900">Super Admin</h3>
            </div>
            <p className="text-xs text-slate-600">
              Control total del ecosistema multi-tenant, creación de empresas, auditoría global y API.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside font-medium">
              <li>Crear y editar Empresas</li>
              <li>Configurar Roles y Niveles</li>
              <li>Cargar logo oficial de la empresa para tickets</li>
            </ul>
          </div>

          <div className="bg-white border border-emerald-200 p-5 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700">
              <Sliders className="w-5 h-5" />
              <h3 className="font-extrabold text-base text-slate-900">Supervisor Empresa</h3>
            </div>
            <p className="text-xs text-slate-600">
              Administración de clientes de la empresa, listas de precios, cobranzas e inventario en soles.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside font-medium">
              <li>Crear clientes de la empresa</li>
              <li>Aprobar créditos (7, 15, 30 días)</li>
              <li>Ver reportes mensuales y abonos Yape/Plim</li>
            </ul>
          </div>

          <div className="bg-white border border-blue-200 p-5 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-blue-700">
              <Lock className="w-5 h-5" />
              <h3 className="font-extrabold text-base text-slate-900">Operador Pesador</h3>
            </div>
            <p className="text-xs text-slate-600">
              Encargado de pesa directa de pollos, foto de balanza y emisión de tickets térmicos con logo.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside font-medium">
              <li>Ingresar cantidad de pollos y peso directo</li>
              <li>Imprimir y exportar tickets PDF en Soles</li>
              <li>Descontar inventario por Galpón</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal Company Logo Upload */}
      {editingCompanyLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-600" />
                Logo para Tickets: {editingCompanyLogo.name}
              </h2>
              <button
                onClick={() => setEditingCompanyLogo(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-500 font-medium">
                Este logo se mostrará en el encabezado de los tickets PDF e impresos emitidos a sus clientes.
              </p>

              {newLogoInput ? (
                <div className="relative rounded-2xl overflow-hidden border border-purple-300 p-2 bg-slate-50 flex flex-col items-center justify-center">
                  <img src={newLogoInput} alt="Vista Previa Logo" className="h-28 object-contain rounded-xl" />
                  <button
                    onClick={() => setNewLogoInput('')}
                    className="mt-2 text-[10px] text-rose-600 hover:underline font-bold"
                  >
                    Quitar Logo
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer bg-slate-50 border border-dashed border-purple-300 hover:border-purple-500 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                  <Upload className="w-8 h-8 text-purple-600" />
                  <span className="text-xs font-bold text-slate-900">Subir Imagen del Logo</span>
                  <span className="text-[10px] text-slate-500">PNG / JPG recomendados</span>
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
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompanyLogo}
                  disabled={!newLogoInput}
                  className="w-1/2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold py-3 rounded-2xl shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900">
            <h2 className="text-lg font-bold text-slate-900">Crear Nueva Empresa Comercial</h2>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="ej. Avícola Los Andes S.A.C."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">RUC / NIT Tax ID</label>
                <input
                  type="text"
                  value={compTaxId}
                  onChange={(e) => setCompTaxId(e.target.value)}
                  placeholder="RUC 20109283401"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Teléfono</label>
                <input
                  type="text"
                  value={compPhone}
                  onChange={(e) => setCompPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Logo de la Empresa (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoFileUpload(e, 'create')}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 outline-none text-[11px]"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Editar Empresa: {editingCompany.name}
              </h2>
              <button onClick={() => setEditingCompany(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  value={editCompName}
                  onChange={(e) => setEditCompName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">RUC / NIT Tax ID</label>
                <input
                  type="text"
                  value={editCompTaxId}
                  onChange={(e) => setEditCompTaxId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Teléfono</label>
                <input
                  type="text"
                  value={editCompPhone}
                  onChange={(e) => setEditCompPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Dirección</label>
                <input
                  type="text"
                  value={editCompAddress}
                  onChange={(e) => setEditCompAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900">
            <h2 className="text-lg font-bold text-slate-900">Crear Usuario e Integración</h2>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="ej. Juan Pérez Operador"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Usuario de Ingreso (Username para Login) *</label>
                <input
                  type="text"
                  required
                  value={userUsername}
                  onChange={(e) => setUserUsername(e.target.value)}
                  placeholder="ej. operador1 o juan_pesador"
                  className="w-full bg-slate-50 border border-slate-300 text-blue-700 font-bold rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Usuario con el que iniciará sesión en el sistema.</p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Contraseña</label>
                <input
                  type="password"
                  value={userPass}
                  onChange={(e) => setUserPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Rol del Usuario</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-purple-600 font-medium"
                  >
                    {currentUser?.role === 'admin' ? (
                      <>
                        <option value="empresa">Usuario Empresa (Crea Empresa)</option>
                        <option value="operador">Operador Pesador</option>
                        <option value="cliente">Cliente Portal</option>
                        <option value="admin">Administrador Global</option>
                      </>
                    ) : (
                      <>
                        <option value="operador">Operador Pesador (Kardex / Pesaje)</option>
                        <option value="cliente">Cliente de la Empresa (Portal)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Nivel Acceso</label>
                  <select
                    value={userAccessLevel}
                    onChange={(e) => setUserAccessLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-purple-600 font-medium"
                  >
                    <option value="operador">Operador Pesaje</option>
                    {currentUser?.role === 'admin' && <option value="supervisor">Supervisor</option>}
                    {currentUser?.role === 'admin' && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
              </div>

              {userRole === 'empresa' && currentUser?.role === 'admin' && (
                <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200/90 space-y-2.5">
                  <div className="flex items-center space-x-2 text-purple-900 font-extrabold text-xs">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Datos de la Empresa Comercial a Registrar</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Nombre Comercial de la Empresa *</label>
                    <input
                      type="text"
                      required={userRole === 'empresa'}
                      value={empresaCompName}
                      onChange={(e) => setEmpresaCompName(e.target.value)}
                      placeholder="ej. Avícola El Galpón S.A.C."
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">RUC / ID Fiscal</label>
                      <input
                        type="text"
                        value={empresaTaxId}
                        onChange={(e) => setEmpresaTaxId(e.target.value)}
                        placeholder="20601234567"
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Teléfono Contacto</label>
                      <input
                        type="text"
                        value={empresaPhone}
                        onChange={(e) => setEmpresaPhone(e.target.value)}
                        placeholder="+51 987654321"
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-lg font-bold text-slate-900">Editar Usuario</h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Usuario de Ingreso (Username para Login) *</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="ej. operador1 o admin_carlos"
                  className="w-full bg-slate-50 border border-slate-300 text-blue-700 font-bold rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Nombre de usuario con el que inicia sesión en el sistema.</p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nueva Contraseña</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Dejar igual o escribir nueva"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-mono text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Rol</label>
                  {currentUser?.role === 'admin' ? (
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-purple-600 font-medium"
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
                      className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3 py-2 capitalize font-bold"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Nivel Acceso</label>
                  <select
                    value={editAccessLevel}
                    onChange={(e) => setEditAccessLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-purple-600 font-medium"
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
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
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
