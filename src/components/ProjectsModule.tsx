import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  actualCost: number;
  progress: number;
  projectManager: string;
  team: string[];
  milestones: { name: string; date: string; completed: boolean }[];
  risks: { description: string; level: 'low' | 'medium' | 'high'; mitigation: string }[];
}

const sampleProjects: Project[] = [
  {
    id: '1',
    name: 'BGC Tower Facade Maintenance',
    client: 'BGC Tower Management',
    location: 'Bonifacio Global City, Taguig',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-03-20',
    budget: 2500000,
    actualCost: 1125000,
    progress: 45,
    projectManager: 'ATLAS',
    team: ['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes'],
    milestones: [
      { name: 'Site Inspection', date: '2024-01-20', completed: true },
      { name: 'Equipment Mobilization', date: '2024-01-25', completed: true },
      { name: 'Phase 1 Cleaning', date: '2024-02-15', completed: false },
      { name: 'Phase 2 Cleaning', date: '2024-03-01', completed: false },
      { name: 'Final Inspection', date: '2024-03-15', completed: false }
    ],
    risks: [
      { description: 'Weather delays', level: 'medium', mitigation: 'Build 5-day contingency into schedule' },
      { description: 'Equipment failure', level: 'low', mitigation: 'Backup equipment on standby' }
    ]
  },
  {
    id: '2',
    name: 'Ortigas Office Facade Cleaning',
    client: 'Ortigas Corporation',
    location: 'Ortigas Center, Pasig',
    status: 'planning',
    startDate: '2024-02-20',
    endDate: '2024-04-10',
    budget: 1500000,
    actualCost: 0,
    progress: 10,
    projectManager: 'ATLAS',
    team: ['Ana Lopez', 'Carlos Garcia'],
    milestones: [
      { name: 'Contract Signing', date: '2024-02-15', completed: false },
      { name: 'Site Survey', date: '2024-02-20', completed: false },
      { name: 'Mobilization', date: '2024-02-25', completed: false },
      { name: 'Execution', date: '2024-03-15', completed: false },
      { name: 'Completion', date: '2024-04-10', completed: false }
    ],
    risks: [
      { description: 'Client approval delay', level: 'medium', mitigation: 'Follow up weekly with client' }
    ]
  },
  {
    id: '3',
    name: 'Cebu Port Rope Access',
    client: 'Cebu Port Authority',
    location: 'Cebu City',
    status: 'active',
    startDate: '2024-01-10',
    endDate: '2024-02-28',
    budget: 800000,
    actualCost: 520000,
    progress: 65,
    projectManager: 'ATLAS',
    team: ['Roberto Cruz', 'Elena Ramos'],
    milestones: [
      { name: 'Safety Inspection', date: '2024-01-15', completed: true },
      { name: 'Phase 1 Work', date: '2024-01-30', completed: true },
      { name: 'Phase 2 Work', date: '2024-02-15', completed: false },
      { name: 'Final Report', date: '2024-02-28', completed: false }
    ],
    risks: [
      { description: 'Safety incident', level: 'high', mitigation: 'Daily safety briefings, full PPE compliance' }
    ]
  }
];

export default function ProjectsModule() {
  const [projects] = useState<Project[]>(sampleProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'gantt'>('cards');

  const filteredProjects = projects.filter(p => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'on-hold': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'completed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
  };

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalActual = projects.reduce((sum, p) => sum + p.actualCost, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{projects.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Projects</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{activeProjects}</p>
          <p className="text-xs text-slate-400 mt-1">Active Projects</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-[#EBC07E]">{formatCurrency(totalBudget)}</p>
          <p className="text-xs text-slate-400 mt-1">Total Budget</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-400">{((totalActual / totalBudget) * 100).toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">Budget Utilization</p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'cards' ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30' : 'text-slate-400'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'gantt' ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30' : 'text-slate-400'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProjects.map(project => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="glass-card rounded-xl p-5 cursor-pointer hover:border-[#CA9332]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white mb-1">{project.name}</h3>
                  <p className="text-xs text-slate-400">{project.client} • {project.location}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusColor(project.status)}`}>
                  {project.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] text-slate-500">Budget</p>
                  <p className="text-xs text-white font-semibold">{formatCurrency(project.budget)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Actual Cost</p>
                  <p className="text-xs text-[#EBC07E] font-semibold">{formatCurrency(project.actualCost)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Start Date</p>
                  <p className="text-xs text-white">{new Date(project.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">End Date</p>
                  <p className="text-xs text-white">{new Date(project.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Progress</span>
                  <span className="text-xs text-white font-semibold">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#CA9332] to-[#EBC07E] rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>PM: {project.projectManager}</span>
                <span>Team: {project.team.length} members</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Project Timeline</h3>
          <div className="space-y-3">
            {filteredProjects.map(project => {
              const start = new Date(project.startDate).getTime();
              const end = new Date(project.endDate).getTime();
              const now = Date.now();
              const totalDuration = end - start;
              const elapsed = Math.max(0, Math.min(now - start, totalDuration));
              const progress = (elapsed / totalDuration) * 100;

              return (
                <div key={project.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">{project.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="relative h-6 rounded bg-slate-700/50 overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-[#CA9332]/50 to-[#EBC07E]/50 rounded"
                      style={{ width: `${progress}%` }}
                    />
                    <div
                      className="absolute h-full bg-gradient-to-r from-[#CA9332] to-[#EBC07E] rounded"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                    <span>{new Date(project.startDate).toLocaleDateString()}</span>
                    <span>{project.progress}% complete</span>
                    <span>{new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#CA9332]/20">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedProject.name}</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedProject.client} • {selectedProject.location}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Budget</p>
                <p className="text-lg font-bold text-white">{formatCurrency(selectedProject.budget)}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Actual Cost</p>
                <p className="text-lg font-bold text-[#EBC07E]">{formatCurrency(selectedProject.actualCost)}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Start Date</p>
                <p className="text-sm text-white">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">End Date</p>
                <p className="text-sm text-white">{new Date(selectedProject.endDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Progress</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#CA9332] to-[#EBC07E] rounded-full"
                    style={{ width: `${selectedProject.progress}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-white">{selectedProject.progress}%</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Milestones</h3>
              <div className="space-y-2">
                {selectedProject.milestones.map((milestone, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      milestone.completed ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-500'
                    }`}>
                      {milestone.completed ? '✓' : '○'}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white">{milestone.name}</p>
                      <p className="text-[10px] text-slate-500">{new Date(milestone.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Team</h3>
              <div className="flex flex-wrap gap-2">
                {selectedProject.team.map((member, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-slate-800/30 border border-slate-700/30 text-xs text-white">
                    {member}
                  </span>
                ))}
              </div>
            </div>

            {selectedProject.risks.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Risks</h3>
                <div className="space-y-2">
                  {selectedProject.risks.map((risk, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-white">{risk.description}</p>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          risk.level === 'high' ? 'bg-red-500/20 text-red-400' :
                          risk.level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {risk.level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Mitigation: {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
