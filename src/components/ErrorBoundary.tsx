import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('avis_current_user');
      localStorage.removeItem('system_wiped');
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Carga del Sistema
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                El sistema experimentó un inconveniente temporal de renderizado.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 text-slate-300 p-3 rounded-xl text-[11px] font-mono text-left max-h-32 overflow-y-auto break-words">
                {this.state.error.toString()}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar Carga del Sistema</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 border border-slate-700 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Limpiar Sesión y Reiniciar</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-medium">
              JBALANCE CONTROL • Todos sus datos e historial en la nube permanecen seguros.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
