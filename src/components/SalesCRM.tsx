import { useState } from 'react';

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  service: string;
  location: string;
  value: number;
  status: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  source: string;
  createdAt: Date;
  lastContact: Date;
  notes: string[];
}

const sampleLeads: Lead[] = [
  {
    id: '1',
    companyName: 'Ortigas Corporation',
    contactName: 'John Santos',
    email: 'john.santos@ortigas.com.ph',
    phone: '+63 2 8123 4567',
    industry: 'Real Estate',
    service: 'Facade Cleaning',
    location: 'Ortigas Center, Pasig',
    value: 1500000,
    status: 'proposal',
    probability: 75,
    expectedCloseDate: '2024-03-15',
    assignedTo: 'MERCURY',
    source: 'Email Inquiry',
    createdAt: new Date('2024-02-01'),
    lastContact: new Date('2024-02-08'),
    notes: ['Initial inquiry received', 'Site visit scheduled', 'Quotation sent']
  },
  {
    id: '2',
    companyName: 'BGC Tower Management',
    contactName: 'Maria Cruz',
    email: 'maria.cruz@bgctower.com.ph',
    phone: '+63 2 8987 6543',
    industry: 'Property Management',
    service: 'Facade Maintenance',
    location: 'BGC, Taguig',
    value: 2500000,
    status: 'negotiation',
    probability: 85,
    expectedCloseDate: '2024-02-28',
    assignedTo: 'MERCURY',
    source: 'Referral',
    createdAt: new Date('2024-01-15'),
    lastContact: new Date('2024-02-07'),
    notes: ['Referral from existing client', 'Requirements gathered', 'Proposal submitted', 'Negotiating terms']
  },
  {
    id: '3',
    companyName: 'Cebu Port Authority',
    contactName: 'Roberto Reyes',
    email: 'roberto.reyes@cebuport.gov.ph',
    phone: '+63 32 345 6789',
    industry: 'Government',
    service: 'Rope Access',
    location: 'Cebu City',
    value: 800000,
    status: 'qualified',
    probability: 60,
    expectedCloseDate: '2024-04-10',
    assignedTo: 'MERCURY',
    source: 'Tender',
    createdAt: new Date('2024-02-05'),
    lastContact: new Date('2024-02-06'),
    notes: ['Tender opportunity identified', 'Qualification completed']
  },
  {
    id: '4',
    companyName: 'Ayala Malls',
    contactName: 'Anna Lim',
    email: 'anna.lim@ayalamalls.com.ph',
    phone: '+63 2 8555 1234',
    industry: 'Retail',
    service: 'Waterproofing',
    location: 'Makati',
    value: 1200000,
    status: 'new',
    probability: 30,
    expectedCloseDate: '2024-05-20',
    assignedTo: 'MERCURY',
    source: 'Website',
    createdAt: new Date('2024-02-08'),
    lastContact: new Date('2024-02-08'),
    notes: ['Website inquiry received']
  },
  {
    id: '5',
    companyName: 'SM Prime Holdings',
    contactName: 'Carlos Tan',
    email: 'carlos.tan@smprime.com.ph',
    phone: '+63 2 8777 8888',
    industry: 'Real Estate',
    service: 'Facade Restoration',
    location: 'Pasay',
    value: 3500000,
    status: 'won',
    probability: 100,
    expectedCloseDate: '2024-02-01',
    assignedTo: 'MERCURY',
    source: 'Existing Client',
    createdAt: new Date('2024-01-01'),
    lastContact: new Date('2024-02-01'),
    notes: ['Contract signed', 'Project kickoff scheduled']
  },
  {
    id: '6',
    companyName: 'Megaworld Corp',
    contactName: 'Diana Wong',
    email: 'diana.wong@megaworld.com.ph',
    phone: '+63 2 8666 7777',
    industry: 'Real Estate',
    service: 'Facade Cleaning',
    location: 'Quezon City',
    value: 900000,
    status: 'lost',
    probability: 0,
    expectedCloseDate: '2024-01-30',
    assignedTo: 'MERCURY',
    source: 'Cold Call',
    createdAt: new Date('2023-12-15'),
    lastContact: new Date('2024-01-30'),
    notes: ['Initial contact', 'Proposal sent', 'Lost to competitor - price']
  }
];

