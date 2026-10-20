import { orchestrationEngine } from '../neas/orchestrationEngine';
import { agents, getDepartmentStats, getAgentById } from '../neas/agentRegistry';

export default function ExecutiveCommandCenter() {
  const taskStats = orchestrationEngine.getTaskStatistics();
  const pendingApprovals = orchestrationEngine.getPendingApprovals();
  const recentAuditLogs = orchestrationEngine.getAuditLogs(10);
  const departmentStats = getDepartmentStats();

  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy').length;
  const totalTasks = taskStats.total;
  const criticalTasks = taskStats.byPriority.critical;
  const highPriorityTasks = taskStats.byPriority.high;

  return (
    <div className="space-y-6">
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
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🔴</span>
            <span className="text-xs text-red-400 font-medium">Urgent</span>
          </div>
          <p className="text-3xl font-bold text-white">{criticalTasks}</p>
          <p className="text-xs text-slate-400 mt-1">Critical Priority</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⏳</span>
            <span className="text-xs text-amber-400 font-medium">Pending</span>
          </div>
          <p className="text-3xl font-bold text-white">{pendingApprovals.length}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting Approval</p>
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
        </div>
      </div>

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
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white mb-1">{approval.taskTitle}</h4>
                      <p className="text-xs text-slate-400">{approval.actionDescription}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      approval.approvalLevel === 3 ? 'bg-red-500/20 text-red-400' :
                      approval.approvalLevel === 2 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      Level {approval.approvalLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Requested by: {approval.requestedByAgent}</span>
                    <span>•</span>
                    <span>{new Date(approval.requestedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all">
                      ✓ Approve
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all">
                      ✕ Reject
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
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
                {new Date(log.timestamp).toLocaleTimeString()}
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
      </div>
    </div>
  );
}
