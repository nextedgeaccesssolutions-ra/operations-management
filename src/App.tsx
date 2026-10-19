import { useState } from 'react';
import { departments, signOffDepartments, type Department, type Agent, type Task } from './data';

function StatusDot({ status }: { status: Agent['status'] }) {
  const config = {
    'on-duty': { color: 'bg-green-500', label: 'On duty', className: 'status-pulse' },
    idle: { color: 'bg-gray-400', label: 'Idle', className: 'status-pulse-idle' },
    held: { color: 'bg-red-500', label: 'Held', className: 'status-pulse-held' },
  };
  const c = config[status];
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${c.color} ${c.className}`} />
      <span className="text-xs text-slate-400 font-medium">{c.label}</span>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const config = {
    running: { bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '▶', label: 'Running' },
    queued: { bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: '◻', label: 'Queued' },
    blocked: { bg: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '⊘', label: 'Blocked' },
    'awaiting-sign-off': { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '⏳', label: 'Awaiting sign-off' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="group/task relative p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs text-slate-200 leading-relaxed flex-1">{task.title}</p>
        {task.gated && (
          <span className="gate-badge px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-400 uppercase tracking-wider whitespace-nowrap">
            Gated
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TaskStatusBadge status={task.status} />
          {task.blockedBy && (
            <span className="text-[10px] text-red-400">blocked by {task.blockedBy}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>{task.assignee}</span>
          <span className="text-slate-600">·</span>
          <span className={task.dueDate === 'Today' ? 'text-amber-400 font-medium' : ''}>due {task.dueDate}</span>
        </div>
      </div>
      {(task.status === 'running') && (
        <div className="mt-2 h-0.5 rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full task-progress rounded-full w-2/3" />
        </div>
      )}
    </div>
  );
}

function AgentDesk({ agent }: { agent: Agent }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="desk-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-lg border border-slate-600/50">
            {agent.avatar}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
            <p className="text-xs text-slate-400">{agent.role}</p>
          </div>
        </div>
        <StatusDot status={agent.status} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
          Model: <span className="text-slate-300">{agent.model}</span>
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          {expanded ? '▾ Tasks' : '▸ Tasks'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2">
          {agent.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentCard({ department, index }: { department: Department; index: number }) {
  return (
    <div
      className="glass-card rounded-2xl p-5 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${department.color}15`, border: `1px solid ${department.color}30` }}
          >
            {department.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{department.name}</h3>
            <p className="text-[10px] text-slate-500">
              {department.seats} seat{department.seats > 1 ? 's' : ''} · {department.openSeats} open
            </p>
          </div>
        </div>
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: department.color, boxShadow: `0 0 8px ${department.color}60` }}
        />
      </div>

      <div className="space-y-3">
        {department.agents.map((agent) => (
          <AgentDesk key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function StatsBar() {
  const totalAgents = departments.reduce((sum, d) => sum + d.agents.length, 0);
  const onDuty = departments.reduce((sum, d) => sum + d.agents.filter(a => a.status === 'on-duty').length, 0);
  const totalTasks = departments.reduce((sum, d) => sum + d.agents.reduce((s, a) => s + a.tasks.length, 0), 0);
  const gatedTasks = departments.reduce((sum, d) => sum + d.agents.reduce((s, a) => s + a.tasks.filter(t => t.gated).length, 0), 0);

  const stats = [
    { label: 'Agents', value: totalAgents, icon: '🤖', color: 'text-blue-400' },
    { label: 'On Duty', value: onDuty, icon: '✅', color: 'text-green-400' },
    { label: 'Tasks', value: totalTasks, icon: '📋', color: 'text-purple-400' },
    { label: 'Gated', value: gatedTasks, icon: '🔒', color: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">{stat.icon}</span>
          <div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SignOffBanner() {
  return (
    <div className="glass-card rounded-2xl p-5 mb-8 border-amber-500/20! bg-gradient-to-r from-amber-500/5 to-transparent">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl animate-float">
          🚦
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-amber-300 mb-1">Human Sign-Off Required</h3>
          <p className="text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">{signOffDepartments.length} departments</span> waiting on a person — nothing leaves the floor ungated
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {signOffDepartments.map((dept) => (
            <span key={dept} className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-medium">
              {dept}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Virtual Office</h1>
          <p className="text-xs text-slate-500">Next Edge Access Solutions</p>
        </div>
      </div>
      <p className="text-sm text-slate-400 max-w-2xl mt-3 leading-relaxed">
        NEAS departments laid out by team. Each desk shows who sits there and what is on their queue right now. 
        Work marked <span className="text-amber-400 font-medium">gated</span> stops for a human before it leaves the building.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-pulse" />
          Accounts are live
        </span>
        <span className="text-[10px] text-slate-600">Blob store · Companies, users & sessions</span>
      </div>
    </header>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen floor-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        <StatsBar />
        <SignOffBanner />

        {/* View Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-blue-400">◈</span> Office Floor
          </h2>
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              ▦ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* Department Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {departments.map((dept, i) => (
              <DepartmentCard key={dept.id} department={dept} index={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {departments.map((dept, i) => (
              <div
                key={dept.id}
                className="glass-card rounded-2xl p-5 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ backgroundColor: `${dept.color}15`, border: `1px solid ${dept.color}30` }}
                  >
                    {dept.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white">{dept.name}</h3>
                  <span className="text-[10px] text-slate-500 ml-auto">
                    {dept.seats} seat{dept.seats > 1 ? 's' : ''} · {dept.openSeats} open
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dept.agents.map((agent) => (
                    <AgentDesk key={agent.id} agent={agent} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              NEAS Virtual Office · Row Level Security requires Postgres connection for real company records
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span>Reference roster displayed</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>Agents created against company</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
