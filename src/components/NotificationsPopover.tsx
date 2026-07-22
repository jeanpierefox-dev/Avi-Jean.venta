import React from 'react';
import { useData } from '../context/DataContext';
import { X, Bell, Check, Trash2, AlertTriangle, Receipt, Scale, Info } from 'lucide-react';

interface NotificationsPopoverProps {
  onClose: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useData();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] mt-12">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <span className="font-extrabold text-sm text-white">Notificaciones en Tiempo Real</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearAllNotifications}
              title="Limpiar Notificaciones"
              className="text-slate-400 hover:text-rose-400 p-1 text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              No tienes notificaciones pendientes.
            </div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-all cursor-pointer ${
                n.read 
                  ? 'bg-slate-950/40 border-slate-800/60 text-slate-400' 
                  : 'bg-slate-900 border-emerald-500/50 shadow-md text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center space-x-1.5 text-white">
                  {n.type === 'overdue' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  {n.type === 'weighing' && <Scale className="w-4 h-4 text-emerald-400" />}
                  {n.type === 'payment' && <Receipt className="w-4 h-4 text-amber-400" />}
                  <span>{n.title}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">{n.message}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
