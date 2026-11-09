import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName?: string;
  onResetToDefaultTab?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro não tratado:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 bg-slate-800/95 border border-rose-500/40 rounded-3xl shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Instabilidade ao renderizar {this.props.tabName ? `a aba "${this.props.tabName}"` : 'este módulo'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Ocorreu um erro interno de renderização. Seus dados cadastrados, insumos e receitas continuam 100% seguros e intactos.
          </p>
          {this.state.error && (
            <div className="p-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-28">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
            {this.props.onResetToDefaultTab && (
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  this.props.onResetToDefaultTab?.();
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Balanceamento</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
