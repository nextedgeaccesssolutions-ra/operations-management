import { useState, useEffect } from 'react';
import { orchestrationEngine } from '../neas/orchestrationEngine';

// Type definitions
type IntegrationCategory = 'Communication' | 'Productivity' | 'Storage' | 'Finance' | 'AI Services';
type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending' | 'configuring';

interface IntegrationPermission {
  scope: string;
  description: string;
  required: boolean;
}

interface IntegrationHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  lastChecked: Date;
  lastError?: string;
  rateLimitRemaining?: number;
}

interface ConnectionEvent {
  id: string;
  integrationId: string;
  eventType: 'connect' | 'disconnect' | 'configure' | 'test' | 'sync' | 'error';
  timestamp: Date;
  success: boolean;
  details?: string;
}

interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
  icon: string;
  lastSync?: Date;
  lastError?: string;
  health?: IntegrationHealth;
  permissions: IntegrationPermission[];
  authorizedAccount?: string;
  grantedScopes?: string[];
  configRequired: boolean;
  providerType: 'oauth' | 'api-key' | 'bot';
}

// Initial integration registry
const initialIntegrations: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail API',
    category: 'Communication',
    status: 'disconnected',
    description: 'Company email integration for automated responses and lead tracking',
    icon: '📧',
    permissions: [
      { scope: 'gmail.readonly', description: 'Read email messages and threads', required: true },
      { scope: 'gmail.send', description: 'Send email messages', required: false },
      { scope: 'gmail.modify', description: 'Modify email labels and metadata', required: false }
    ],
    configRequired: true,
    providerType: 'oauth'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'Productivity',
    status: 'disconnected',
    description: 'Calendar synchronization for scheduling and reminders',
    icon: '📅',
    permissions: [
      { scope: 'calendar.readonly', description: 'View calendar events', required: true },
      { scope: 'calendar.events', description: 'Create and modify events', required: false }
    ],
    configRequired: true,
    providerType: 'oauth'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'Storage',
    status: 'disconnected',
    description: 'Document storage and file management',
    icon: '📁',
    permissions: [
      { scope: 'drive.readonly', description: 'View files and folders', required: true },
      { scope: 'drive.file', description: 'Upload and modify files', required: false }
    ],
    configRequired: true,
    providerType: 'oauth'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'Finance',
    status: 'disconnected',
    description: 'Accounting and financial management',
    icon: '💰',
    permissions: [
      { scope: 'accounting.read', description: 'Read financial data', required: true },
      { scope: 'accounting.write', description: 'Create invoices and payments', required: false }
    ],
    configRequired: true,
    providerType: 'oauth'
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    status: 'disconnected',
    description: 'Team messaging and notifications',
    icon: '💬',
    permissions: [
      { scope: 'chat:write', description: 'Post messages to channels', required: true },
      { scope: 'channels:read', description: 'View channel information', required: true }
    ],
    configRequired: true,
    providerType: 'bot'
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    category: 'AI Services',
    status: 'connected',
    description: 'AI model provider for agent intelligence',
    icon: '🤖',
    lastSync: new Date('2024-02-08T10:30:00'),
    authorizedAccount: 'neas-production',
    grantedScopes: ['chat.completions', 'embeddings'],
    permissions: [
      { scope: 'models.read', description: 'Access available models', required: true },
      { scope: 'completions.write', description: 'Generate completions', required: true }
    ],
    health: {
      status: 'healthy',
      latency: 245,
      lastChecked: new Date(),
      rateLimitRemaining: 4850
    },
    configRequired: false,
    providerType: 'api-key'
  }
];

