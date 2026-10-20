import { useState, useEffect } from 'react';
import GmailService, { GmailAccount, GmailConnectionHealth, GmailSyncState } from '../services/gmailService';
import { orchestrationEngine } from '../neas/orchestrationEngine';
import { formatTime, formatDateTime } from '../utils/dateFormatter';

export default function GmailMigration() {
  const [account, setAccount] = useState<GmailAccount | null>(null);
  const [health, setHealth] = useState<GmailConnectionHealth | null>(null);
  const [syncState, setSyncState] = useState<GmailSyncState | null>(null);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [migrationComparison, setMigrationComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.error('[GmailMigration] Failed to load data:', err);
    }
  };

  const handleStartMigration = async () => {
    if (!targetEmail.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    if (!targetEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await GmailService.startAccountMigration(targetEmail);
      setMigrationComparison(result.comparison);
      setShowMigrationDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start migration');
      console.error('[GmailMigration] Migration start failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMigration = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would trigger OAuth flow
      // For now, we'll simulate the authorization
      const oauthCode = 'simulated-oauth-code';
      const state = 'simulated-state';
      
      await GmailService.completeOAuthAuthorization(
        migrationComparison.migrationId || 'migration-simulated',
        oauthCode,
        state
      );

      // Verify the account
      const verification = await GmailService.verifyRealAccount();
      
      if (verification.success) {
        // Sync emails
        await GmailService.syncEmails(50);
        
        // Reload data
        await loadGmailData();
        
        setShowMigrationDialog(false);
        setTargetEmail('');
        setMigrationComparison(null);
      } else {
        setError('Account verification failed. Rolling back to demo mode.');
        await GmailService.rollbackToDemo();
        await loadGmailData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
      console.error('[GmailMigration] Migration failed:', err);
      
      // Rollback on error
      try {
        await GmailService.rollbackToDemo();
        await loadGmailData();
      } catch (rollbackErr) {
        console.error('[GmailMigration] Rollback failed:', rollbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelMigration = async () => {
    setShowMigrationDialog(false);
    setTargetEmail('');
    setMigrationComparison(null);
    setError(null);
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail? This will stop email synchronization.')) {
      return;
    }

    setIsLoading(true);
    try {
      await GmailService.disconnect();
      await GmailService.rollbackToDemo();
      await loadGmailData();
    } catch (err) {
      setError('Failed to disconnect');
      console.error('[GmailMigration] Disconnect failed:', err);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      console.error('[GmailMigration] Sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await GmailService.retryFailedSync();
      await loadGmailData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
      console.error('[GmailMigration] Retry failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStateColor = (state: string) => {
    switch (state) {
      case 'demo': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
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

  if (!account || !health || !syncState) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-slate-400">Loading Gmail integration...</p>
        </div>
      </div>
    );
  }

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

      {/* Connection Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Gmail Integration</h2>
            <p className="text-sm text-slate-400 mt-1">Email synchronization and management</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border ${getConnectionStateColor(account.connectionState)}`}>
              <span className="text-xs font-medium capitalize">
                {account.connectionState.replace('_', ' ')}
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border ${getHealthStatusColor(health.status) === 'text-green-400' ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-700/30 border-slate-600/30'}`}>
              <span className={`text-xs font-medium ${getHealthStatusColor(health.status)}`}>
                {health.status === 'healthy' ? '● Healthy' : health.status === 'degraded' ? '◐ Degraded' : '○ Down'}
              </span>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <p className="text-[10px] text-slate-500 mb-1">Authorized Account</p>
            <p className="text-sm text-white font-mono">{account.email}</p>
            {account.isDemo && (
              <p className="text-[9px] text-amber-400 mt-1">⚠️ Demo Account</p>
            )}
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

        {/* Health Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <p className="text-[10px] text-slate-500 mb-1">Response Time</p>
            <p className="text-lg font-bold text-white">{health.responseTime || 'N/A'}ms</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <p className="text-[10px] text-slate-500 mb-1">Last Checked</p>
            <p className="text-sm text-white">{health.lastCheck.toLocaleTimeString()}</p>
          </div>
          {health.rateLimitRemaining !== undefined && (
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Rate Limit</p>
              <p className="text-lg font-bold text-white">{health.rateLimitRemaining}</p>
            </div>
          )}
          {health.mailboxMetadata && (
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Total Messages</p>
              <p className="text-lg font-bold text-white">{health.mailboxMetadata.totalMessages}</p>
            </div>
          )}
        </div>

        {/* Sync State */}
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
            <p className="text-sm text-white">
              {syncState.lastSuccessfulSyncAt ? syncState.lastSuccessfulSyncAt.toLocaleString() : 'Never'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {account.isDemo ? (
            <>
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="company.info.nextedgeaccesssolutions@gmail.com"
                className="flex-1 min-w-[300px] px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50"
                aria-label="Target email address for migration"
              />
              <button
                onClick={handleStartMigration}
                disabled={isLoading || !targetEmail.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Migrate to real Gmail account"
              >
                {isLoading ? '⏳ Migrating...' : '🔄 Migrate to Real Account'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSync}
                disabled={isLoading || syncState.status === 'syncing'}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all disabled:opacity-50"
                aria-label="Sync emails from Gmail"
              >
                {isLoading ? '⏳ Syncing...' : '🔄 Sync Now'}
              </button>
              {syncState.status === 'error' && (
                <button
                  onClick={handleRetry}
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
              <button
                onClick={async () => {
                  await GmailService.rollbackToDemo();
                  await loadGmailData();
                }}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all disabled:opacity-50"
                aria-label="Rollback to demo mode"
              >
                ↩️ Rollback to Demo
              </button>
            </>
          )}
        </div>

        {/* Error Message */}
        {health.errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400 font-medium mb-1">⚠️ Connection Issue</p>
            <p className="text-[10px] text-slate-300">{health.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Migration Dialog */}
      {showMigrationDialog && migrationComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-2xl w-full border border-[#CA9332]/20">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Account Migration</h2>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-bold mb-2">⚠️ Migration Summary</p>
                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong>From:</strong> {account.email} (Demo)</p>
                  <p><strong>To:</strong> {targetEmail} (Real)</p>
                  <p><strong>Demo Records:</strong> {migrationComparison.demoRecords}</p>
                  <p><strong>Sync Mode:</strong> {migrationComparison.syncMode}</p>
                  <p><strong>Scopes:</strong> {migrationComparison.scopes.join(', ')}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 font-bold mb-2">Affected Records</p>
                <ul className="space-y-1 text-xs text-slate-300">
                  {migrationComparison.affectedRecords.map((record: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#CA9332] mt-0.5">•</span>
                      <span>{record}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs text-blue-400 font-bold mb-2">ℹ️ Security Notice</p>
                <p className="text-[10px] text-slate-300">
                  OAuth tokens will be stored securely on the server. No credentials will be exposed in the browser, 
                  localStorage, or logs. All operations will be audited. You can rollback to demo mode at any time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirmMigration}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50"
                aria-label="Confirm migration"
              >
                {isLoading ? '⏳ Migrating...' : '✓ Confirm Migration'}
              </button>
              <button
                onClick={handleCancelMigration}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all disabled:opacity-50"
                aria-label="Cancel migration"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700/50 text-xs text-slate-400 z-50">
          <span className="animate-spin">⏳</span> Processing...
        </div>
      )}
    </div>
  );
}
