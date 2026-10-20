import { useState, useEffect } from 'react';
import GmailService, { GmailAccount, GmailConnectionHealth, GmailSyncState } from '../services/gmailService';
import { orchestrationEngine } from '../neas/orchestrationEngine';
import { formatTime, formatDateTime } from '../utils/dateFormatter';

export default function GmailAuthorization() {
  const [account, setAccount] = useState<GmailAccount | null>(null);
  const [health, setHealth] = useState<GmailConnectionHealth | null>(null);
  const [syncState, setSyncState] = useState<GmailSyncState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadGmailData();
    const interval = setInterval(loadGmailData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadGmailData = async () => {
    try {
      const acc = GmailService.getCurrentAccount();
      const h = await GmailService.checkConnectionHealth();
      const s = GmailService.getSyncState();
      
      setAccount(acc);
      setHealth(h);
      setSyncState(s);
    } catch (err) {
      console.error('[GmailAuthorization] Failed to load data:', err);
    }
  };

  const handleStartAuthorization = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const authorizedEmail = 'info.nextedgeaccesssolutions@gmail.com';
      const result = await GmailService.startOAuthAuthorization(authorizedEmail);
      
      if (result.success) {
        // BLOCKED: Cannot complete OAuth in frontend-only mode
        setError(
          'Gmail OAuth authorization requires backend implementation. ' +
          'The system cannot complete the OAuth flow without a backend proxy that handles: ' +
          '(1) Google OAuth 2.0 callback, (2) secure token storage, (3) identity verification via Gmail API. ' +
          'Please configure the backend Gmail integration before proceeding.'
        );
        
        orchestrationEngine.addAuditLog(
          'user',
          'CEO',
          'gmail_authorization_blocked',
          'integration',
          'gmail',
          'OAuth authorization blocked: backend implementation required',
          'warning',
          { authorizationId: result.authorizationId }
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start authorization');
      console.error('[GmailAuthorization] Authorization start failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail? This will stop all email synchronization.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await GmailService.disconnect();
      await loadGmailData();
      setSuccessMessage('Gmail account disconnected successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      console.error('[GmailAuthorization] Disconnect failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await GmailService.syncEmails(50);
      await loadGmailData();
      setSuccessMessage('Email synchronization completed successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      console.error('[GmailAuthorization] Sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStateColor = (state: string) => {
    switch (state) {
      case 'awaiting_authorization': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'authorized': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'syncing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'expired_authorization': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'revoked': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'disconnected': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-amber-400';
      case 'down': return 'text-red-400';
      case 'unauthorized': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success Display */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <div className="flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-400 hover:text-green-300"
              aria-label="Dismiss success message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Connection Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Gmail Authorization</h2>
            <p className="text-xs text-slate-400 mt-1">OAuth 2.0 authentication for info.nextedgeaccesssolutions@gmail.com</p>
          </div>
          <div className="flex items-center gap-3">
            {account && (
              <div className={`px-3 py-1.5 rounded-lg border ${getConnectionStateColor(account.connectionState)}`}>
                <span className="text-xs font-medium capitalize">
                  {account.connectionState.replace('_', ' ')}
                </span>
              </div>
            )}
            {health && (
              <div className={`px-3 py-1.5 rounded-lg border ${getHealthStatusColor(health.status) === 'text-green-400' ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-700/30 border-slate-600/30'}`}>
                <span className={`text-xs font-medium ${getHealthStatusColor(health.status)}`}>
                  {health.status === 'healthy' ? '● Healthy' : health.status === 'degraded' ? '◐ Degraded' : '○ Down'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        {account ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Authorized Account</p>
              <p className="text-sm text-white font-mono">{account.email}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Granted Scopes</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {account.grantedScopes.map((scope, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-700/50 text-[9px] text-slate-300">
                    {scope}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Last Sync</p>
              <p className="text-sm text-white">
                {account.lastSyncAt ? formatDateTime(account.lastSyncAt) : 'Never'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-4">
            <p className="text-xs text-amber-400 font-medium mb-1">⚠️ Backend Configuration Required</p>
            <p className="text-[10px] text-slate-300">
              Gmail integration requires backend implementation to complete OAuth 2.0 authorization for info.nextedgeaccesssolutions@gmail.com.
              The frontend cannot complete the OAuth flow without a backend proxy that handles token exchange and secure storage.
            </p>
          </div>
        )}

        {/* Health Metrics */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Last Health Check</p>
              <p className="text-xs text-white">{formatDateTime(health.lastCheck)}</p>
            </div>
            {health.responseTime && (
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Response Time</p>
                <p className="text-xs text-white">{health.responseTime}ms</p>
              </div>
            )}
            {health.rateLimitRemaining !== undefined && (
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Rate Limit</p>
                <p className="text-xs text-white">{health.rateLimitRemaining} remaining</p>
              </div>
            )}
            {health.mailboxMetadata && (
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Total Messages</p>
                <p className="text-xs text-white">{health.mailboxMetadata.totalMessages}</p>
              </div>
            )}
          </div>
        )}

        {/* Sync State */}
        {syncState && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-[10px] text-slate-500 mb-1">Emails Imported</p>
              <p className="text-lg font-bold text-green-400">{syncState.emailsImported}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-[10px] text-slate-500 mb-1">Emails Skipped</p>
              <p className="text-lg font-bold text-blue-400">{syncState.emailsSkipped}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-[10px] text-slate-500 mb-1">Emails Failed</p>
              <p className="text-lg font-bold text-red-400">{syncState.emailsFailed}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Last Successful Sync</p>
              <p className="text-xs text-white">
                {syncState.lastSuccessfulSyncAt ? formatDateTime(syncState.lastSuccessfulSyncAt) : 'Never'}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {!account ? (
            <div className="w-full p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs text-amber-400 font-medium mb-2">⚠️ Backend Implementation Required</p>
              <p className="text-[10px] text-slate-300 mb-3">
                Gmail OAuth authorization cannot be completed in frontend-only mode. The system requires:
              </p>
              <ul className="text-[10px] text-slate-400 space-y-1 mb-3">
                <li>• Backend proxy endpoint for Google OAuth 2.0 callback</li>
                <li>• Secure server-side token storage (never in localStorage)</li>
                <li>• Gmail API integration for identity verification</li>
                <li>• State/CSRF protection implementation</li>
              </ul>
              <p className="text-[10px] text-slate-500">
                Current status: <span className="text-amber-400 font-medium">Awaiting Backend Configuration</span>
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={handleSync}
                disabled={isLoading || syncState?.status === 'syncing' || health?.status !== 'healthy'}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all disabled:opacity-50"
                aria-label="Sync emails from Gmail"
                title={health?.status !== 'healthy' ? 'Connection not healthy' : ''}
              >
                {isLoading ? '⏳ Syncing...' : '🔄 Sync Now'}
              </button>
              {syncState?.status === 'error' && (
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-all disabled:opacity-50"
                  aria-label="Retry failed sync"
                >
                  🔁 Retry
                </button>
              )}
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all disabled:opacity-50"
                aria-label="Disconnect Gmail account"
              >
                🔌 Disconnect
              </button>
            </>
          )}
          <button
            onClick={loadGmailData}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all disabled:opacity-50 ml-auto"
            aria-label="Refresh data"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error Message */}
        {health?.errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400 font-medium mb-1">⚠️ Connection Issue</p>
            <p className="text-[10px] text-slate-300">{health.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700/50 text-xs text-slate-400 z-50">
          <span className="animate-spin">⏳</span> Processing...
        </div>
      )}
    </div>
  );
}
