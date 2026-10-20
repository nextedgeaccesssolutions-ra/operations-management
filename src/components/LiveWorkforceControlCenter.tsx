import { useState, useEffect } from 'react';
import { agents, getAgentById } from '../neas/agentRegistry';
import { orchestrationEngine } from '../neas/orchestrationEngine';

interface AgentStatus {
  agentId: string;
  status: 'idle' | 'processing' | 'awaiting_approval' | 'blocked' | 'offline';
  currentTask?: string;
  lastHeartbeat: Date;
  lastSuccessfulJob?: Date;
  connectionHealth: 'healthy' | 'degraded' | 'offline';
  apiCalls: number;
  estimatedCost: number;
  errors: number;
  avgProcessingTime: number;
}

export default function LiveWorkforceControlCenter() {
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatus>>(new Map());
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('');

  // Simulate real-time agent status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newStatuses = new Map<string, AgentStatus>();
      
      agents.forEach(agent => {
        const tasks = orchestrationEngine.getTasksByAgent(agent.id);
        const activeTask = tasks.find(t => t.status === 'in_progress');
        const waitingTask = tasks.find(t => t.status === 'waiting_for_approval');
        
        let status: AgentStatus['status'] = 'idle';
        if (activeTask) status = 'processing';
        else if (waitingTask) status = 'awaiting_approval';
        else if (Math.random() < 0.05) status = 'blocked';
        else if (Math.random() < 0.02) status = 'offline';
        
        newStatuses.set(agent.id, {
          agentId: agent.id,
          status,
          currentTask: activeTask?.title || waitingTask?.title,
          lastHeartbeat: new Date(),
          lastSuccessfulJob: new Date(Date.now() - Math.random() * 3600000),
          connectionHealth: status === 'offline' ? 'offline' : Math.random() > 0.1 ? 'healthy' : 'degraded',
          apiCalls: Math.floor(Math.random() * 1000) + 500,
          estimatedCost: Math.random() * 50 + 10,
          errors: Math.floor(Math.random() * 5),
          avgProcessingTime: Math.random() * 30 + 5
        });
      });
      
      setAgentStatuses(newStatuses);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredAgents = agents.filter(agent => {
    if (filterStatus === 'all') return true;
    const status = agentStatuses.get(agent.id);
    return status?.status === filterStatus;
  });

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'idle': return 'bg-slate-500';
      case 'processing': return 'bg-green-500 animate-pulse';
      case 'awaiting_approval': return 'bg-amber-500 animate-pulse';
      case 'blocked': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
    }
  };

  const getHealthColor = (health: AgentStatus['connectionHealth']) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-amber-400';
      case 'offline': return 'text-red-400';
    }
  };

  const handlePauseAgent = (agentId: string) => {
    // In production, this would call an API to pause the agent
    orchestrationEngine.addAuditLog(
      'user',
      'CEO',
      'agent_paused',
      'agent',
      agentId,
      `Agent paused: ${pauseReason}`,
      'warning'
    );
    setShowPauseModal(false);
    setPauseReason('');
  };

  const handleResumeAgent = (agentId: string) => {
    orchestrationEngine.addAuditLog(
      'user',
      'CEO',
      'agent_resumed',
      'agent',
      agentId,
      'Agent resumed by CEO',
      'info'
    );
  };

  const handleCancelTask = (taskId: string) => {
    orchestrationEngine.updateTask(taskId, { status: 'cancelled' });
    orchestrationEngine.addAuditLog(
      'user',
      'CEO',
      'task_cancelled',
      'task',
      taskId,
      'Task cancelled by CEO',
      'warning'
    );
  };

  const totalApiCalls = Array.from(agentStatuses.values()).reduce((sum, s) => sum + s.apiCalls, 0);
  const totalCost = Array.from(agentStatuses.values()).reduce((sum, s) => sum + s.estimatedCost, 0);
  const totalErrors = Array.from(agentStatuses.values()).reduce((sum, s) => sum + s.errors, 0);
  const activeAgents = Array.from(agentStatuses.values()).filter(s => s.status === 'processing').length;

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🟢</span>
          </div>
          <p className="text-3xl font-bold text-white">{activeAgents}</p>
          <p className="text-xs text-slate-400 mt-1">Active Agents</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📡</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalApiCalls.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">API Calls Today</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-[#CA9332]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-white">₱{totalCost.toFixed(0)}</p>
          <p className="text-xs text-slate-400 mt-1">Estimated AI Cost</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalErrors}</p>
          <p className="text-xs text-slate-400 mt-1">Errors Today</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⏱️</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {(Array.from(agentStatuses.values()).reduce((sum, s) => sum + s.avgProcessingTime, 0) / agentStatuses.size).toFixed(1)}s
          </p>
          <p className="text-xs text-slate-400 mt-1">Avg Processing Time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
          >
            <option value="all">All Agents</option>
            <option value="idle">Idle</option>
            <option value="processing">Processing</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="blocked">Blocked</option>
            <option value="offline">Offline</option>
          </select>
          <div className="ml-auto text-xs text-slate-400">
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map(agent => {
          const status = agentStatuses.get(agent.id);
          const tasks = orchestrationEngine.getTasksByAgent(agent.id);
          const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'waiting_for_approval');
          
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className="glass-card rounded-xl p-5 cursor-pointer hover:border-[#CA9332]/30 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="text-4xl">{agent.avatar}</div>
                    {status && (
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(status.status)} border-2 border-[#071D29]`} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                    <p className="text-[10px] text-[#EBC07E]">{agent.title}</p>
                  </div>
                </div>
                {status && (
                  <span className={`text-[10px] font-medium ${getHealthColor(status.connectionHealth)}`}>
                    {status.connectionHealth === 'healthy' ? '●' : status.connectionHealth === 'degraded' ? '◐' : '○'} {status.connectionHealth}
                  </span>
                )}
              </div>

              {/* Status */}
              {status && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Status:</span>
                    <span className={`text-xs font-medium capitalize ${
                      status.status === 'processing' ? 'text-green-400' :
                      status.status === 'awaiting_approval' ? 'text-amber-400' :
                      status.status === 'blocked' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {status.status.replace('_', ' ')}
                    </span>
                  </div>
                  {status.currentTask && (
                    <p className="text-[10px] text-slate-500 truncate">Current: {status.currentTask}</p>
                  )}
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-slate-800/30">
                  <p className="text-lg font-bold text-white">{activeTasks.length}</p>
                  <p className="text-[9px] text-slate-500">Active</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-800/30">
                  <p className="text-lg font-bold text-white">{status?.apiCalls || 0}</p>
                  <p className="text-[9px] text-slate-500">API Calls</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-800/30">
                  <p className="text-lg font-bold text-[#EBC07E]">₱{(status?.estimatedCost || 0).toFixed(0)}</p>
                  <p className="text-[9px] text-slate-500">Cost</p>
                </div>
              </div>

              {/* Heartbeat */}
              {status && (
                <div className="text-[10px] text-slate-500">
                  Last heartbeat: {status.lastHeartbeat.toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (() => {
        const agent = getAgentById(selectedAgent);
        const status = agentStatuses.get(selectedAgent);
        const tasks = orchestrationEngine.getTasksByAgent(selectedAgent);
        
        if (!agent || !status) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#CA9332]/20">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">{agent.avatar}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
                    <p className="text-sm text-[#EBC07E]">{agent.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                      <span className="text-xs text-slate-400 capitalize">{status.status.replace('_', ' ')}</span>
                      <span className={`text-xs ${getHealthColor(status.connectionHealth)}`}>
                        • {status.connectionHealth}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-2xl font-bold text-white">{status.apiCalls}</p>
                  <p className="text-xs text-slate-400">API Calls Today</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-2xl font-bold text-[#EBC07E]">₱{status.estimatedCost.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">Estimated Cost</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-2xl font-bold text-red-400">{status.errors}</p>
                  <p className="text-xs text-slate-400">Errors Today</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-2xl font-bold text-blue-400">{status.avgProcessingTime.toFixed(1)}s</p>
                  <p className="text-xs text-slate-400">Avg Processing Time</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-1">Last Heartbeat</p>
                  <p className="text-sm text-white">{status.lastHeartbeat.toLocaleString()}</p>
                </div>
                {status.lastSuccessfulJob && (
                  <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Last Successful Job</p>
                    <p className="text-sm text-white">{status.lastSuccessfulJob.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Active Tasks */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3">Active Tasks</h3>
                <div className="space-y-2">
                  {tasks.filter(t => t.status === 'in_progress' || t.status === 'waiting_for_approval').map(task => (
                    <div key={task.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-white">{task.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-1">{task.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                          task.status === 'in_progress' ? 'bg-green-500/20 text-green-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#CA9332] to-[#EBC07E] rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{task.progress}%</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelTask(task.id);
                          }}
                          className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[9px] font-medium hover:bg-red-500/30 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CEO Controls */}
              <div className="flex items-center gap-3 pt-6 border-t border-slate-700/30">
                {status.status === 'processing' || status.status === 'idle' ? (
                  <button
                    onClick={() => {
                      setShowPauseModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-all"
                  >
                    ⏸ Pause Agent
                  </button>
                ) : (
                  <button
                    onClick={() => handleResumeAgent(agent.id)}
                    className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                  >
                    ▶ Resume Agent
                  </button>
                )}
                <button className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all">
                  Assign Task
                </button>
                <button className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                  View History
                </button>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="ml-auto px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full border border-[#CA9332]/20">
            <h2 className="text-xl font-bold text-white mb-4">Pause Agent</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Reason for pausing:</label>
                <textarea
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePauseAgent(selectedAgent!)}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-all"
                >
                  Pause Agent
                </button>
                <button
                  onClick={() => {
                    setShowPauseModal(false);
                    setPauseReason('');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
