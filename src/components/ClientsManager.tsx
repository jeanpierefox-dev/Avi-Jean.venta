import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Client } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Clock, 
  Edit, 
  Trash2,
  FileText,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { generateStatementPDF } from '../lib/pdfGenerator';

interface ClientsManagerProps {
  onSelectTab?: (tab: string) => void;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({ onSelectTab }) => {
  const { activeCompany, currentUser } = useAuth();

  const { clients, addClient, updateClient, deleteClient, weighings, payments } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleDeleteClient = async (client: Client) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente "${client.name}"?\nEsta acción eliminará al cliente del directorio.`)) {
      await deleteClient(client.id);
    }
  };

  // New Client Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<string>('3000');
  const [creditDays, setCreditDays] = useState<string>('15');

  const currentCompanyId = activeCompany?.id || currentUser?.companyId || '';
  const companyClients = clients.filter(c => c.companyId === currentCompanyId);

  const filteredClients = companyClients.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const limitNum = creditLimit === '' ? 0 : Number(creditLimit) || 0;
    const daysNum = creditDays === '' ? 0 : Number(creditDays) || 0;

    if (editingClient) {
      await updateClient(editingClient.id, {
        name,
        phone,
        email,
        address,
        creditLimit: limitNum,
        creditDays: daysNum,
      });
    } else {
      const newCli = await addClient({
        companyId: currentCompanyId,
        name,
        phone,
        email,
        address,
        creditLimit: limitNum,
        creditDays: daysNum,
        currentBalance: 0,
      });
      const userAssigned = (newCli as any).assignedUsername || 'cliente';
      alert(`¡Cliente "${newCli.name}" registrado correctamente!\n\n• Usuario Cliente Creado: ${userAssigned}\n• Contraseña: 1234\n\nEl cliente ya puede ingresar al sistema para ver su historial completo de compras, estado de cuenta y descargar sus pesas.`);
    }

    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCreditLimit('3000');
    setCreditDays('15');
    setEditingClient(null);
    setShowAddModal(false);
  };

  const startEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setAddress(client.address || '');
    setCreditLimit(client.creditLimit !== undefined && client.creditLimit !== null ? String(client.creditLimit) : '');
    setCreditDays(client.creditDays !== undefined && client.creditDays !== null ? String(client.creditDays) : '');
    setShowAddModal(true);
  };

  const handleDownloadStatement = (client: Client) => {
    const cName = client.name.toLowerCase().trim();
    const clientWeighings = weighings.filter(w => w.clientId === client.id || (w.clientName && w.clientName.toLowerCase().trim() === cName));
    const clientPayments = payments.filter(p => p.clientId === client.id || (p.clientName && p.clientName.toLowerCase().trim() === cName));
    generateStatementPDF(client, clientWeighings, clientPayments, activeCompany || undefined);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card for Clients Manager */}
      <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl shadow-sm text-white space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl border border-blue-400">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  JEANPIERE BARBOZA • 2026
                </span>
                <span className="text-xs text-slate-400 font-medium">• Directorio Empresarial</span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase">
                Cartera de Clientes y Límites de Crédito
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
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 border border-blue-400 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente por nombre, teléfono o email..."
          className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const clientWeighings = weighings.filter(w => w.clientId === client.id);
          const totalDebt = clientWeighings.reduce((sum, w) => sum + (w.pendingAmount || 0), 0);
          const isOverLimit = totalDebt > client.creditLimit;

          return (
            <div 
              key={client.id}
              className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-3xl p-5 shadow-xs space-y-4 relative flex flex-col justify-between transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{client.name}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      Crédito: {client.creditDays} días
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(client)}
                      title="Editar Cliente"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClient(client)}
                      title="Eliminar Cliente"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Límite de Crédito:</span>
                    <span className="font-bold text-slate-800">S/ {client.creditLimit.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 font-medium">Saldo Pendiente:</span>
                    <span className={`font-mono ${totalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      S/ {totalDebt.toFixed(2)}
                    </span>
                  </div>

                  {isOverLimit && (
                    <div className="flex items-center space-x-1 text-[10px] text-rose-700 font-semibold bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      <span>¡Superó el límite de crédito configurado!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Statement Button */}
              <button
                onClick={() => handleDownloadStatement(client)}
                className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-colors border border-slate-200"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Estado de Cuenta (PDF)</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Client */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200/90 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente Comercial'}
            </h2>

            <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Distribuidora San Juan"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 987-654-321"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="compras@..."
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Dirección</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mercado Mayorista Galpón B"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Límite de Crédito (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="3000.00"
                    className="w-full bg-slate-50 border border-slate-300 text-emerald-700 font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Días de Crédito</label>
                  <input
                    type="number"
                    value={creditDays}
                    onChange={(e) => setCreditDays(e.target.value)}
                    placeholder="15"
                    className="w-full bg-slate-50 border border-slate-300 text-amber-700 font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
