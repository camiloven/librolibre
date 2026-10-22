import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LibroLibre ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20 text-2xl font-serif">
              📖
            </div>
            <h1 className="text-2xl font-bold font-serif mb-2 text-white">
              LibroLibre
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Hubo un inconveniente al cargar la plataforma. Puedes recargar la aplicación para continuar.
            </p>
            {this.state.error && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-left mb-6 overflow-x-auto text-xs font-mono text-rose-300">
                <p className="font-semibold text-rose-400 mb-1">Detalle del error:</p>
                <p>{this.state.error.message || String(this.state.error)}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Recargar página
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-all border border-slate-700 cursor-pointer"
              >
                Limpiar caché y reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
