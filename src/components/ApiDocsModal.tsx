import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal, ShieldCheck, Database, Zap } from 'lucide-react';

interface ApiDocsModalProps {
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ onClose }) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const sampleWeighingPayload = `{
  "companyId": "comp_galpon_real",
  "clientId": "cli_san_juan",
  "chickenCount": 150,
  "grossWeight": 380.0,
  "tareWeight": 25.0,
  "unitPrice": 2.85,
  "paymentType": "credito",
  "baskets": [
    { "chickens": 30, "grossWeight": 76.0, "tareWeight": 5.0 }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                Documentación API REST AvisControl v2.5
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  OpenAPI / Swagger Specs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Especificación técnica para integración con básculas industriales, ERPs y software contable.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* Auth Spec */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Autenticación API Bearer Token</span>
            </div>
            <p className="text-slate-400">
              Todas las peticiones a la API deben incluir el encabezado HTTP Authorization con la API Key asignada a la Empresa:
            </p>
            <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-emerald-300 border border-slate-800 flex justify-between items-center">
              <code>Authorization: Bearer avis_live_sec_99182310293</code>
              <button
                onClick={() => handleCopy('Authorization: Bearer avis_live_sec_99182310293', 'auth')}
                className="text-slate-400 hover:text-white"
              >
                {copiedEndpoint === 'auth' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Endpoints Disponibles</h3>

            {/* Endpoint 1: POST /api/v1/weighings */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-600 text-white font-mono font-black px-2 py-0.5 rounded text-[10px]">POST</span>
                  <span className="font-mono text-slate-100 font-bold text-xs">/api/v1/weighings</span>
                </div>
                <span className="text-[10px] text-slate-400">Registrar Pesa &amp; Emitir Ticket</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Payload JSON de ejemplo:</span>
                <pre className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-emerald-300 border border-slate-800 overflow-x-auto">
                  {sampleWeighingPayload}
                </pre>
              </div>
            </div>

            {/* Endpoint 2: GET /api/v1/clients/{id}/statement */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-600 text-white font-mono font-black px-2 py-0.5 rounded text-[10px]">GET</span>
                  <span className="font-mono text-slate-100 font-bold text-xs">/api/v1/clients/:id/statement</span>
                </div>
                <span className="text-[10px] text-slate-400">Obtener Estado de Cuenta de Cliente</span>
              </div>
            </div>

            {/* Webhooks */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <Zap className="w-4 h-4" />
                <span>Webhooks en Tiempo Real</span>
              </div>
              <p className="text-slate-400">
                Eventos soportados para notificación HTTP POST automática: <code>ticket.created</code>, <code>payment.received</code>, <code>payment.overdue</code>.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
