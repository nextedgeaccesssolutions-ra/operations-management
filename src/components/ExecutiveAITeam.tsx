import { useState } from 'react';

// Executive AI Team Dashboard
export default function ExecutiveAITeam() {
  const [activeAgent, setActiveAgent] = useState<'chairman' | 'cfo' | 'sales' | 'operations' | 'customer'>('chairman');

  const agents = [
    { id: 'chairman', name: 'AI Chairman', role: 'Strategic Intelligence', icon: '👔', color: '#8b5cf6' },
    { id: 'cfo', name: 'AI CFO', role: 'Financial Control', icon: '💰', color: '#10b981' },
    { id: 'sales', name: 'AI Sales Director', role: 'Global Business Development', icon: '📈', color: '#f59e0b' },
    { id: 'operations', name: 'AI Operations Director', role: 'Project Delivery', icon: '⚙️', color: '#3b82f6' },
    { id: 'customer', name: 'AI Customer Operations', role: 'Global Voice & Support', icon: '🎧', color: '#ec4899' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border-purple-500/20!">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-2xl">
              🏛️
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Executive Team</h2>
              <p className="text-xs text-slate-400">Strategic intelligence and operational control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
              <span className="text-[10px] text-green-400 font-medium">All Agents Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Tabs */}
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-2 border border-slate-700/50 overflow-x-auto">
        {agents.map(agent => (
          <button
            key={agent.id}
            onClick={() => setActiveAgent(agent.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeAgent === agent.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            <span className="text-lg">{agent.icon}</span>
            <div className="text-left">
              <div>{agent.name}</div>
              <div className="text-[9px] text-slate-500">{agent.role}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Agent Content */}
      {activeAgent === 'chairman' && <ChairmanDashboard />}
      {activeAgent === 'cfo' && <CFODashboard />}
      {activeAgent === 'sales' && <SalesDashboard />}
      {activeAgent === 'operations' && <OperationsDashboard />}
      {activeAgent === 'customer' && <CustomerDashboard />}
    </div>
  );
}

// Chairman Dashboard
function ChairmanDashboard() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-purple-400">👔</span> Strategic Intelligence & Planning
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-2xl font-bold text-purple-400">12</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Strategic Initiatives</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-2xl font-bold text-blue-400">8</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Markets Analyzed</p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-2xl font-bold text-green-400">94%</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Goal Achievement</p>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-white">Current Strategic Priorities</h4>
          {[
            { title: 'Expand into Southeast Asian markets', status: 'In Progress', priority: 'High' },
            { title: 'Optimize operational efficiency by 15%', status: 'On Track', priority: 'High' },
            { title: 'Launch new service line for renewable energy', status: 'Planning', priority: 'Medium' },
            { title: 'Strengthen partnerships with key suppliers', status: 'Active', priority: 'Medium' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white font-medium">{item.title}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                  item.priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {item.priority}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Status: {item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// CFO Dashboard
function CFODashboard() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-green-400">💰</span> Financial Control & Analysis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-xl font-bold text-green-400">$2.4M</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Revenue YTD</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xl font-bold text-blue-400">$1.8M</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Expenses YTD</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-xl font-bold text-purple-400">$600K</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Net Profit</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xl font-bold text-amber-400">25%</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Margin</p>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-white">Financial Alerts</h4>
          {[
            { type: 'warning', message: '3 invoices overdue totaling $45,000', action: 'Review' },
            { type: 'info', message: 'Q4 budget forecast shows 12% growth', action: 'View' },
            { type: 'success', message: 'Project margin analysis completed', action: 'Report' },
          ].map((alert, i) => (
            <div key={i} className={`p-3 rounded-lg border ${
              alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
              alert.type === 'info' ? 'bg-blue-500/5 border-blue-500/20' :
              'bg-green-500/5 border-green-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white">{alert.message}</span>
                <button className="px-2 py-1 rounded text-[9px] bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors">
                  {alert.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sales Dashboard
function SalesDashboard() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-amber-400">📈</span> Global Sales & Business Development
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xl font-bold text-amber-400">47</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Active Leads</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xl font-bold text-blue-400">23</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Proposals Sent</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-xl font-bold text-green-400">68%</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Conversion Rate</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-xl font-bold text-purple-400">$1.2M</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Pipeline Value</p>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-white">Top Opportunities</h4>
          {[
            { client: 'ABC Corporation', value: '$250K', stage: 'Proposal', probability: '75%' },
            { client: 'XYZ Industries', value: '$180K', stage: 'Negotiation', probability: '85%' },
            { client: 'Global Tech Ltd', value: '$320K', stage: 'Qualification', probability: '45%' },
          ].map((opp, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white font-medium">{opp.client}</span>
                <span className="text-xs text-green-400 font-semibold">{opp.value}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400">Stage: {opp.stage}</span>
                <span className="text-[10px] text-blue-400">Probability: {opp.probability}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Operations Dashboard
function OperationsDashboard() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-blue-400">⚙️</span> Project Delivery & Field Operations
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xl font-bold text-blue-400">18</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Active Projects</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-xl font-bold text-green-400">92%</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">On-Time Delivery</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xl font-bold text-amber-400">156</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Field Staff</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-xl font-bold text-purple-400">4.8</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Safety Rating</p>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-white">Project Status</h4>
          {[
            { name: 'Tower Maintenance - Site A', progress: 75, status: 'On Track', risk: 'Low' },
            { name: 'Facade Restoration - Site B', progress: 45, status: 'Delayed', risk: 'Medium' },
            { name: 'Inspection Services - Site C', progress: 90, status: 'On Track', risk: 'Low' },
          ].map((project, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white font-medium">{project.name}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                  project.risk === 'Low' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {project.risk} Risk
                </span>
              </div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
                <span className="text-[10px] text-slate-400">{project.progress}%</span>
              </div>
              <span className="text-[10px] text-slate-400">Status: {project.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Customer Operations Dashboard
function CustomerDashboard() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-pink-400">🎧</span> Global Voice & Customer Operations
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20">
            <p className="text-xl font-bold text-pink-400">234</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Calls Today</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-xl font-bold text-green-400">96%</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Resolution Rate</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xl font-bold text-blue-400">4.7</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Satisfaction</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-xl font-bold text-purple-400">8</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Languages</p>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-white">Recent Interactions</h4>
          {[
            { type: 'Inbound', customer: 'John Smith', issue: 'Service inquiry', status: 'Resolved', language: 'English' },
            { type: 'Outbound', customer: 'Maria Garcia', issue: 'Follow-up call', status: 'Scheduled', language: 'Spanish' },
            { type: 'Inbound', customer: 'Li Wei', issue: 'Technical support', status: 'Escalated', language: 'Mandarin' },
          ].map((interaction, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                    interaction.type === 'Inbound' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {interaction.type}
                  </span>
                  <span className="text-xs text-white font-medium">{interaction.customer}</span>
                </div>
                <span className="text-[10px] text-slate-400">{interaction.language}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{interaction.issue}</span>
                <span className={`text-[10px] font-medium ${
                  interaction.status === 'Resolved' ? 'text-green-400' :
                  interaction.status === 'Scheduled' ? 'text-blue-400' : 'text-amber-400'
                }`}>
                  {interaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
