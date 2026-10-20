import { useState } from 'react';

interface SafetyIncident {
  id: string;
  date: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'reported' | 'investigating' | 'resolved';
  reportedBy: string;
}

interface Inspection {
  id: string;
  type: string;
  location: string;
  date: string;
  inspector: string;
  status: 'passed' | 'failed' | 'pending';
  findings: string[];
}

const sampleIncidents: SafetyIncident[] = [
  {
    id: '1',
    date: '2024-02-05',
    location: 'BGC Tower Site',
    severity: 'low',
    description: 'Minor equipment damage during setup',
    status: 'resolved',
    reportedBy: 'Juan Dela Cruz'
  },
  {
    id: '2',
    date: '2024-02-08',
    location: 'Cebu Port Site',
    severity: 'medium',
    description: 'Near-miss incident - falling object',
    status: 'investigating',
    reportedBy: 'Maria Santos'
  }
];

const sampleInspections: Inspection[] = [
  {
    id: '1',
    type: 'Equipment Inspection',
    location: 'Main Warehouse',
    date: '2024-02-01',
    inspector: 'SHIELD',
    status: 'passed',
    findings: ['All ropes within service life', 'Harnesses in good condition']
  },
  {
    id: '2',
    type: 'Site Safety Audit',
    location: 'BGC Tower Site',
    date: '2024-02-07',
    inspector: 'SHIELD',
    status: 'passed',
    findings: ['Safety protocols followed', 'PPE compliance 100%']
  }
];

export default function HSEModule() {
  const [incidents] = useState<SafetyIncident[]>(sampleIncidents);
  const [inspections] = useState<Inspection[]>(sampleInspections);
  const [activeTab, setActiveTab] = useState<'incidents' | 'inspections' | 'compliance'>('incidents');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-amber-500/20 text-amber-400';
      case 'investigating': return 'bg-blue-500/20 text-blue-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'passed': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500">
          <p className="text-3xl font-bold text-white">{incidents.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Incidents</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500">
          <p className="text-3xl font-bold text-white">{incidents.filter(i => i.status !== 'resolved').length}</p>
          <p className="text-xs text-slate-400 mt-1">Open Incidents</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500">
          <p className="text-3xl font-bold text-white">{inspections.filter(i => i.status === 'passed').length}</p>
          <p className="text-xs text-slate-400 mt-1">Passed Inspections</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-[#CA9332]">
          <p className="text-3xl font-bold text-white">100%</p>
          <p className="text-xs text-slate-400 mt-1">Compliance Rate</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700/50 w-fit">
        {(['incidents', 'inspections', 'compliance'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30' : 'text-slate-400'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Safety Incidents</h3>
          <div className="space-y-3">
            {incidents.map(incident => (
              <div key={incident.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-400">{new Date(incident.date).toLocaleDateString()}</p>
                    <p className="text-sm font-semibold text-white mt-1">{incident.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getSeverityColor(incident.severity)}`}>
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-2">{incident.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Reported by: {incident.reportedBy}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusColor(incident.status)}`}>
                    {incident.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspections Tab */}
      {activeTab === 'inspections' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Safety Inspections</h3>
          <div className="space-y-3">
            {inspections.map(inspection => (
              <div key={inspection.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{inspection.type}</h4>
                    <p className="text-xs text-slate-400 mt-1">{inspection.location}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(inspection.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(inspection.status)}`}>
                    {inspection.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Findings:</p>
                  <ul className="space-y-1">
                    {inspection.findings.map((finding, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Compliance Status</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">IRATA Certifications</span>
                <span className="text-xs text-green-400 font-bold">100% Compliant</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Safety Training</span>
                <span className="text-xs text-green-400 font-bold">100% Complete</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Equipment Inspection</span>
                <span className="text-xs text-amber-400 font-bold">90% Complete</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '90%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