export default function IntegrationsModule() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showHealthDetails, setShowHealthDetails] = useState(false);
  const [connectionEvents, setConnectionEvents] = useState<ConnectionEvent[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calculate summary metrics dynamically
  const summaryMetrics = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    disconnected: integrations.filter(i => i.status === 'disconnected').length,
    errors: integrations.filter(i => i.status === 'error').length
  };

  // Filter integrations by category
  const filteredIntegrations = integrations.filter(i => 
    filterCategory === 'all' || i.category === filterCategory
  );

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(integrations.map(i => i.category)))];

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Log connection event
  const logConnectionEvent = (integrationId: string, eventType: ConnectionEvent['eventType'], success: boolean, details?: string) => {
    const event: ConnectionEvent = {
      id: `event-${Date.now()}`,
      integrationId,
      eventType,
      timestamp: new Date(),
      success,
      details
    };
    setConnectionEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
    
    // Also log to audit system
    orchestrationEngine.addAuditLog(
      'user',
      'CEO',
      `integration_${eventType}`,
      'integration',
      integrationId,
      `${eventType} ${success ? 'succeeded' : 'failed'}${details ? ': ' + details : ''}`,
      success ? 'info' : 'error'
    );
  };

  // Connect integration
  const handleConnect = async (integration: Integration) => {
    if (integration.configRequired) {
      setSelectedIntegration(integration);
      setShowConfigDialog(true);
      return;
    }

    try {
      // Simulate connection
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id ? { ...i, status: 'configuring' as IntegrationStatus } : i
      ));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIntegrations(prev => prev.map(i => 
        i.id === integration.id ? {
          ...i,
          status: 'connected' as IntegrationStatus,
          lastSync: new Date(),
          health: {
            status: 'healthy',
            latency: Math.floor(Math.random() * 200) + 100,
            lastChecked: new Date()
          }
        } : i
      ));

      logConnectionEvent(integration.id, 'connect', true);
      showNotification('success', `${integration.name} connected successfully`);
    } catch (error) {
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id ? { ...i, status: 'error' as IntegrationStatus, lastError: 'Connection failed' } : i
      ));
      logConnectionEvent(integration.id, 'connect', false, 'Connection failed');
      showNotification('error', `Failed to connect ${integration.name}`);
    }
  };

  // Disconnect integration
  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to disconnect ${integration.name}? This will stop all automated operations.`)) {
      return;
    }

    try {
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id ? { ...i, status: 'disconnected' as IntegrationStatus, health: undefined } : i
      ));

      logConnectionEvent(integration.id, 'disconnect', true);
      showNotification('success', `${integration.name} disconnected`);
    } catch (error) {
      logConnectionEvent(integration.id, 'disconnect', false, 'Disconnect failed');
      showNotification('error', `Failed to disconnect ${integration.name}`);
    }
  };

  // Test connection
  const handleTestConnection = async (integration: Integration) => {
    try {
      showNotification('success', `Testing ${integration.name} connection...`);
      
      // Simulate test
      await new Promise(resolve => setTimeout(resolve, 1000));

      const latency = Math.floor(Math.random() * 200) + 100;
      
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id ? {
          ...i,
          health: {
            status: 'healthy',
            latency,
            lastChecked: new Date(),
            rateLimitRemaining: Math.floor(Math.random() * 1000) + 4000
          }
        } : i
      ));

      logConnectionEvent(integration.id, 'test', true, `Latency: ${latency}ms`);
      showNotification('success', `${integration.name} connection test successful (${latency}ms)`);
    } catch (error) {
      logConnectionEvent(integration.id, 'test', false, 'Test failed');
      showNotification('error', `${integration.name} connection test failed`);
    }
  };

  // Save configuration
  const handleSaveConfig = async (config: any) => {
    if (!selectedIntegration) return;

    try {
      setIntegrations(prev => prev.map(i => 
        i.id === selectedIntegration.id ? {
          ...i,
          status: 'connected' as IntegrationStatus,
          lastSync: new Date(),
          authorizedAccount: config.account,
          grantedScopes: config.scopes,
          configRequired: false,
          health: {
            status: 'healthy',
            latency: Math.floor(Math.random() * 200) + 100,
            lastChecked: new Date()
          }
        } : i
      ));

      logConnectionEvent(selectedIntegration.id, 'configure', true);
      showNotification('success', `${selectedIntegration.name} configured successfully`);
      setShowConfigDialog(false);
      setSelectedIntegration(null);
    } catch (error) {
      logConnectionEvent(selectedIntegration.id, 'configure', false, 'Configuration failed');
      showNotification('error', `Failed to configure ${selectedIntegration.name}`);
    }
  };

  // Get status color
  const getStatusColor = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'disconnected': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'configuring': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Get health status color
  const getHealthColor = (health?: IntegrationHealth) => {
    if (!health) return 'text-slate-500';
    switch (health.status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-amber-400';
      case 'down': return 'text-red-400';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-sm text-slate-400 mt-1">System integrations and connections</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">System Online</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#CA9332]/10 border border-[#CA9332]/20">
            <span className="text-xs text-[#EBC07E]">👤 CEO</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{summaryMetrics.total}</p>
          <p className="text-xs text-slate-400 mt-1">Total Integrations</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500">
          <p className="text-3xl font-bold text-green-400">{summaryMetrics.connected}</p>
          <p className="text-xs text-slate-400 mt-1">Connected</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-slate-500">
          <p className="text-3xl font-bold text-slate-400">{summaryMetrics.disconnected}</p>
          <p className="text-xs text-slate-400 mt-1">Disconnected</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500">
          <p className="text-3xl font-bold text-red-400">{summaryMetrics.errors}</p>
          <p className="text-xs text-slate-400 mt-1">Errors</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Filter by Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            aria-label="Filter integrations by category"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
          <div className="ml-auto text-xs text-slate-400">
            Showing {filteredIntegrations.length} of {integrations.length} integrations
          </div>
        </div>
      </div>

      {/* Integrations List */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Available Integrations</h3>
        <div className="space-y-3">
          {filteredIntegrations.map(integration => (
            <div 
              key={integration.id} 
              className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-[#CA9332]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{integration.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{integration.category}</p>
                    <p className="text-[10px] text-slate-500 mt-2">{integration.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(integration.status)}`}>
                    {integration.status.toUpperCase()}
                  </span>
                  {integration.health && (
                    <span className={`text-[10px] ${getHealthColor(integration.health)}`}>
                      {integration.health.status === 'healthy' ? '●' : integration.health.status === 'degraded' ? '◐' : '○'} 
                      {' '}{integration.health.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Health Details */}
              {integration.health && (
                <div className="mb-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                    <div>
                      <p className="text-slate-500">Latency</p>
                      <p className="text-white font-semibold">{integration.health.latency}ms</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Last Checked</p>
                      <p className="text-white font-semibold">{integration.health.lastChecked.toLocaleTimeString()}</p>
                    </div>
                    {integration.health.rateLimitRemaining && (
                      <div>
                        <p className="text-slate-500">Rate Limit</p>
                        <p className="text-white font-semibold">{integration.health.rateLimitRemaining} remaining</p>
                      </div>
                    )}
                    {integration.lastSync && (
                      <div>
                        <p className="text-slate-500">Last Sync</p>
                        <p className="text-white font-semibold">{integration.lastSync.toLocaleTimeString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                {integration.lastError && (
                  <span className="text-[10px] text-red-400">⚠ {integration.lastError}</span>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => handleTestConnection(integration)}
                        className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all"
                        aria-label={`Test ${integration.name} connection`}
                      >
                        Test
                      </button>
                      <button
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowHealthDetails(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
                        aria-label={`View ${integration.name} health details`}
                      >
                        Health
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration)}
                        className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all"
                        aria-label={`Disconnect ${integration.name}`}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleConnect(integration)}
                        disabled={integration.status === 'configuring'}
                        className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Connect ${integration.name}`}
                      >
                        {integration.status === 'configuring' ? 'Connecting...' : 'Connect'}
                      </button>
                      {integration.configRequired && (
                        <button
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setShowConfigDialog(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
                          aria-label={`Configure ${integration.name}`}
                        >
                          Configure
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Dialog */}
      {showConfigDialog && selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#CA9332]/20">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Configure {selectedIntegration.name}</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedIntegration.description}</p>
              </div>
              <button
                onClick={() => {
                  setShowConfigDialog(false);
                  setSelectedIntegration(null);
                }}
                className="text-slate-400 hover:text-white text-2xl"
                aria-label="Close configuration dialog"
              >
                ✕
              </button>
            </div>

            {/* Permissions */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Required Permissions</h3>
              <div className="space-y-2">
                {selectedIntegration.permissions.map((perm, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">{perm.scope}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{perm.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        perm.required ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {perm.required ? 'REQUIRED' : 'OPTIONAL'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Notice */}
            <div className="mb-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs text-amber-400 font-bold mb-1">⚠️ Security Notice</p>
              <p className="text-[10px] text-slate-300">
                Credentials and tokens are stored securely on the server. They are never exposed in the browser, 
                logs, or client-side storage. All operations are audited and require proper authorization.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-6 border-t border-slate-700/30">
              <button
                onClick={() => handleSaveConfig({
                  account: 'info.nextedgeaccesssolutions@gmail.com',
                  scopes: selectedIntegration.permissions.filter(p => p.required).map(p => p.scope)
                })}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all"
              >
                Save & Connect
              </button>
              <button
                onClick={() => {
                  setShowConfigDialog(false);
                  setSelectedIntegration(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Details Dialog */}
      {showHealthDetails && selectedIntegration && selectedIntegration.health && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-2xl w-full border border-[#CA9332]/20">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedIntegration.name} Health</h2>
                <p className="text-sm text-slate-400 mt-1">Connection health and performance metrics</p>
              </div>
              <button
                onClick={() => {
                  setShowHealthDetails(false);
                  setSelectedIntegration(null);
                }}
                className="text-slate-400 hover:text-white text-2xl"
                aria-label="Close health details"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 mb-1">Status</p>
                  <p className={`text-sm font-bold ${getHealthColor(selectedIntegration.health)}`}>
                    {selectedIntegration.health.status.toUpperCase()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 mb-1">Latency</p>
                  <p className="text-sm font-bold text-white">{selectedIntegration.health.latency}ms</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 mb-1">Last Checked</p>
                  <p className="text-sm font-bold text-white">
                    {selectedIntegration.health.lastChecked.toLocaleString()}
                  </p>
                </div>
                {selectedIntegration.health.rateLimitRemaining && (
                  <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-[10px] text-slate-500 mb-1">Rate Limit</p>
                    <p className="text-sm font-bold text-white">
                      {selectedIntegration.health.rateLimitRemaining} requests remaining
                    </p>
                  </div>
                )}
              </div>

              {selectedIntegration.health.lastError && (
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-[10px] text-red-400 font-bold mb-1">Last Error</p>
                  <p className="text-xs text-slate-300">{selectedIntegration.health.lastError}</p>
                </div>
              )}

              {selectedIntegration.authorizedAccount && (
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 mb-1">Authorized Account</p>
                  <p className="text-xs text-white font-mono">{selectedIntegration.authorizedAccount}</p>
                </div>
              )}

              {selectedIntegration.grantedScopes && selectedIntegration.grantedScopes.length > 0 && (
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 mb-2">Granted Scopes</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIntegration.grantedScopes.map((scope, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-slate-700/50 text-[10px] text-slate-300">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-700/30">
              <button
                onClick={() => handleTestConnection(selectedIntegration)}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all"
              >
                Test Connection
              </button>
              <button
                onClick={() => {
                  setShowHealthDetails(false);
                  setSelectedIntegration(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
