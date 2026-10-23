import { useState } from 'react';
import { orchestrationEngine, type Task, type TaskStatus, type TaskPriority } from '../neas/orchestrationEngine';
import { getAgentById } from '../neas/agentRegistry';

export default function AgentTaskMonitor() {
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const allTasks = orchestrationEngine.getAllTasks();
  
  const filteredTasks = allTasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterDepartment !== 'all' && task.department !== filterDepartment) return false;
    return true;
  });

  const statusColors: Record<TaskStatus, string> = {
    queued: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    waiting_for_approval: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    blocked: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  };

  const priorityColors: Record<TaskPriority, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Status</option>
              <option value="queued">Queued</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_for_approval">Waiting for Approval</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Department:</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Departments</option>
              <option value="executive">Executive</option>
              <option value="operations">Operations</option>
              <option value="sales">Sales</option>
              <option value="estimating">Estimating</option>
              <option value="finance">Finance</option>
              <option value="hr">HR</option>
              <option value="hse">HSE</option>
              <option value="customer-service">Customer Service</option>
              <option value="marketing">Marketing</option>
              <option value="procurement">Procurement</option>
            </select>
          </div>
          <div className="ml-auto text-xs text-slate-400">
            Showing {filteredTasks.length} of {allTasks.length} tasks
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📋</span> Task Monitor
        </h3>
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const agent = getAgentById(task.assignedAgentId);
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-[#CA9332]/30 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${priorityColors[task.priority]}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${statusColors[task.status]}`}>
                    {task.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{agent?.avatar}</span>
                    <div>
                      <p className="text-xs text-white font-medium">{agent?.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{task.department.replace('-', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                    {task.dueDate && (
                      <>
                        <span>•</span>
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#CA9332] to-[#EBC07E] rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{task.progress}%</span>
                </div>

                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {task.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-slate-700/50 text-[9px] text-slate-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#CA9332]/20">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{selectedTask.title}</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${statusColors[selectedTask.status]}`}>
                    {selectedTask.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${priorityColors[selectedTask.priority]}`}>
                    {selectedTask.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Description</h3>
                <p className="text-xs text-slate-400">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Assigned To</h3>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <span className="text-2xl">{getAgentById(selectedTask.assignedAgentId)?.avatar}</span>
                    <div>
                      <p className="text-xs text-white font-medium">{getAgentById(selectedTask.assignedAgentId)?.name}</p>
                      <p className="text-[10px] text-slate-500">{getAgentById(selectedTask.assignedAgentId)?.title}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Department</h3>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-white font-medium capitalize">{selectedTask.department.replace('-', ' ')}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-2">Progress</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#CA9332] to-[#EBC07E] rounded-full"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-white font-bold">{selectedTask.progress}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Created</h3>
                  <p className="text-xs text-slate-400">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                </div>
                {selectedTask.dueDate && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Due Date</h3>
                    <p className="text-xs text-slate-400">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedTask.startedAt && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Started</h3>
                    <p className="text-xs text-slate-400">{new Date(selectedTask.startedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedTask.completedAt && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Completed</h3>
                    <p className="text-xs text-slate-400">{new Date(selectedTask.completedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedTask.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-lg bg-slate-700/50 text-xs text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-white mb-2">Approval Level</h3>
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Level {selectedTask.approvalLevel}</span>
                    {selectedTask.approvalStatus && (
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        selectedTask.approvalStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                        selectedTask.approvalStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {selectedTask.approvalStatus.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-700/30">
              {selectedTask.status === 'queued' && (
                <button
                  onClick={() => {
                    orchestrationEngine.startTask(selectedTask.id);
                    setSelectedTask(orchestrationEngine.getTask(selectedTask.id));
                  }}
                  className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                >
                  Start Task
                </button>
              )}
              {selectedTask.status === 'in_progress' && (
                <button
                  onClick={() => {
                    orchestrationEngine.completeTask(selectedTask.id);
                    setSelectedTask(orchestrationEngine.getTask(selectedTask.id));
                  }}
                  className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                >
                  Complete Task
                </button>
              )}
              <button className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                Add Note
              </button>
              <button className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                Reassign
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="ml-auto px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
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
