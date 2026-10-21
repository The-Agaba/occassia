import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught runtime error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {this.props.fallbackTitle || 'Something unexpected occurred in this tab'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            {this.state.error?.message || 'The view encountered an error while rendering. Your data is safe.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <RefreshCw size={15} /> Try reloading tab
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={15} /> Back to dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
