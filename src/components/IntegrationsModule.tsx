import { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  description: string;
  icon: string;
}

const sampleIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Gmail API',
    category: 'Communication',
    status: 'disconnected',
    description: 'Company email integration for automated responses and lead tracking',
    icon: '📧'
  },
  {
    id: '2',
    name: 'Google Calendar',
    category: 'Productivity',
    status: 'disconnected',
    description: 'Calendar synchronization for scheduling and reminders',
    icon: '📅'
  },
  {
    id: '3',
    name: 'Google Drive',
    category: 'Storage',
    status: 'disconnected',
    description: 'Document storage and file management',
    icon: '📁'
  },
  {
    id: '4',
    name: 'QuickBooks',
    category: 'Finance',
    status: 'disconnected',
    description: 'Accounting and financial management',
    icon: '💰'
  },
  {
    id: '5',
    name: 'Slack',
    category: 'Communication',
    status: 'disconnected',
    description: 'Team messaging and notifications',
    icon: '💬'
  },
  {
    id: '6',
    name: 'OpenAI API',
    category: 'AI Services',
    status: 'connected',
    lastSync: '2024-02-08T10:30:00',
    description: 'AI model provider for agent intelligence',
    icon: '🤖'
  }
];

export default function IntegrationsModule() {
  const [integrations] = useState<Integration[]>(sampleIntegrations);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredIntegrations = integrations.filter(i => filterCategory === 'all' || i.category === filterCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'disconnected': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const categories = ['all', ...Array.from(new Set(integrations.map(i => i.category)))];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{integrations.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Integrations</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{integrations.filter(i => i.status === 'connected').length}</p>
          <p className="text-xs text-slate-400 mt-1">Connected</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-slate-400">{integrations.filter(i => i.status === 'disconnected').length}</p>
          <p className="text-xs text-slate-400 mt-1">Disconnected</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-red-400">{integrations.filter(i => i.status === 'error').length}</p>
          <p className="text-xs text-slate-400 mt-1">Errors</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Filter by Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Integrations List */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Available Integrations</h3>
        <div className="space-y-3">
          {filteredIntegrations.map(integration => (
            <div key={integration.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{integration.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{integration.category}</p>
                    <p className="text-[10px] text-slate-500 mt-2">{integration.description}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(integration.status)}`}>
                  {integration.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                {integration.lastSync && (
                  <span className="text-[10px] text-slate-500">
                    Last sync: {new Date(integration.lastSync).toLocaleString()}
                  </span>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {integration.status === 'connected' ? (
                    <button className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all">
                      Disconnect
                    </button>
                  ) : (
                    <button className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all">
                      Connect
                    </button>
                  )}
                  <button className="px-3 py-1 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
