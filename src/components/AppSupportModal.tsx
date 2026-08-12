import React, { useState } from 'react';
import { X, MessageCircle, Phone, HelpCircle, ShieldCheck, ExternalLink, Check, Copy, Zap, Info } from 'lucide-react';
import { useData } from '../context/DataContext';

interface AppSupportModalProps {
  onClose: () => void;
}

export const AppSupportModal: React.FC<AppSupportModalProps> = ({ onClose }) => {
  const { supportPhone, appName } = useData();
  const [copied, setCopied] = useState(false);

  const cleanPhone = (supportPhone || '+51 987 654 321').replace(/\D/g, '');
  const displayPhone = supportPhone || '+51 987 654 321';

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(displayPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(`Hola Soporte General de ${appName || 'JBalance App'}, requiero asistencia técnica.`);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-950 to-teal-950 border-b border-emerald-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Soporte General 24/7
                </span>
              </div>
              <h2 className="font-extrabold text-base text-white mt-0.5">
                Soporte Técnico de la Plataforma
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Main WhatsApp Card */}
          <div className="bg-gradient-to-br from-emerald-900/60 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-inner">
              <Phone className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs text-slate-300 font-medium">Línea Oficial de WhatsApp de la App:</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-wider mt-1">
                {displayPhone}
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Abrir WhatsApp de Soporte</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <button
                onClick={handleCopyPhone}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Número'}</span>
              </button>
            </div>
          </div>

          {/* Frequent Topics */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>¿En qué le podemos ayudar en Soporte General?</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <a
                href={`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent('Hola, necesito ayuda para ingresar a mi cuenta / cambiar contraseña.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 flex items-start space-x-2 group transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block group-hover:text-emerald-300">Acceso a Cuenta y Usuarios</span>
                  <span className="text-[11px] text-slate-400">Recuperar clave o configurar permisos.</span>
                </div>
              </a>

              <a
                href={`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent('Hola, requiero soporte para la conexión con balanza digital / impresión.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 flex items-start space-x-2 group transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block group-hover:text-amber-300">Básculas e Impresoras</span>
                  <span className="text-[11px] text-slate-400">Conexión RS232, USB y Bluetooth.</span>
                </div>
              </a>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Atención continua disponible. Al hacer clic en cualquiera de las opciones será derivado directamente al WhatsApp del equipo técnico.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};
