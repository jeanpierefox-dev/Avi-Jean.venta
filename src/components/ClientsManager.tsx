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
  FileText,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { generateStatementPDF } from '../lib/pdfGenerator';

interface ClientsManagerProps {
  onSelectTab?: (tab: string) => void;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({ onSelectTab }) => {
  const { activeCompany } = useAuth();

  const { clients, addClient, updateClient, weighings, payments } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // New Client Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(3000);
  const [creditDays, setCreditDays] = useState<number>(15);

  const companyClients = clients.filter(c => c.companyId === (activeCompany?.id || 'comp_galpon_real'));

  const filteredClients = companyClients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClient) {
      await updateClient(editingClient.id, {
        name,
        phone,
        email,
        address,
        creditLimit,
        creditDays,
      });
    } else {
      await addClient({
        companyId: activeCompany?.id || 'comp_galpon_real',
        name,
        phone,
        email,
        address,
        creditLimit,
        creditDays,
        currentBalance: 0,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCreditLimit(3000);
    setCreditDays(15);
    setEditingClient(null);
    setShowAddModal(false);
  };

  const startEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setAddress(client.address || '');
    setCreditLimit(client.creditLimit || 3000);
    setCreditDays(client.creditDays || 15);
    setShowAddModal(true);
  };

  const handleDownloadStatement = (client: Client) => {
    const clientWeighings = weighings.filter(w => w.clientId === client.id);
    const clientPayments = payments.filter(p => p.clientId === client.id);
    generateStatementPDF(client, clientWeighings, clientPayments, activeCompany || undefined);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center justify-center shrink-0"
              title="Volver al Menú"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-3 bg-blue-700/20 border border-blue-500/30 rounded-xl text-blue-400 shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Gestión de Clientes
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Directorio comercial, límites de crédito y estados de cuenta corporativos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Menú</span>
            </button>
          )}

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-blue-950 transition-transform active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente por nombre, teléfono o email..."
          className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-emerald-500"
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
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg space-y-4 relative flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white">{client.name}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      Crédito: {client.creditDays} días
                    </p>
                  </div>
                  <button
                    onClick={() => startEdit(client)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Límite de Crédito:</span>
                    <span className="font-bold text-slate-200">S/ {client.creditLimit.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Saldo Pendiente:</span>
                    <span className={`font-mono ${totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      S/ {totalDebt.toFixed(2)}
                    </span>
                  </div>

                  {isOverLimit && (
                    <div className="flex items-center space-x-1 text-[10px] text-rose-400 font-semibold bg-rose-950/60 p-1.5 rounded border border-rose-800">
                      <AlertCircle className="w-3 h-3" />
                      <span>¡Superó el límite de crédito configurado!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Statement Button */}
              <button
                onClick={() => handleDownloadStatement(client)}
                className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estado de Cuenta (PDF)</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Client */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente Commercial'}
            </h2>

            <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Distribuidora San Juan"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+51 987-654-321"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="compras@..."
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Dirección</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mercado Mayorista Galpón B"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Límite de Crédito (S/)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Días de Crédito</label>
                  <input
                    type="number"
                    value={creditDays}
                    onChange={(e) => setCreditDays(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-bold rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/40"
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
