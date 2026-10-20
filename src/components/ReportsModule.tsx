import { useState } from 'react';

interface Report {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  category: string;
  generatedDate: string;
  status: 'ready' | 'generating' | 'failed';
  downloadUrl?: string;
}

const sampleReports: Report[] = [
  { id: '1', name: 'Daily Operations Report - Feb 8, 2024', type: 'daily', category: 'Operations', generatedDate: '2024-02-08', status: 'ready' },
  { id: '2', name: 'Weekly Sales Summary - Week 5', type: 'weekly', category: 'Sales', generatedDate: '2024-02-04', status: 'ready' },
  { id: '3', name: 'Monthly Financial Report - January 2024', type: 'monthly', category: 'Finance', generatedDate: '2024-02-01', status: 'ready' },
  { id: '4', name: 'Project Progress Report - All Active', type: 'custom', category: 'Projects', generatedDate: '2024-02-08', status: 'generating' }
];

export default function ReportsModule() {
  const [reports] = useState<Report[]>(sampleReports);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredReports = reports.filter(r => filterType === 'all' || r.type === filterType);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'weekly': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'monthly': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'custom': return 'bg-[#CA9332]/20 text-[#EBC07E] border-[#CA9332]/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500/20 text-green-400';
      case 'generating': return 'bg-amber-500/20 text-amber-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{reports.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Reports</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{reports.filter(r => r.status === 'ready').length}</p>
          <p className="text-xs text-slate-400 mt-1">Ready to Download</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-amber-400">{reports.filter(r => r.status === 'generating').length}</p>
          <p className="text-xs text-slate-400 mt-1">Generating</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-400">{new Set(reports.map(r => r.category)).size}</p>
          <p className="text-xs text-slate-400 mt-1">Categories</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
          >
            <option value="all">All Types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Generated Reports</h3>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all">
            + Generate Report
          </button>
        </div>
        <div className="space-y-3">
          {filteredReports.map(report => (
            <div key={report.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{report.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{report.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getTypeColor(report.type)}`}>
                    {report.type.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusColor(report.status)}`}>
                    {report.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Generated: {new Date(report.generatedDate).toLocaleDateString()}</span>
                {report.status === 'ready' && (
                  <button className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all">
                    ↓ Download
                  </button>
                )}
                {report.status === 'generating' && (
                  <span className="text-xs text-amber-400 flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Generating...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
