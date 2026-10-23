import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Detailed error logging in terminal/console
    console.error('═══════════════════════════════════════════════════════');
    console.error('[Occassia Runtime ErrorBoundary Caught Exception]');
    console.error('Error:', error.name, error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('═══════════════════════════════════════════════════════');
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  public handleCopyTrace = () => {
    const trace = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(trace);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-10 max-w-xl mx-auto my-10 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20 shadow-sm">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">
            {this.props.fallbackTitle || 'Something unexpected occurred in this view'}
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6 max-w-md mx-auto leading-relaxed">
            This page hit a snag while loading. Your data is safe — please try again, and if the problem continues, contact support.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <button
              onClick={this.handleReset}
              className="ops-button primary flex items-center gap-2 text-xs"
            >
              <RefreshCw size={14} /> Try Reloading View
            </button>
            <a
              href="/dashboard"
              className="ops-button secondary flex items-center gap-2 text-xs"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </a>
          </div>

          {/* Technical details are only available in development builds */}
          {import.meta.env.DEV && (
          <div className="mt-4 pt-4 border-t border-[var(--color-line)] text-left">
            <button
              type="button"
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              className="flex items-center justify-between w-full text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition py-1"
            >
              <span className="font-semibold">Technical details & log</span>
              {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {this.state.showDetails && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 font-mono text-[11px] overflow-x-auto relative">
                <button
                  type="button"
                  onClick={this.handleCopyTrace}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Copy error details"
                >
                  {this.state.copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
                <div className="font-bold text-rose-400 mb-1">
                  {this.state.error?.name}: {this.state.error?.message}
                </div>
                <pre className="whitespace-pre-wrap leading-tight text-slate-400 text-[10px] max-h-48 overflow-y-auto">
                  {this.state.error?.stack || 'No stack trace available.'}
                </pre>
              </div>
            )}
          </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
