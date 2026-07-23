import React, { useState } from 'react';
import { Company } from '../types';
import { Building2, ShieldCheck, ArrowRight, Plus, Search, Check, X, Eye, Sparkles } from 'lucide-react';

interface CompanySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  activeCompany: Company | null;
  onSelectCompany: (companyId: string) => void;
  onSelectGlobalAdmin: () => void;
  onCreateCompanyClick?: () => void;
}

export const CompanySelectorModal: React.FC<CompanySelectorModalProps> = ({
  isOpen,
  onClose,
  companies,
  activeCompany,
  onSelectCompany,
  onSelectGlobalAdmin,
  onCreateCompanyClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.taxId && c.taxId.includes(searchTerm))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white flex justify-between items-start shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-400/30">
                <ShieldCheck className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/50">
                  Acceso Administrador Global
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">Seleccionar Empresa o Consola</h2>
              </div>
            </div>
            <p className="text-xs text-slate-300 pt-1 font-medium">
              Elija ingresar a la Consola de Administración Global o auditar/ver los movimientos de una Empresa Comercial específica.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Option 1: Global Admin Console */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200/90 hover:border-purple-300 transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-100 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    Consola Administrador Global
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Todas las empresas
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Gestionar empresas, crear usuarios, asignar permisos y configurar el sistema.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSelectGlobalAdmin();
                  onClose();
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm shrink-0 transition-all active:scale-95"
              >
                <span>Ir a Consola Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Option 2: Select Commercial Company */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  Empresas Comerciales Registradas ({companies.length})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Seleccione una empresa para ver sus pesajes, galpones (kardex), cobro de ventas e historial.
                </p>
              </div>

              {onCreateCompanyClick && (
                <button
                  onClick={() => {
                    onClose();
                    onCreateCompanyClick();
                  }}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-purple-200 flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Empresa</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            {companies.length > 3 && (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar empresa por nombre o RUC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-purple-600 font-medium"
                />
              </div>
            )}

            {/* List of Companies */}
            {companies.length === 0 ? (
              <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-200/80 text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">No hay empresas creadas aún</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed font-medium">
                    Actualmente no existen empresas en el sistema. Ingrese a la <strong>Consola Administrador Global</strong> y cree un usuario con rol <strong>"Usuario Empresa"</strong> para generar la empresa automáticamente.
                  </p>
                </div>
                {onCreateCompanyClick && (
                  <button
                    onClick={() => {
                      onClose();
                      onCreateCompanyClick();
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs inline-flex items-center space-x-2 shadow-md transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Usuario Empresa en Consola Adm</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {filteredCompanies.map((comp) => {
                  const isSelected = activeCompany?.id === comp.id;
                  return (
                    <div
                      key={comp.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20 shadow-sm'
                          : 'bg-white border-slate-200/90 hover:border-purple-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt={comp.name}
                            className="w-10 h-10 object-contain bg-white border border-slate-200 rounded-xl p-1 shrink-0"
                          />
                        ) : (
                          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl shrink-0 font-extrabold text-xs">
                            <Building2 className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-extrabold text-xs text-slate-900 truncate">{comp.name}</h4>
                            {isSelected && (
                              <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0">
                                Activa
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono font-semibold truncate">
                            RUC: {comp.taxId || '20109283401'}
                          </p>
                          {comp.phone && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              Tel: {comp.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectCompany(comp.id);
                          onClose();
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                          isSelected
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-purple-50 text-slate-800 hover:text-purple-900 border border-slate-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-600" />
                        <span>{isSelected ? '✓ Viendo sus Movimientos' : 'Ver Movimientos de esta Empresa'}</span>
                      </button>
                    </div>
                  );
                })}

                {filteredCompanies.length === 0 && (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium">
                    No se encontraron empresas comerciales.
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold px-5 py-2 rounded-xl text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
