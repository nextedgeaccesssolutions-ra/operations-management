import { useState } from 'react';
import { titanAgents, companies, getAgentsByLevel, getEmpireStats, type Agent } from '../titan/agentRegistry';

export default function TitanCommandCenter() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'agents' | 'companies'>('overview');
  
  const stats = getEmpireStats();
  const level2Agents = getAgentsByLevel(2);
  const level3Agents = getAgentsByLevel(3);
  const level4Agents = getAgentsByLevel(4);
  const level5Agents = getAgentsByLevel(5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border-gradient-to-r from-purple-500/20 to-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
              🏛️
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">PROJECT TITAN</h2>
              <p className="text-sm text-slate-400">Autonomous Agentic AI Empire Operating System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 status-pulse" />
              <span className="text-xs text-green-400 font-semibold">EMPIRE ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empire Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-400">{stats.companies}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Companies</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{stats.totalAgents}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">AI Agents</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{stats.activeAgents}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Active</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{stats.totalTasksCompleted}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tasks Done</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-cyan-400">{stats.totalTasksInProgress}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">In Progress</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-pink-400">{stats.totalEmployees}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Employees</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-2xl font-bold text-orange-400">₱{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Revenue</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700/50 w-fit">
        <button
          onClick={() => setSelectedView('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedView === 'overview'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
          }`}
        >
          🏛️ Overview
        </button>
        <button
          onClick={() => setSelectedView('agents')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedView === 'agents'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
          }`}
        >
          🤖 Agent Hierarchy
        </button>
        <button
          onClick={() => setSelectedView('companies')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedView === 'companies'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
          }`}
        >
          🏢 Companies
        </button>
      </div>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* AI Board of Directors */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">👔</span>
              Level 2 — AI Board of Directors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {level2Agents.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:border-purple-500/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{agent.avatar}</div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                      <p className="text-[10px] text-slate-400">{agent.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500 status-pulse' :
                      agent.status === 'busy' ? 'bg-amber-500' : 'bg-slate-500'
                    }`} />
                    <span className="text-[10px] text-slate-400 capitalize">{agent.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>✅ {agent.tasksCompleted} done</span>
                    <span>⏳ {agent.tasksInProgress} active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Executive Officers */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Level 3 — AI Executive Officers (NEAS)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {level3Agents.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:border-blue-500/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{agent.avatar}</div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{agent.name}</h4>
                      <p className="text-[9px] text-slate-400">{agent.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500 status-pulse' :
                      agent.status === 'busy' ? 'bg-amber-500' : 'bg-slate-500'
                    }`} />
                    <span className="text-[9px] text-slate-400 capitalize">{agent.status}</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {agent.department}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Companies Overview */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              Empire Companies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map(company => (
                <div key={company.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-white">{company.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                      company.status === 'active'
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    }`}>
                      {company.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-400">
                    <p>Industry: <span className="text-slate-300">{company.industry}</span></p>
                    <p>Country: <span className="text-slate-300">{company.country}</span></p>
                    <p>Employees: <span className="text-slate-300">{company.employees}</span></p>
                    <p>Revenue: <span className="text-slate-300">{company.currency} {(company.revenue / 1000000).toFixed(1)}M</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agents View */}
      {selectedView === 'agents' && (
        <div className="space-y-6">
          {/* Level 2 */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Level 2 — AI Board of Directors ({level2Agents.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {level2Agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
              ))}
            </div>
          </div>

          {/* Level 3 */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Level 3 — AI Executive Officers ({level3Agents.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {level3Agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
              ))}
            </div>
          </div>

          {/* Level 4 */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Level 4 — AI Department Directors ({level4Agents.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {level4Agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
              ))}
            </div>
          </div>

          {/* Level 5 */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Level 5 — Specialist AI Employees ({level5Agents.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {level5Agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Companies View */}
      {selectedView === 'companies' && (
        <div className="space-y-6">
          {companies.map(company => {
            const companyAgents = titanAgents.filter(a => a.company === company.id);
            return (
              <div key={company.id} className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{company.name}</h3>
                    <p className="text-xs text-slate-400">{company.industry} · {company.country}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    company.status === 'active'
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}>
                    {company.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                    <p className="text-lg font-bold text-blue-400">{company.employees}</p>
                    <p className="text-[9px] text-slate-500 uppercase">Employees</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                    <p className="text-lg font-bold text-green-400">{company.currency} {(company.revenue / 1000000).toFixed(1)}M</p>
                    <p className="text-[9px] text-slate-500 uppercase">Revenue</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                    <p className="text-lg font-bold text-purple-400">{companyAgents.length}</p>
                    <p className="text-[9px] text-slate-500 uppercase">AI Agents</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                    <p className="text-lg font-bold text-amber-400">{companyAgents.reduce((sum, a) => sum + a.tasksCompleted, 0)}</p>
                    <p className="text-[9px] text-slate-500 uppercase">Tasks Done</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {companyAgents.slice(0, 8).map(agent => (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/20 hover:border-blue-500/40 transition-all cursor-pointer"
                    >
                      <span className="text-sm">{agent.avatar}</span>
                      <span className="text-[10px] text-slate-300">{agent.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-full max-w-2xl border-purple-500/20!">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{selectedAgent.avatar}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedAgent.name}</h3>
                  <p className="text-xs text-slate-400">{selectedAgent.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-500 hover:text-slate-300 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Level</p>
                  <p className="text-sm text-white font-medium">Level {selectedAgent.level}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    selectedAgent.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    selectedAgent.status === 'busy' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      selectedAgent.status === 'active' ? 'bg-green-500 status-pulse' :
                      selectedAgent.status === 'busy' ? 'bg-amber-500' : 'bg-slate-500'
                    }`} />
                    {selectedAgent.status}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Department</p>
                <p className="text-sm text-white font-medium">{selectedAgent.department}</p>
              </div>

              {selectedAgent.currentTask && (
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Current Task</p>
                  <p className="text-sm text-white font-medium">{selectedAgent.currentTask}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Responsibilities</p>
                <ul className="space-y-1">
                  {selectedAgent.responsibilities.map((resp, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">KPIs</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.kpis.map((kpi, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300">
                      {kpi}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                  <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1">Tasks Completed</p>
                  <p className="text-2xl font-bold text-white">{selectedAgent.tasksCompleted}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Tasks In Progress</p>
                  <p className="text-2xl font-bold text-white">{selectedAgent.tasksInProgress}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:border-blue-500/40 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{agent.avatar}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white truncate">{agent.name}</h4>
          <p className="text-[9px] text-slate-400 truncate">{agent.title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${
          agent.status === 'active' ? 'bg-green-500 status-pulse' :
          agent.status === 'busy' ? 'bg-amber-500' : 'bg-slate-500'
        }`} />
        <span className="text-[9px] text-slate-400 capitalize">{agent.status}</span>
      </div>
      {agent.currentTask && (
        <p className="text-[9px] text-blue-300 truncate mb-2">📋 {agent.currentTask}</p>
      )}
      <div className="flex items-center justify-between text-[9px] text-slate-500">
        <span>✅ {agent.tasksCompleted}</span>
        <span>⏳ {agent.tasksInProgress}</span>
      </div>
    </div>
  );
}