export default function SalesCRM() {
  const [leads, setLeads] = useState<Lead[]>(sampleLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('pipeline');

  const filteredLeads = leads.filter(lead => {
    if (filterStatus === 'all') return true;
    return lead.status === filterStatus;
  });

  const pipelineStages = [
    { id: 'new', label: 'New', color: 'bg-blue-500' },
    { id: 'qualified', label: 'Qualified', color: 'bg-cyan-500' },
    { id: 'proposal', label: 'Proposal', color: 'bg-amber-500' },
    { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
    { id: 'won', label: 'Won', color: 'bg-green-500' },
    { id: 'lost', label: 'Lost', color: 'bg-red-500' }
  ];

  const getPipelineValue = (status: string) => {
    return leads.filter(l => l.status === status).reduce((sum, l) => sum + l.value, 0);
  };

  const getTotalPipelineValue = () => {
    return leads.filter(l => !['won', 'lost'].includes(l.status)).reduce((sum, l) => sum + l.value, 0);
  };

  const getWeightedPipelineValue = () => {
    return leads.filter(l => !['won', 'lost'].includes(l.status)).reduce((sum, l) => sum + (l.value * l.probability / 100), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'qualified': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'proposal': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'negotiation': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'won': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'lost': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{leads.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Leads</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-[#EBC07E]">{formatCurrency(getTotalPipelineValue())}</p>
          <p className="text-xs text-slate-400 mt-1">Pipeline Value</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{formatCurrency(getWeightedPipelineValue())}</p>
          <p className="text-xs text-slate-400 mt-1">Weighted Pipeline</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-400">
            {leads.filter(l => l.status === 'won').length}/{leads.filter(l => ['won', 'lost'].includes(l.status)).length || 1}
          </p>
          <p className="text-xs text-slate-400 mt-1">Win Rate</p>
        </div>
      </div>

      {/* View Toggle and Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'pipeline'
                  ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Pipeline View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              List View
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Stages</option>
              {pipelineStages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {pipelineStages.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage.id);
            const stageValue = getPipelineValue(stage.id);
            
            return (
              <div key={stage.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <h3 className="text-xs font-bold text-white">{stage.label}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400">{stageLeads.length}</span>
                </div>
                <p className="text-xs text-[#EBC07E] font-semibold mb-3">{formatCurrency(stageValue)}</p>
                <div className="space-y-2">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 cursor-pointer hover:border-[#CA9332]/30 transition-all"
                    >
                      <p className="text-[10px] font-semibold text-white truncate">{lead.companyName}</p>
                      <p className="text-[9px] text-slate-400 truncate">{lead.service}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-[#EBC07E]">{formatCurrency(lead.value)}</span>
                        <span className="text-[9px] text-slate-500">{lead.probability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass-card rounded-xl p-6">
          <div className="space-y-3">
            {filteredLeads.map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 cursor-pointer hover:border-[#CA9332]/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{lead.companyName}</h3>
                    <p className="text-xs text-slate-400">{lead.contactName} • {lead.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusColor(lead.status)}`}>
                    {lead.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] text-slate-500">Service</p>
                    <p className="text-xs text-white">{lead.service}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Value</p>
                    <p className="text-xs text-[#EBC07E] font-semibold">{formatCurrency(lead.value)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Probability</p>
                    <p className="text-xs text-white">{lead.probability}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Expected Close</p>
                    <p className="text-xs text-white">{new Date(lead.expectedCloseDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#CA9332]/20">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedLead.companyName}</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedLead.contactName} • {selectedLead.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">Probability: {selectedLead.probability}%</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Email</span>
                      <span className="text-xs text-white">{selectedLead.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Phone</span>
                      <span className="text-xs text-white">{selectedLead.phone}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Industry</span>
                      <span className="text-xs text-white">{selectedLead.industry}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Location</span>
                      <span className="text-xs text-white">{selectedLead.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-3">Opportunity Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Service</span>
                      <span className="text-xs text-white">{selectedLead.service}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Value</span>
                      <span className="text-xs text-[#EBC07E] font-semibold">{formatCurrency(selectedLead.value)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Expected Close</span>
                      <span className="text-xs text-white">{new Date(selectedLead.expectedCloseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Source</span>
                      <span className="text-xs text-white">{selectedLead.source}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Assigned To</span>
                      <span className="text-xs text-white">{selectedLead.assignedTo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">Activity Timeline</h3>
                  <div className="space-y-2">
                    {selectedLead.notes.map((note, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                        <p className="text-xs text-white">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white mb-3">Key Dates</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Created</span>
                      <span className="text-xs text-white">{selectedLead.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <span className="text-xs text-slate-400">Last Contact</span>
                      <span className="text-xs text-white">{selectedLead.lastContact.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-700/30">
              <button className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all">
                Edit Lead
              </button>
              <button className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all">
                Create Task
              </button>
              <button className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all">
                Send Email
              </button>
              <button className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                Add Note
              </button>
              <button
                onClick={() => setSelectedLead(null)}
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
