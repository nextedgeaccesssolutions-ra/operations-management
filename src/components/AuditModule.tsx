import { useState } from 'react';
import { orchestrationEngine } from '../neas/orchestrationEngine';

export default function AuditModule() {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterActorType, setFilterActorType] = useState<string>('all');

  const auditLogs = orchestrationEngine.getAuditLogs(100);

  const filteredLogs = auditLogs.filter(log => {
    if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
    if (filterActorType !== 'all' && log.actorType !== filterActorType) return false;
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'error': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case 'user': return '👤';
      case 'agent': return '🤖';
      case 'system': return '⚙️';
      default: return '📝';
    }
  };

  const stats = {
    total: auditLogs.length,
    info: auditLogs.filter(l => l.severity === 'info').length,
    warning: auditLogs.filter(l => l.severity === 'warning').length,
    error: auditLogs.filter(l => l.severity === 'error').length,
    critical: auditLogs.filter(l => l.severity === 'critical').length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">Total Logs</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-400">{stats.info}</p>
          <p className="text-xs text-slate-400 mt-1">Info</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-amber-400">{stats.warning}</p>
          <p className="text-xs text-slate-400 mt-1">Warnings</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-orange-400">{stats.error}</p>
          <p className="text-xs text-slate-400 mt-1">Errors</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-red-400">{stats.critical}</p>
          <p className="text-xs text-slate-400 mt-1">Critical</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Severity:</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Actor Type:</label>
            <select
              value={filterActorType}
              onChange={(e) => setFilterActorType(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Actors</option>
              <option value="user">Users</option>
              <option value="agent">Agents</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="ml-auto text-xs text-slate-400">
            Showing {filteredLogs.length} of {auditLogs.length} logs
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Audit Trail</h3>
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">📝</div>
              <p>No audit logs found</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-800/20 border border-slate-700/20 hover:border-slate-600/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${getSeverityColor(log.severity)}`}>
                    <span className="text-sm">{getActorIcon(log.actorType)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-white">{log.actor}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getSeverityColor(log.severity)}`}>
                        {log.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">{log.action}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{log.details}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-700">•</span>
                      <span className="text-[9px] text-slate-500">
                        {log.resource}: {log.resourceId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
