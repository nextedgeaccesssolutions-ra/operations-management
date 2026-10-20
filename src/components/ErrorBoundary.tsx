import React from 'react';
import { orchestrationEngine } from '../neas/orchestrationEngine';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    // Log to audit system
    try {
      orchestrationEngine.addAuditLog(
        'system',
        'error-boundary',
        'error_caught',
        'component',
        'error-boundary',
        `Error: ${error.message}`,
        'error',
        { stack: error.stack, componentStack: errorInfo.componentStack }
      );
    } catch (e) {
      console.error('[ErrorBoundary] Failed to log error:', e);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#071D29] to-[#0a2a3a] p-6">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full border border-red-500/30">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
              <p className="text-sm text-slate-400 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-sm font-medium hover:opacity-90 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-sm font-medium hover:bg-slate-700/50 transition-all"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
