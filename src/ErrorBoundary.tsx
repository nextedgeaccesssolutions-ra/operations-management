import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

/**
 * Error Boundary component to catch JavaScript errors in child components.
 * Prevents "[Script error.]" from crashing the entire app.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: ''
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error but don't let "[Script error.]" crash the app
    const message = error?.message || 'Unknown error';
    
    // Ignore cross-origin script errors - they're not real failures
    if (message === 'Script error.' || message === '[Script error.]') {
      console.log('[ErrorBoundary] Ignoring cross-origin script error (this is normal)');
      // Reset the error state so the app continues
      this.setState({ hasError: false, error: null, errorInfo: '' });
      return;
    }
    
    console.error('ErrorBoundary caught an error:', message, errorInfo);
    this.setState({ 
      errorInfo: errorInfo.componentStack || '' 
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleDismiss = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      // Don't show UI for cross-origin script errors
      const message = this.state.error.message || '';
      if (message === 'Script error.' || message === '[Script error.]') {
        return this.props.children;
      }

      // Show error UI for real errors
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(10, 14, 26, 0.95)',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '24px',
            backgroundColor: '#1a2236',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            color: '#e2e8f0',
            fontFamily: 'system-ui, sans-serif'
          }}>
            <h2 style={{ 
              marginTop: 0, 
              color: '#f87171',
              fontSize: '18px',
              marginBottom: '12px'
            }}>
              ⚠️ Something went wrong
            </h2>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '14px',
              lineHeight: '1.5',
              marginBottom: '16px'
            }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleDismiss}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
