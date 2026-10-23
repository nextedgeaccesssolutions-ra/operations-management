import { useState } from 'react';
import { agents, getAgentById, type Agent, type Department } from '../neas/agentRegistry';
import { orchestrationEngine } from '../neas/orchestrationEngine';

export default function AIStaffDirectory() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<Department | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredAgents = agents.filter(agent => {
    if (filterDepartment !== 'all' && agent.department !== filterDepartment) return false;
    if (filterStatus !== 'all' && agent.status !== filterStatus) return false;
    return true;
  });

  const departments: Department[] = [
    'executive', 'operations', 'sales', 'estimating', 'finance',
    'hr', 'hse', 'customer-service', 'marketing', 'procurement'
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Department:</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="busy">Busy</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div className="ml-auto text-xs text-slate-400">
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map(agent => {
          const workload = orchestrationEngine.getAgentWorkload(agent.id);
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className="glass-card rounded-xl p-5 cursor-pointer hover:border-[#CA9332]/30 transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="text-4xl">{agent.avatar}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                  <p className="text-xs text-[#EBC07E]">{agent.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500' :
                      agent.status === 'busy' ? 'bg-amber-500' :
                      agent.status === 'idle' ? 'bg-slate-400' :
                      'bg-red-500'
                    }`} />
                    <span className="text-[10px] text-slate-400 capitalize">{agent.status}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-4 line-clamp-2">{agent.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-slate-800/30">
                  <p className="text-lg font-bold text-white">{workload.active}</p>
                  <p className="text-[10px] text-slate-500">Active</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-800/30">
                  <p className="text-lg font-bold text-white">{agent.completedTasks}</p>
                  <p className="text-[10px] text-slate-500">Completed</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-800/30">
                  <p className="text-lg font-bold text-[#EBC07E]">{agent.successRate}%</p>
                  <p className="text-[10px] text-slate-500">Success</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="capitalize">{agent.department.replace('-', ' ')}</span>
                <span className="capitalize">{agent.level}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#CA9332]/20">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{selectedAgent.avatar}</div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
                  <p className="text-sm text-[#EBC07E]">{selectedAgent.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedAgent.status === 'active' ? 'bg-green-500' :
                      selectedAgent.status === 'busy' ? 'bg-amber-500' :
                      'bg-slate-400'
                    }`} />
                    <span className="text-xs text-slate-400 capitalize">{selectedAgent.status}</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Description</h3>
                  <p className="text-xs text-slate-400">{selectedAgent.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Responsibilities</h3>
                  <ul className="space-y-1">
                    {selectedAgent.responsibilities.map((resp, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-[#CA9332] mt-0.5">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">KPIs</h3>
                  <div className="space-y-2">
                    {selectedAgent.kpis.map((kpi, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
                        <p className="text-xs text-slate-300">{kpi}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Capabilities</h3>
                  <div className="space-y-2">
                    {selectedAgent.capabilities.map(cap => (
                      <div key={cap.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-semibold text-white">{cap.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            cap.approvalLevel === 3 ? 'bg-red-500/20 text-red-400' :
                            cap.approvalLevel === 2 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            Level {cap.approvalLevel}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2">{cap.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {cap.tools.slice(0, 3).map(tool => (
                            <span key={tool} className="px-2 py-0.5 rounded bg-slate-700/50 text-[9px] text-slate-400">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Escalation Rules</h3>
                  <ul className="space-y-1">
                    {selectedAgent.escalationRules.map((rule, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">⚠</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-2xl font-bold text-white">{selectedAgent.currentTasks}</p>
                    <p className="text-[10px] text-slate-500">Current Tasks</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-2xl font-bold text-white">{selectedAgent.completedTasks}</p>
                    <p className="text-[10px] text-slate-500">Completed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <p className="text-2xl font-bold text-[#EBC07E]">{selectedAgent.successRate}%</p>
                    <p className="text-[10px] text-slate-500">Success Rate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-700/30">
              <button className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all">
                Assign Task
              </button>
              <button className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                View Tasks
              </button>
              <button className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                Send Message
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
      )}
    </div>
  );
}
