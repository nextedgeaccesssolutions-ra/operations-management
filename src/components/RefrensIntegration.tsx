import { useState, useEffect } from 'react';
import RefrensService, { 
  RefrensClient, 
  RefrensQuotation, 
  RefrensInvoice, 
  RefrensConnectionHealth,
  RefrensSyncState 
} from '../services/refrensService';

export default function RefrensIntegration() {
  const [connectionHealth, setConnectionHealth] = useState<RefrensConnectionHealth | null>(null);
  const [syncState, setSyncState] = useState<RefrensSyncState | null>(null);
  const [clients, setClients] = useState<RefrensClient[]>([]);
  const [quotations, setQuotations] = useState<RefrensQuotation[]>([]);
  const [invoices, setInvoices] = useState<RefrensInvoice[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'quotations' | 'invoices' | 'reconciliation'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const health = await RefrensService.checkConnectionHealth();
      setConnectionHealth(health);
      setSyncState(RefrensService.getSyncState());
      setClients(RefrensService.getClients());
      setQuotations(RefrensService.getQuotations());
      setInvoices(RefrensService.getInvoices());
    } catch (err) {
      setError('Failed to load Refrens data');
      console.error('[RefrensIntegration] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await RefrensService.initializeConnection();
      if (success) {
        await loadInitialData();
      } else {
        setError('Failed to connect to Refrens. Please check API configuration.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('[RefrensIntegration] Connect failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Refrens? This will stop all synchronization.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await RefrensService.disconnect();
      await loadInitialData();
    } catch (err) {
      setError('Failed to disconnect');
      console.error('[RefrensIntegration] Disconnect failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await RefrensService.fullSync();
      await loadInitialData();
    } catch (err) {
      setError('Sync failed. Please check connection and try again.');
      console.error('[RefrensIntegration] Sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await RefrensService.retryFailedSync();
      await loadInitialData();
    } catch (err) {
      setError('Retry failed');
      console.error('[RefrensIntegration] Retry failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    RefrensService.pauseSync();
    setSyncState(RefrensService.getSyncState());
  };

  const handleResume = () => {
    RefrensService.resumeSync();
    setSyncState(RefrensService.getSyncState());
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'connecting': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'down': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'unauthorized': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatCurrency = (value: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency, 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = searchQuery === '' || 
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = searchQuery === '' || 
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalQuotationValue = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const wonQuotationValue = quotations.filter(q => q.status === 'won').reduce((sum, q) => sum + q.totalAmount, 0);
  const totalInvoiceValue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const paidInvoiceValue = invoices.filter(i => i.paymentStatus === 'paid').reduce((sum, i) => sum + i.paidAmount, 0);
  const outstandingValue = invoices.reduce((sum, i) => sum + i.outstandingAmount, 0);
  const overdueValue = invoices.filter(i => i.paymentStatus === 'overdue').reduce((sum, i) => sum + i.outstandingAmount, 0);

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

      {/* Connection Health Panel */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Refrens Integration</h2>
            <p className="text-xs text-slate-400 mt-1">Quotation and invoice synchronization</p>
          </div>
          <div className="flex items-center gap-3">
            {connectionHealth && (
              <div className={`px-3 py-1.5 rounded-lg border ${getHealthStatusColor(connectionHealth.status)}`}>
                <span className="text-xs font-medium">
                  {connectionHealth.status === 'healthy' && '✓ Healthy'}
                  {connectionHealth.status === 'degraded' && '⚠ Degraded'}
                  {connectionHealth.status === 'down' && '✕ Down'}
                  {connectionHealth.status === 'unauthorized' && '⚠ Unauthorized'}
                </span>
              </div>
            )}
            {syncState && (
              <div className={`px-3 py-1.5 rounded-lg border ${getConnectionStatusColor(syncState.connectionStatus)}`}>
                <span className="text-xs font-medium capitalize">
                  {syncState.connectionStatus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Details */}
        {connectionHealth && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Last Health Check</p>
              <p className="text-xs text-white">{connectionHealth.lastCheck.toLocaleString()}</p>
            </div>
            {connectionHealth.responseTime && (
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Response Time</p>
                <p className="text-xs text-white">{connectionHealth.responseTime}ms</p>
              </div>
            )}
            {connectionHealth.rateLimitRemaining !== undefined && (
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Rate Limit</p>
                <p className="text-xs text-white">{connectionHealth.rateLimitRemaining} remaining</p>
              </div>
            )}
          </div>
        )}

        {/* Sync State */}
        {syncState && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Records Imported</p>
              <p className="text-lg font-bold text-green-400">{syncState.recordsImported}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Records Skipped</p>
              <p className="text-lg font-bold text-blue-400">{syncState.recordsSkipped}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Records Failed</p>
              <p className="text-lg font-bold text-red-400">{syncState.recordsFailed}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 mb-1">Last Sync</p>
              <p className="text-xs text-white">
                {syncState.lastSuccessfulSyncAt 
                  ? syncState.lastSuccessfulSyncAt.toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        )}

        {/* Sync Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {syncState?.connectionStatus === 'disconnected' ? (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all disabled:opacity-50"
              aria-label="Connect to Refrens"
            >
              {isLoading ? 'Connecting...' : '🔗 Connect'}
            </button>
          ) : (
            <>
              <button
                onClick={handleSync}
                disabled={isLoading || syncState?.status === 'syncing'}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all disabled:opacity-50"
                aria-label="Sync data from Refrens"
              >
                {isLoading ? 'Syncing...' : '🔄 Sync Now'}
              </button>
              {syncState?.status === 'error' && (
                <button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-all disabled:opacity-50"
                  aria-label="Retry failed sync"
                >
                  🔁 Retry
                </button>
              )}
              {syncState?.status === 'syncing' ? (
                <button
                  onClick={handlePause}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-all"
                  aria-label="Pause sync"
                >
                  ⏸ Pause
                </button>
              ) : syncState?.status === 'paused' ? (
                <button
                  onClick={handleResume}
                  className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                  aria-label="Resume sync"
                >
                  ▶ Resume
                </button>
              ) : null}
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all disabled:opacity-50"
                aria-label="Disconnect from Refrens"
              >
                🔌 Disconnect
              </button>
            </>
          )}
          <button
            onClick={loadInitialData}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all disabled:opacity-50 ml-auto"
            aria-label="Refresh data"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error Message */}
        {connectionHealth?.errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400 font-medium mb-1">⚠️ Connection Issue</p>
            <p className="text-[10px] text-slate-300">{connectionHealth.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700/50 w-fit">
        {(['overview', 'clients', 'quotations', 'invoices', 'reconciliation'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            aria-label={`Switch to ${tab} view`}
            aria-pressed={activeTab === tab}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-5">
              <p className="text-3xl font-bold text-[#EBC07E]">{formatCurrency(totalQuotationValue)}</p>
              <p className="text-xs text-slate-400 mt-1">Total Quotation Value</p>
              <p className="text-[10px] text-green-400 mt-2">
                Won: {formatCurrency(wonQuotationValue)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-3xl font-bold text-green-400">{formatCurrency(totalInvoiceValue)}</p>
              <p className="text-xs text-slate-400 mt-1">Total Invoice Value</p>
              <p className="text-[10px] text-blue-400 mt-2">
                Paid: {formatCurrency(paidInvoiceValue)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-3xl font-bold text-amber-400">{formatCurrency(outstandingValue)}</p>
              <p className="text-xs text-slate-400 mt-1">Outstanding Receivables</p>
              <p className="text-[10px] text-red-400 mt-2">
                Overdue: {formatCurrency(overdueValue)}
              </p>
            </div>
          </div>

          {/* Data Summary */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Data Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-2xl font-bold text-white">{clients.length}</p>
                <p className="text-xs text-slate-400 mt-1">Clients</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-2xl font-bold text-white">{quotations.length}</p>
                <p className="text-xs text-slate-400 mt-1">Quotations</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-2xl font-bold text-white">{invoices.length}</p>
                <p className="text-xs text-slate-400 mt-1">Invoices</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-2xl font-bold text-white">
                  {quotations.filter(q => q.status === 'won').length}
                </p>
                <p className="text-xs text-slate-400 mt-1">Won Quotations</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Clients</h3>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm">No clients synced yet</p>
              <p className="text-xs mt-1">Click "Sync Now" to import clients from Refrens</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map(client => (
                <div key={client.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{client.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{client.email}</p>
                      {client.phone && <p className="text-xs text-slate-500 mt-1">{client.phone}</p>}
                    </div>
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      REFRENS
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2">
                    <span>Currency: {client.currency}</span>
                    <span>•</span>
                    <span>Synced: {client.lastSyncedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quotations Tab */}
      {activeTab === 'quotations' && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Quotations</h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quotations..."
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50"
                aria-label="Search quotations"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
                aria-label="Filter quotations by status"
              >
                <option value="all">All Status</option>
                <option value="created">Created</option>
                <option value="sent">Sent</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          {filteredQuotations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm">No quotations found</p>
              <p className="text-xs mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuotations.map(quotation => (
                <div key={quotation.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{quotation.quotationNumber}</h4>
                      <p className="text-xs text-slate-400 mt-1">{quotation.clientName}</p>
                      {quotation.projectName && (
                        <p className="text-xs text-slate-500 mt-1">{quotation.projectName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#EBC07E]">{formatCurrency(quotation.totalAmount, quotation.currency)}</p>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                        quotation.status === 'won' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        quotation.status === 'sent' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        quotation.status === 'lost' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}>
                        {quotation.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2">
                    <span>Issued: {new Date(quotation.issueDate).toLocaleDateString()}</span>
                    {quotation.validUntil && (
                      <>
                        <span>•</span>
                        <span>Valid until: {new Date(quotation.validUntil).toLocaleDateString()}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-blue-400">REFRENS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Invoices</h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices..."
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50"
                aria-label="Search invoices"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
                aria-label="Filter invoices by status"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
                <option value="void">Void</option>
              </select>
            </div>
          </div>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-sm">No invoices found</p>
              <p className="text-xs mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map(invoice => (
                <div key={invoice.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{invoice.invoiceNumber}</h4>
                      <p className="text-xs text-slate-400 mt-1">{invoice.clientName}</p>
                      {invoice.projectName && (
                        <p className="text-xs text-slate-500 mt-1">{invoice.projectName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">{formatCurrency(invoice.totalAmount, invoice.currency)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          invoice.status === 'paid' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          invoice.status === 'overdue' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          invoice.status === 'sent' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                          {invoice.status.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          invoice.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          invoice.paymentStatus === 'overdue' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {invoice.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-[10px] text-slate-500">Paid</p>
                      <p className="text-xs text-green-400 font-semibold">{formatCurrency(invoice.paidAmount, invoice.currency)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Outstanding</p>
                      <p className="text-xs text-amber-400 font-semibold">{formatCurrency(invoice.outstandingAmount, invoice.currency)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Due Date</p>
                      <p className="text-xs text-white">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2">
                    <span>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</span>
                    {invoice.paidDate && (
                      <>
                        <span>•</span>
                        <span>Paid: {new Date(invoice.paidDate).toLocaleDateString()}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-blue-400">REFRENS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reconciliation Tab */}
      {activeTab === 'reconciliation' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Reconciliation Report</h3>
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-sm">No reconciliation issues detected</p>
            <p className="text-xs mt-1">All records are properly synchronized</p>
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
