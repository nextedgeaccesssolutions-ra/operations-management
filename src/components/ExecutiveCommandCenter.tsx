import { useState, useEffect } from 'react';
import { orchestrationEngine } from '../neas/orchestrationEngine';
import { agents, getDepartmentStats, getAgentById } from '../neas/agentRegistry';
import RefrensService from '../services/refrensService';
import { formatTime, formatDateTime, formatDate } from '../utils/dateFormatter';

interface MetricData {
  value: number | string;
  source: string;
  lastUpdated: Date;
  currency?: string;
  status: 'actual' | 'estimated' | 'pending' | 'unavailable';
}

export default function ExecutiveCommandCenter() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Refrens data
  const [refrensQuotations, setRefrensQuotations] = useState(RefrensService.getQuotations());
  const [refrensInvoices, setRefrensInvoices] = useState(RefrensService.getInvoices());
  const [refrensSyncState, setRefrensSyncState] = useState(RefrensService.getSyncState());
  
  // Filters
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'internal' | 'refrens'>('all');

  const loadData = () => {
    try {
      setIsLoading(true);
      setError(null);
      // Load Refrens data
      setRefrensQuotations(RefrensService.getQuotations());
      setRefrensInvoices(RefrensService.getInvoices());
      setRefrensSyncState(RefrensService.getSyncState());
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load executive data');
      console.error('[ExecutiveCommandCenter] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const taskStats = orchestrationEngine.getTaskStatistics();
  const pendingApprovals = orchestrationEngine.getPendingApprovals();
  const recentAuditLogs = orchestrationEngine.getAuditLogs(10);
  const departmentStats = getDepartmentStats();

  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy').length;
  const totalTasks = taskStats.total;
  const criticalTasks = taskStats.byPriority.critical;
  const highPriorityTasks = taskStats.byPriority.high;

  // Refrens financial metrics
  const refrensQuotationCount = refrensQuotations.length;
  const refrensQuotationValue = refrensQuotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const refrensWonQuotations = refrensQuotations.filter(q => q.status === 'won');
  const refrensWonValue = refrensWonQuotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const refrensInvoiceCount = refrensInvoices.length;
  const refrensInvoiceValue = refrensInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const refrensPaidValue = refrensInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const refrensOutstandingValue = refrensInvoices.reduce((sum, i) => sum + i.outstandingAmount, 0);
  const refrensOverdueInvoices = refrensInvoices.filter(i => i.paymentStatus === 'overdue');
  const refrensOverdueValue = refrensOverdueInvoices.reduce((sum, i) => sum + i.outstandingAmount, 0);

  // Format currency helper
  const formatCurrency = (value: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency, 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const handleApprove = (approvalId: string) => {
    try {
      orchestrationEngine.approveRequest(approvalId, 'CEO', 'Approved via Executive Command Center');
      loadData();
    } catch (err) {
      console.error('[ExecutiveCommandCenter] Error approving request:', err);
    }
  };

  const handleReject = (approvalId: string) => {
    try {
      orchestrationEngine.rejectRequest(approvalId, 'CEO', 'Rejected via Executive Command Center');
      loadData();
    } catch (err) {
      console.error('[ExecutiveCommandCenter] Error rejecting request:', err);
    }
  };

  const handleViewDetails = (approvalId: string) => {
    // Navigate to approval inbox with this approval selected
    // For now, just log it
    console.log('[ExecutiveCommandCenter] View details for approval:', approvalId);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Data</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-sm font-medium hover:bg-[#CA9332]/30 transition-all"
            aria-label="Retry loading data"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700/50 text-xs text-slate-400 z-50">
          <span className="animate-spin">⏳</span> Loading executive data...
        </div>
      )}

      {/* Last Refresh Indicator */}
      <div className="text-[10px] text-slate-500 text-right">
        Last updated: {formatTime(lastRefresh)}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Date Range:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
              aria-label="Filter by date range"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Department:</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              {Object.keys(departmentStats).map(dept => (
                <option key={dept} value={dept}>{dept.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Source:</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
              aria-label="Filter by data source"
            >
              <option value="all">All Sources</option>
              <option value="internal">Internal Only</option>
              <option value="refrens">Refrens Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-[#CA9332]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🤖</span>
            <span className="text-xs text-green-400 font-medium">
              {activeAgents}/{totalAgents} Active
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{totalAgents}</p>
          <p className="text-xs text-slate-400 mt-1">AI Staff Members</p>
          <p className="text-[9px] text-slate-500 mt-2">Source: Internal • Updated: {formatTime(lastRefresh)}</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📋</span>
            <span className="text-xs text-blue-400 font-medium">
              {taskStats.byStatus.inProgress} Active
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{totalTasks}</p>
          <p className="text-xs text-slate-400 mt-1">Total Tasks</p>
          <p className="text-[9px] text-slate-500 mt-2">Source: Internal • Updated: {formatTime(lastRefresh)}</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🔴</span>
            <span className="text-xs text-red-400 font-medium">Urgent</span>
          </div>
          <p className="text-3xl font-bold text-white">{criticalTasks}</p>
          <p className="text-xs text-slate-400 mt-1">Critical Priority</p>
          <p className="text-[9px] text-slate-500 mt-2">Source: Internal • Updated: {formatTime(lastRefresh)}</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⏳</span>
            <span className="text-xs text-amber-400 font-medium">Pending</span>
          </div>
          <p className="text-3xl font-bold text-white">{pendingApprovals.length}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting Approval</p>
          <p className="text-[9px] text-slate-500 mt-2">Source: Internal • Updated: {formatTime(lastRefresh)}</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">✅</span>
            <span className="text-xs text-green-400 font-medium">
              {taskStats.averageProgress.toFixed(0)}% Avg
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{taskStats.byStatus.completed}</p>
          <p className="text-xs text-slate-400 mt-1">Completed Tasks</p>
          <p className="text-[9px] text-slate-500 mt-2">Source: Internal • Updated: {formatTime(lastRefresh)}</p>
        </div>
      </div>

      {/* Refrens Financial Metrics */}
      {(sourceFilter === 'all' || sourceFilter === 'refrens') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-card rounded-xl p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📑</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                REFRENS
              </span>
            </div>
            <p className="text-3xl font-bold text-white">{refrensQuotationCount}</p>
            <p className="text-xs text-slate-400 mt-1">Quotations</p>
            <p className="text-[9px] text-slate-500 mt-2">
              Source: Refrens • Updated: {formatTime(refrensSyncState.lastSuccessfulSyncAt) || 'Never'}
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💼</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                REFRENS
              </span>
            </div>
            <p className="text-3xl font-bold text-[#EBC07E]">{formatCurrency(refrensQuotationValue)}</p>
            <p className="text-xs text-slate-400 mt-1">Quotation Pipeline</p>
            <p className="text-[9px] text-green-400 mt-2">
              Won: {formatCurrency(refrensWonValue)}
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💰</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                REFRENS
              </span>
            </div>
            <p className="text-3xl font-bold text-white">{refrensInvoiceCount}</p>
            <p className="text-xs text-slate-400 mt-1">Invoices</p>
            <p className="text-[9px] text-slate-500 mt-2">
              Source: Refrens • Updated: {formatTime(refrensSyncState.lastSuccessfulSyncAt) || 'Never'}
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💵</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                REFRENS
              </span>
            </div>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(refrensInvoiceValue)}</p>
            <p className="text-xs text-slate-400 mt-1">Invoiced Value</p>
            <p className="text-[9px] text-blue-400 mt-2">
              Paid: {formatCurrency(refrensPaidValue)}
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⏰</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                REFRENS
              </span>
            </div>
            <p className="text-3xl font-bold text-amber-400">{formatCurrency(refrensOutstandingValue)}</p>
            <p className="text-xs text-slate-400 mt-1">Outstanding Receivables</p>
            <p className="text-[9px] text-red-400 mt-2">
              Overdue: {formatCurrency(refrensOverdueValue)} ({refrensOverdueInvoices.length} invoices)
            </p>
          </div>
        </div>
      )}


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>✓</span> Pending Approvals
            </h3>
            <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium">
              {pendingApprovals.length} Pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">✓</div>
                <p>No pending approvals</p>
              </div>
            ) : (
              pendingApprovals.slice(0, 5).map(approval => (
                <div key={approval.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-[#CA9332]/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white mb-1">{approval.taskTitle}</h4>
                      <p className="text-xs text-slate-400 mb-2">{approval.actionDescription}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span>Requested by: <span className="text-white">{approval.requestedByAgent}</span></span>
                        <span>•</span>
                        <span>{formatDate(approval.requestedAt)}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          approval.approvalLevel === 3 ? 'bg-red-500/20 text-red-400' :
                          approval.approvalLevel === 2 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          Level {approval.approvalLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Financial Impact */}
                  {approval.financialImpact && (
                    <div className="mb-3 p-2 rounded bg-slate-900/30 border border-slate-700/20">
                      <p className="text-[10px] text-slate-500 mb-1">Financial Impact</p>
                      <p className="text-xs text-[#EBC07E] font-semibold">{approval.financialImpact}</p>
                    </div>
                  )}
                  
                  {/* Evidence */}
                  {approval.evidence && approval.evidence.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-slate-500 mb-1">Supporting Evidence</p>
                      <div className="flex flex-wrap gap-1">
                        {approval.evidence.map((doc, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-700/50 text-[9px] text-slate-300">
                            📎 {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Risk Level */}
                  {approval.riskLevel && (
                    <div className="mb-3">
                      <p className="text-[10px] text-slate-500 mb-1">Risk Level</p>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        approval.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                        approval.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        approval.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {approval.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3">
                    <button 
                      onClick={() => handleApprove(approval.id)}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                      aria-label={`Approve ${approval.taskTitle}`}
                    >
                      ✓ Approve
                    </button>
                    <button 
                      onClick={() => handleReject(approval.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all"
                      aria-label={`Reject ${approval.taskTitle}`}
                    >
                      ✕ Reject
                    </button>
                    <button 
                      onClick={() => handleViewDetails(approval.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
                      aria-label={`View details for ${approval.taskTitle}`}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Overview */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🏢</span> Department Overview
          </h3>
          <div className="space-y-3">
            {Object.entries(departmentStats).map(([dept, stats]) => (
              <div key={dept} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white capitalize">{dept.replace('-', ' ')}</span>
                  <span className="text-xs text-slate-400">{stats.active}/{stats.count} Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#CA9332] to-[#EBC07E] rounded-full transition-all"
                      style={{ width: `${(stats.active / stats.count) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{stats.tasks} tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📝</span> Recent Activity
        </h3>
        <div className="space-y-2">
          {recentAuditLogs.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/20 hover:bg-slate-800/30 transition-all">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                log.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                log.severity === 'error' ? 'bg-orange-500/20 text-orange-400' :
                log.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {log.actorType === 'agent' ? '🤖' : log.actorType === 'user' ? '👤' : '⚙️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-white">{log.actor}</span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-[10px] text-slate-400">{log.action}</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-500 flex-shrink-0">
                {formatTime(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* High Priority Tasks */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🔥</span> High Priority Tasks
        </h3>
        {orchestrationEngine.getTasksByPriority('critical').concat(
          orchestrationEngine.getTasksByPriority('high')
        ).length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-sm">No high priority tasks</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {orchestrationEngine.getTasksByPriority('critical').concat(
            orchestrationEngine.getTasksByPriority('high')
          ).slice(0, 6).map(task => {
            const agent = getAgentById(task.assignedAgentId);
            return (
              <div key={task.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-[#CA9332]/30 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white mb-1">{task.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    task.priority === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-lg">{agent?.avatar}</span>
                  <span className="text-xs text-slate-400">{agent?.name}</span>
                  <span className="ml-auto text-xs text-slate-500">{task.progress}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#CA9332] to-[#EBC07E] rounded-full"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
