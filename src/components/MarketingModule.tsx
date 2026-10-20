import { useState } from 'react';

interface Campaign {
  id: string;
  name: string;
  type: 'seo' | 'social' | 'email' | 'content';
  status: 'planning' | 'active' | 'completed' | 'paused';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
}

const sampleCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q1 2024 SEO Campaign',
    type: 'seo',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    budget: 50000,
    spent: 25000,
    leads: 45,
    conversions: 12
  },
  {
    id: '2',
    name: 'LinkedIn Lead Generation',
    type: 'social',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-04-30',
    budget: 30000,
    spent: 15000,
    leads: 28,
    conversions: 8
  },
  {
    id: '3',
    name: 'Email Newsletter Series',
    type: 'email',
    status: 'completed',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    budget: 10000,
    spent: 10000,
    leads: 67,
    conversions: 15
  }
];

export default function MarketingModule() {
  const [campaigns] = useState<Campaign[]>(sampleCampaigns);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'seo': return '🔍';
      case 'social': return '📱';
      case 'email': return '📧';
      case 'content': return '📝';
      default: return '📊';
    }
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const conversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{campaigns.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Campaigns</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-[#EBC07E]">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-slate-400 mt-1">Total Spent</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-400">{totalLeads}</p>
          <p className="text-xs text-slate-400 mt-1">Total Leads</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{conversionRate}%</p>
          <p className="text-xs text-slate-400 mt-1">Conversion Rate</p>
        </div>
      </div>

      {/* Campaigns */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Marketing Campaigns</h3>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all">
            + New Campaign
          </button>
        </div>
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{campaign.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(campaign.status)}`}>
                  {campaign.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] text-slate-500">Budget</p>
                  <p className="text-sm text-white font-bold">{formatCurrency(campaign.budget)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Spent</p>
                  <p className="text-sm text-[#EBC07E] font-bold">{formatCurrency(campaign.spent)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Leads</p>
                  <p className="text-sm text-blue-400 font-bold">{campaign.leads}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Conversions</p>
                  <p className="text-sm text-green-400 font-bold">{campaign.conversions}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Budget Utilization</span>
                  <span className="text-xs text-white font-semibold">{((campaign.spent / campaign.budget) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#CA9332] to-[#EBC07E] rounded-full"
                    style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
