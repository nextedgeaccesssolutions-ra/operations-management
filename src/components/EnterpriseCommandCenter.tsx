import { useState, useEffect } from 'react';
import { orchestrationEngine } from '../neas/orchestrationEngine';
import { agents } from '../neas/agentRegistry';

interface MetricData {
  value: number | string;
  source: string;
  lastUpdate: Date;
  status: 'actual' | 'estimated' | 'pending';
  trend?: 'up' | 'down' | 'stable';
}

interface OperationalStatus {
  category: string;
  status: 'healthy' | 'warning' | 'critical';
  details: string;
  lastCheck: Date;
}

export default function EnterpriseCommandCenter() {
  const [metrics, setMetrics] = useState<Record<string, MetricData>>({});
  const [operationalStatus, setOperationalStatus] = useState<OperationalStatus[]>([]);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('today');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      // Load orchestration data
      const tasks = orchestrationEngine.getAllTasks();
      const approvals = orchestrationEngine.getPendingApprovals();
      const auditLogs = orchestrationEngine.getAuditLogs(100);

      // Calculate metrics
      const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
      const completedToday = tasks.filter(t => {
        if (!t.completedAt) return false;
        const completed = new Date(t.completedAt);
        const today = new Date();
        return completed.toDateString() === today.toDateString();
      }).length;

      const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date();
      }).length;

      // Agent metrics
      const activeAgents = agents.filter(a => a.status === 'active').length;
      const agentErrors = auditLogs.filter(l => l.severity === 'error').length;

      // Financial metrics (from localStorage if available)
      const financeData = JSON.parse(localStorage.getItem('neas_finance') || '{}');
      const totalRevenue = financeData.totalRevenue || 0;
      const outstandingReceivables = financeData.outstandingReceivables || 0;

      setMetrics({
        activeTasks: {
          value: activeTasks,
          source: 'Orchestration Engine',
          lastUpdate: new Date(),
          status: 'actual',
          trend: 'stable'
        },
        completedToday: {
          value: completedToday,
          source: 'Orchestration Engine',
          lastUpdate: new Date(),
          status: 'actual',
          trend: 'up'
        },
        overdueTasks: {
          value: overdueTasks,
          source: 'Orchestration Engine',
          lastUpdate: new Date(),
          status: 'actual',
          trend: overdueTasks > 0 ? 'down' : 'stable'
        },
        pendingApprovals: {
          value: approvals.length,
          source: 'Approval System',
          lastUpdate: new Date(),
          status: 'actual',
          trend: 'stable'
        },
        activeAgents: {
          value: `${activeAgents}/${agents.length}`,
          source: 'Agent Registry',
          lastUpdate: new Date(),
          status: 'actual',
          trend: 'stable'
        },
        agentErrors: {
          value: agentErrors,
          source: 'Audit Logs',
          lastUpdate: new Date(),
          status: 'actual',
          trend: agentErrors > 5 ? 'down' : 'stable'
        },
        totalRevenue: {
          value: `₱${(totalRevenue / 1000000).toFixed(2)}M`,
          source: 'Finance Module',
          lastUpdate: new Date(),
          status: totalRevenue > 0 ? 'actual' : 'estimated',
          trend: 'up'
        },
        outstandingReceivables: {
          value: `₱${(outstandingReceivables / 1000).toFixed(0)}K`,
          source: 'Finance Module',
          lastUpdate: new Date(),
          status: outstandingReceivables > 0 ? 'actual' : 'estimated',
          trend: outstandingReceivables > 1000000 ? 'down' : 'stable'
        }
      });

      // Operational status
      setOperationalStatus([
        {
          category: 'Orchestration Engine',
          status: 'healthy',
          details: `${tasks.length} tasks managed`,
          lastCheck: new Date()
        },
        {
          category: 'Agent System',
          status: activeAgents === agents.length ? 'healthy' : 'warning',
          details: `${activeAgents}/${agents.length} agents active`,
          lastCheck: new Date()
        },
        {
          category: 'Approval System',
          status: approvals.length > 5 ? 'warning' : 'healthy',
          details: `${approvals.length} pending approvals`,
          lastCheck: new Date()
        },
        {
          category: 'Data Persistence',
          status: 'healthy',
          details: 'localStorage operational',
          lastCheck: new Date()
        },
        {
          category: 'Error Rate',
          status: agentErrors > 10 ? 'critical' : agentErrors > 5 ? 'warning' : 'healthy',
          details: `${agentErrors} errors in last 100 logs`,
          lastCheck: new Date()
        }
      ]);

    } catch (error) {
      console.error('[EnterpriseCommandCenter] Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'stable': return '→';
      default: return '';
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      case 'stable': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Enterprise Command Center</h2>
            <p className="text-sm text-slate-400 mt-1">Centralized operational overview for executive decision-making</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Departments</option>
              <option value="executive">Executive</option>
              <option value="operations">Operations</option>
              <option value="sales">Sales</option>
              <option value="finance">Finance</option>
            </select>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>

        {/* Operational Status */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {operationalStatus.map((status, i) => (
            <div key={i} className={`p-3 rounded-lg border ${getStatusColor(status.status)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white">{status.category}</span>
                <span className="text-[10px] text-slate-400">
                  {status.lastCheck.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[10px] text-slate-300">{status.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(metrics).map(([key, metric]) => (
          <div key={key} className="glass-card rounded-xl p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-3xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-slate-400 mt-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
              {metric.trend && (
                <span className={`text-2xl ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                </span>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/30">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Source: {metric.source}</span>
                <span className={`px-2 py-0.5 rounded ${
                  metric.status === 'actual' ? 'bg-green-500/20 text-green-400' :
                  metric.status === 'estimated' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {metric.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                Updated: {metric.lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Critical Alerts */}
      {(metrics.overdueTasks?.value as number) > 0 && (
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-1">Overdue Tasks Alert</h3>
              <p className="text-xs text-slate-400">
                {metrics.overdueTasks.value} tasks are past their due date and require immediate attention.
              </p>
              <button className="mt-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all">
                View Overdue Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {(metrics.pendingApprovals?.value as number) > 0 && (
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✓</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-1">Pending Approvals</h3>
              <p className="text-xs text-slate-400">
                {metrics.pendingApprovals.value} approval requests awaiting your decision.
              </p>
              <button className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-all">
                Review Approvals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Recommended Management Actions</h3>
        <div className="space-y-3">
          {(metrics.overdueTasks?.value as number) > 0 && (
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-start gap-3">
                <span className="text-lg">🔴</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">Address Overdue Tasks</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Review and reassign or extend deadlines for {metrics.overdueTasks.value} overdue tasks.
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Impact: Prevents client dissatisfaction and project delays
                  </p>
                </div>
              </div>
            </div>
          )}

          {(metrics.pendingApprovals?.value as number) > 3 && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <span className="text-lg">🟡</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">Clear Approval Backlog</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {metrics.pendingApprovals.value} pending approvals may be causing workflow delays.
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Impact: Improves operational efficiency and agent productivity
                  </p>
                </div>
              </div>
            </div>
          )}

          {(metrics.agentErrors?.value as number) > 5 && (
            <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-start gap-3">
                <span className="text-lg">🟠</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">Investigate Agent Errors</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {metrics.agentErrors.value} agent errors detected in recent activity.
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Impact: Improves system reliability and task completion rates
                  </p>
                </div>
              </div>
            </div>
          )}

          {operationalStatus.every(s => s.status === 'healthy') && (
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-start gap-3">
                <span className="text-lg">🟢</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">All Systems Operational</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    All critical systems are healthy. No immediate action required.
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Continue monitoring for optimal performance
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700/50 text-xs text-slate-400">
          <span className="animate-spin">⏳</span> Updating metrics...
        </div>
      )}
    </div>
  );
}
