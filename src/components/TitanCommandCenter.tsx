/**
 * PROJECT TITAN - Command Center
 * Main interface for the multi-agent orchestration system
 */

import { useState, useEffect } from 'react';
import { orchestrationEngine, type Task, type TaskStatus, type ApprovalRequest } from '../titan/orchestrationEngine';
import { agentRuntime, type AgentConfig } from '../titan/agentRuntime';

type ViewMode = 'dashboard' | 'tasks' | 'agents' | 'approvals' | 'audit';

export default function TitanCommandCenter() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setTasks(orchestrationEngine.getTasksByStatus('RUNNING'));
    setAgents(agentRuntime.getAllAgents());
    setApprovals(orchestrationEngine.getPendingApprovals());
  };

  const handleCreateTask = async () => {
    setLoading(true);
    try {
      const task = await orchestrationEngine.createTask({
        organizationId: 'neas',
        createdByUserId: 'user-1',
        taskType: 'project_analysis',
        title: 'New Project Analysis',
        objective: 'Analyze project feasibility and provide recommendations',
        priority: 'medium',
        actionClassification: 'B',
      });
      
      setTasks([...tasks, task]);
      setSelectedTask(task);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTask = async (taskId: string) => {
    setLoading(true);
    try {
      await orchestrationEngine.updateTaskStatus(taskId, 'APPROVED', 'user', 'user-1');
      loadData();
    } catch (error) {
      console.error('Failed to approve task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAgent = async (agentId: string, taskId: string) => {
    setLoading(true);
    try {
      const task = orchestrationEngine.getTask(taskId);
      if (!task) throw new Error('Task not found');

      await orchestrationEngine.updateTaskStatus(taskId, 'RUNNING', 'system', 'orchestrator');
      
      const result = await agentRuntime.executeAgent(agentId, {
        task,
        messages: [],
        previousRuns: [],
        organizationId: task.organizationId,
        userId: task.createdByUserId,
      });

      if (result.success) {
        await orchestrationEngine.updateTaskStatus(taskId, 'COMPLETED', 'agent', agentId);
      } else {
        await orchestrationEngine.updateTaskStatus(taskId, 'FAILED', 'agent', agentId);
      }

      loadData();
    } catch (error) {
      console.error('Failed to execute agent:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
                🏛️
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">PROJECT TITAN</h1>
                <p className="text-xs text-slate-400">Multi-Agent Orchestration Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
                <span className="text-[10px] text-green-400 font-medium">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1">
            {[
              { id: 'dashboard' as ViewMode, icon: '📊', label: 'Dashboard' },
              { id: 'tasks' as ViewMode, icon: '📋', label: 'Tasks' },
              { id: 'agents' as ViewMode, icon: '🤖', label: 'Agents' },
              { id: 'approvals' as ViewMode, icon: '✓', label: 'Approvals' },
              { id: 'audit' as ViewMode, icon: '📝', label: 'Audit Log' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all border-b-2 ${
                  viewMode === item.id
                    ? 'text-purple-300 border-purple-500'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {viewMode === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            agents={agents}
            approvals={approvals}
            onCreateTask={handleCreateTask}
            loading={loading}
          />
        )}

        {viewMode === 'tasks' && (
          <TasksView
            tasks={tasks}
            selectedTask={selectedTask}
            onSelectTask={setSelectedTask}
            onApproveTask={handleApproveTask}
            onExecuteAgent={handleExecuteAgent}
            loading={loading}
          />
        )}

        {viewMode === 'agents' && (
          <AgentsView agents={agents} />
        )}

        {viewMode === 'approvals' && (
          <ApprovalsView
            approvals={approvals}
            onApprove={handleApproveTask}
            loading={loading}
          />
        )}

        {viewMode === 'audit' && (
          <AuditView />
        )}
      </main>
    </div>
  );
}

// Dashboard View
function DashboardView({ tasks, agents, approvals, onCreateTask, loading }: {
  tasks: Task[];
  agents: AgentConfig[];
  approvals: ApprovalRequest[];
  onCreateTask: () => void;
  loading: boolean;
}) {
  const stats = {
    totalTasks: tasks.length,
    runningTasks: tasks.filter(t => t.status === 'RUNNING').length,
    pendingApprovals: approvals.length,
    activeAgents: agents.length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">📋</span>
            <span className="text-3xl font-bold text-blue-400">{stats.totalTasks}</span>
          </div>
          <p className="text-xs text-slate-400">Total Tasks</p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">⚡</span>
            <span className="text-3xl font-bold text-green-400">{stats.runningTasks}</span>
          </div>
          <p className="text-xs text-slate-400">Running Tasks</p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">✓</span>
            <span className="text-3xl font-bold text-amber-400">{stats.pendingApprovals}</span>
          </div>
          <p className="text-xs text-slate-400">Pending Approvals</p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🤖</span>
            <span className="text-3xl font-bold text-purple-400">{stats.activeAgents}</span>
          </div>
          <p className="text-xs text-slate-400">Active Agents</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateTask}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300 font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : '+ Create Task'}
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Recent Tasks</h3>
        <div className="space-y-2">
          {tasks.slice(0, 5).map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
              <div className="flex-1">
                <p className="text-xs font-medium text-white">{task.title}</p>
                <p className="text-[10px] text-slate-500">{task.objective}</p>
              </div>
              <span className={`px-2 py-1 rounded text-[9px] font-semibold ${
                task.status === 'RUNNING' ? 'bg-green-500/20 text-green-400' :
                task.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tasks View
function TasksView({ tasks, selectedTask, onSelectTask, onApproveTask, onExecuteAgent, loading }: {
  tasks: Task[];
  selectedTask: Task | null;
  onSelectTask: (task: Task | null) => void;
  onApproveTask: (taskId: string) => void;
  onExecuteAgent: (agentId: string, taskId: string) => void;
  loading: boolean;
}) {
  const agents = agentRuntime.getAllAgents();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Task List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">All Tasks</h3>
          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTask?.id === task.id
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-slate-800/30 border-slate-700/20 hover:border-slate-600/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">{task.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{task.objective}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[9px] font-semibold ${
                    task.status === 'RUNNING' ? 'bg-green-500/20 text-green-400' :
                    task.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
                    task.status === 'APPROVAL_REQUIRED' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span>Priority: {task.priority}</span>
                  <span>·</span>
                  <span>Attempts: {task.attemptCount}/{task.maxAttempts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Detail */}
      <div className="space-y-4">
        {selectedTask ? (
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Task Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-500">Title</p>
                <p className="text-xs text-white">{selectedTask.title}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Objective</p>
                <p className="text-xs text-white">{selectedTask.objective}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Status</p>
                <p className="text-xs text-white">{selectedTask.status}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Priority</p>
                <p className="text-xs text-white">{selectedTask.priority}</p>
              </div>

              {selectedTask.status === 'APPROVAL_REQUIRED' && (
                <button
                  onClick={() => onApproveTask(selectedTask.id)}
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-xs text-green-300 font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Approving...' : '✓ Approve Task'}
                </button>
              )}

              {selectedTask.status === 'QUEUED' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500">Execute with Agent:</p>
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => onExecuteAgent(agent.id, selectedTask.id)}
                      disabled={loading}
                      className="w-full px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 hover:bg-purple-500/20 transition-colors disabled:opacity-50 text-left"
                    >
                      🤖 {agent.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-xs text-slate-500">Select a task to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Agents View
function AgentsView({ agents }: { agents: AgentConfig[] }) {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Registered Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{agent.name}</p>
                  <p className="text-[10px] text-slate-500">{agent.description}</p>
                </div>
              </div>
              <div className="space-y-2 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Model:</span>
                  <span className="text-slate-300">{agent.modelIdentifier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tools:</span>
                  <span className="text-slate-300">{agent.tools.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Max Iterations:</span>
                  <span className="text-slate-300">{agent.maxIterations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Timeout:</span>
                  <span className="text-slate-300">{agent.timeoutSeconds}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Approvals View
function ApprovalsView({ approvals, onApprove, loading }: {
  approvals: ApprovalRequest[];
  onApprove: (taskId: string) => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Pending Approvals</h3>
        {approvals.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3">✓</span>
            <p className="text-xs text-slate-500">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map(approval => (
              <div key={approval.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">{approval.actionType}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Task: {approval.taskId}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[9px] font-semibold ${
                    approval.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                    approval.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    approval.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {approval.riskLevel} risk
                  </span>
                </div>
                <button
                  onClick={() => onApprove(approval.taskId)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-[10px] text-green-300 font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Approving...' : '✓ Approve'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Audit View
function AuditView() {
  const auditLog = orchestrationEngine.getAuditLog();

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Audit Log</h3>
        {auditLog.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3">📝</span>
            <p className="text-xs text-slate-500">No audit events yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {auditLog.slice(0, 20).map(event => (
              <div key={event.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-white">{event.eventType}</span>
                  <span className="text-[9px] text-slate-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Actor: {event.actorType} ({event.actorId})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
