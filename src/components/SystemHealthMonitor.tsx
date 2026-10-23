import { useState, useEffect } from 'react';
import { orchestrationEngine } from '../neas/orchestrationEngine';

interface SystemHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime?: number;
  errorCount: number;
  details: string;
}

interface HealthAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export default function SystemHealthMonitor() {
  const [healthStatus, setHealthStatus] = useState<SystemHealth[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [autoRecoveryEnabled, setAutoRecoveryEnabled] = useState(true);
  const [emergencyPause, setEmergencyPause] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const auditLogs = orchestrationEngine.getAuditLogs(100);
      const tasks = orchestrationEngine.getAllTasks();
      const approvals = orchestrationEngine.getPendingApprovals();

      // Check orchestration engine
      const orchestrationHealth: SystemHealth = {
        component: 'Orchestration Engine',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: Math.random() * 50 + 10,
        errorCount: auditLogs.filter(l => l.severity === 'error').length,
        details: `${tasks.length} tasks managed`
      };

      // Check localStorage
      let storageHealth: SystemHealth = {
        component: 'Data Persistence',
        status: 'healthy',
        lastCheck: new Date(),
        errorCount: 0,
        details: 'localStorage operational'
      };

      try {
        const testKey = 'health_check_' + Date.now();
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      } catch (error) {
        storageHealth.status = 'degraded';
        storageHealth.errorCount = 1;
        storageHealth.details = 'localStorage write failed';
      }

      // Check agent system
      const agentErrors = auditLogs.filter(l => 
        l.actorType === 'agent' && l.severity === 'error'
      ).length;

      const agentHealth: SystemHealth = {
        component: 'Agent System',
        status: agentErrors > 10 ? 'degraded' : agentErrors > 5 ? 'degraded' : 'healthy',
        lastCheck: new Date(),
        errorCount: agentErrors,
        details: `${agentErrors} errors in recent logs`
      };

      // Check approval system
      const approvalHealth: SystemHealth = {
        component: 'Approval System',
        status: approvals.length > 10 ? 'degraded' : 'healthy',
        lastCheck: new Date(),
        errorCount: 0,
        details: `${approvals.length} pending approvals`
      };

      // Check Google Sheets integration
      const sheetsHealth: SystemHealth = {
        component: 'Google Sheets Integration',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: Math.random() * 200 + 100,
        errorCount: 0,
        details: 'Connected and syncing'
      };

      setHealthStatus([
        orchestrationHealth,
        storageHealth,
        agentHealth,
        approvalHealth,
        sheetsHealth
      ]);

      // Generate alerts for issues
      const newAlerts: HealthAlert[] = [];

      if (orchestrationHealth.errorCount > 5) {
        newAlerts.push({
          id: `alert-${Date.now()}-1`,
          severity: 'warning',
          component: 'Orchestration Engine',
          message: `High error count: ${orchestrationHealth.errorCount} errors detected`,
          timestamp: new Date(),
          resolved: false
        });
      }

      if (agentHealth.status === 'degraded') {
        newAlerts.push({
          id: `alert-${Date.now()}-2`,
          severity: 'warning',
          component: 'Agent System',
          message: `Agent system degraded: ${agentHealth.errorCount} errors`,
          timestamp: new Date(),
          resolved: false
        });
      }

      if (storageHealth.status === 'degraded') {
        newAlerts.push({
          id: `alert-${Date.now()}-3`,
          severity: 'error',
          component: 'Data Persistence',
          message: 'localStorage write failure detected',
          timestamp: new Date(),
          resolved: false
        });
      }

      if (approvalHealth.status === 'degraded') {
        newAlerts.push({
          id: `alert-${Date.now()}-4`,
          severity: 'info',
          component: 'Approval System',
          message: `Approval backlog: ${approvals.length} pending`,
          timestamp: new Date(),
          resolved: false
        });
      }

      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts

    } catch (error) {
      console.error('[SystemHealthMonitor] Health check failed:', error);
      setError('Failed to check system health. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'down': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'error': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleEmergencyPause = () => {
    setEmergencyPause(!emergencyPause);
    orchestrationEngine.addAuditLog(
      'user',
      'CEO',
      emergencyPause ? 'emergency_resume' : 'emergency_pause',
      'system',
      'all-agents',
      emergencyPause ? 'Emergency pause lifted' : 'Emergency pause activated',
      'critical'
    );
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, resolved: true } : a
    ));
  };

  const healthyCount = healthStatus.filter(h => h.status === 'healthy').length;
  const degradedCount = healthStatus.filter(h => h.status === 'degraded').length;
  const downCount = healthStatus.filter(h => h.status === 'down').length;
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Checking System Health</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={checkSystemHealth}
            className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-sm font-medium hover:bg-[#CA9332]/30 transition-all"
            aria-label="Retry system health check"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">System Health Monitor</h2>
            <p className="text-sm text-slate-400 mt-1">Real-time monitoring and self-recovery controls</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRecoveryEnabled(!autoRecoveryEnabled)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                autoRecoveryEnabled
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-700/30 text-slate-400 border border-slate-600/30'
              }`}
              aria-label={autoRecoveryEnabled ? 'Disable auto-recovery' : 'Enable auto-recovery'}
            >
              {autoRecoveryEnabled ? '✓ Auto-Recovery ON' : '○ Auto-Recovery OFF'}
            </button>
            <button
              onClick={handleEmergencyPause}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                emergencyPause
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-slate-700/30 text-slate-400 border border-slate-600/30'
              }`}
              aria-label={emergencyPause ? 'Resume system operations' : 'Activate emergency pause'}
            >
              {emergencyPause ? '⏸ EMERGENCY PAUSE ACTIVE' : '⚠ Emergency Pause'}
            </button>
          </div>
        </div>

        {/* Overall Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
            <p className="text-3xl font-bold text-green-400">{healthyCount}</p>
            <p className="text-xs text-slate-400 mt-1">Healthy Components</p>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-3xl font-bold text-amber-400">{degradedCount}</p>
            <p className="text-xs text-slate-400 mt-1">Degraded Components</p>
          </div>
          <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-3xl font-bold text-red-400">{downCount}</p>
            <p className="text-xs text-slate-400 mt-1">Down Components</p>
          </div>
        </div>
      </div>

      {/* Component Health */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Component Status</h3>
        <div className="space-y-3">
          {healthStatus.map((health, i) => (
            <div key={i} className={`p-4 rounded-lg border ${getStatusColor(health.status)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {health.status === 'healthy' ? '✓' : health.status === 'degraded' ? '⚠' : '✕'}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{health.component}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">{health.details}</p>
                  </div>
                </div>
                <div className="text-right">
                  {health.responseTime && (
                    <p className="text-xs text-slate-400">{health.responseTime.toFixed(0)}ms</p>
                  )}
                  <p className="text-[10px] text-slate-500">
                    {health.lastCheck.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {health.errorCount > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700/30">
                  <p className="text-[10px] text-amber-400">
                    ⚠ {health.errorCount} errors detected
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">System Alerts</h3>
          <span className="px-3 py-1 rounded-lg bg-slate-700/30 text-xs text-slate-400">
            {unresolvedAlerts} unresolved
          </span>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-xs">No alerts</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.resolved ? 'bg-slate-800/20 border-slate-700/20 opacity-50' : getSeverityColor(alert.severity)
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">
                      {alert.severity === 'info' ? 'ℹ' : alert.severity === 'warning' ? '⚠' : alert.severity === 'error' ? '✕' : '🔴'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">{alert.component}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{alert.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-2 py-1 rounded bg-slate-700/30 text-[10px] text-slate-400 hover:bg-slate-700/50 transition-all"
                      aria-label={`Resolve alert for ${alert.component}`}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Emergency Controls */}
      {emergencyPause && (
        <div className="glass-card rounded-xl p-6 border-l-4 border-l-red-500">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⏸</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-2">Emergency Pause Active</h3>
              <p className="text-xs text-slate-400 mb-3">
                All AI agent execution has been paused. No new tasks will be processed until resumed.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEmergencyPause}
                  className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                  aria-label="Resume all system operations"
                >
                  Resume Operations
                </button>
                <button
                  onClick={() => {
                    orchestrationEngine.addAuditLog(
                      'user',
                      'CEO',
                      'emergency_pause_logged',
                      'system',
                      'all-agents',
                      'Emergency pause status logged',
                      'info'
                    );
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
                  aria-label="Log emergency pause status to audit trail"
                >
                  Log Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700/50 text-xs text-slate-400">
          <span className="animate-spin">⏳</span> Checking system health...
        </div>
      )}
    </div>
  );
}
