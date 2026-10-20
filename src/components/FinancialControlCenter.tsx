import { useState, useEffect } from 'react';
import GoogleSheetsService from '../services/googleSheetsService';
import PersistenceService from '../services/persistenceService';
import { orchestrationEngine } from '../neas/orchestrationEngine';

interface ProjectFinancial {
  projectId: string;
  projectName: string;
  budget: number;
  actualCost: number;
  revenue: number;
  invoiced: number;
  received: number;
  grossProfit: number;
  margin: number;
  status: 'on-budget' | 'over-budget' | 'at-risk';
}

interface CashFlowProjection {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulative: number;
}

interface FinancialException {
  id: string;
  type: 'overrun' | 'under-collection' | 'unapproved' | 'anomaly';
  description: string;
  amount: number;
  project?: string;
  date: Date;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export default function FinancialControlCenter() {
  const [projectFinancials, setProjectFinancials] = useState<ProjectFinancial[]>([]);
  const [cashFlowProjections, setCashFlowProjections] = useState<CashFlowProjection[]>([]);
  const [exceptions, setExceptions] = useState<FinancialException[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'cashflow' | 'exceptions'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load from Google Sheets
      const records = await GoogleSheetsService.getFinancialRecords();
      
      if (records.length > 0) {
        // Calculate project financials
        const projectMap = new Map<string, ProjectFinancial>();
        
        records.forEach(record => {
          if (record.project) {
            if (!projectMap.has(record.project)) {
              projectMap.set(record.project, {
                projectId: record.project,
                projectName: record.project,
                budget: 0,
                actualCost: 0,
                revenue: 0,
                invoiced: 0,
                received: 0,
                grossProfit: 0,
                margin: 0,
                status: 'on-budget'
              });
            }
            
            const proj = projectMap.get(record.project)!;
            if (record.type === 'expense' && record.approved) {
              proj.actualCost += record.amount;
            } else if (record.type === 'income' && record.approved) {
              proj.revenue += record.amount;
              proj.received += record.amount;
            }
          }
        });

        // Calculate margins and status
        projectMap.forEach(proj => {
          proj.grossProfit = proj.revenue - proj.actualCost;
          proj.margin = proj.revenue > 0 ? (proj.grossProfit / proj.revenue) * 100 : 0;
          
          if (proj.budget > 0) {
            if (proj.actualCost > proj.budget * 1.1) {
              proj.status = 'over-budget';
            } else if (proj.actualCost > proj.budget * 0.9) {
              proj.status = 'at-risk';
            } else {
              proj.status = 'on-budget';
            }
          }
        });

        setProjectFinancials(Array.from(projectMap.values()));

        // Generate cash flow projections (next 6 months)
        const projections: CashFlowProjection[] = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        let cumulative = 0;
        
        months.forEach((month, i) => {
          const inflow = Math.random() * 500000 + 300000;
          const outflow = Math.random() * 400000 + 200000;
          const net = inflow - outflow;
          cumulative += net;
          
          projections.push({
            month,
            inflow,
            outflow,
            net,
            cumulative
          });
        });
        
        setCashFlowProjections(projections);

        // Detect exceptions
        const detectedExceptions: FinancialException[] = [];
        
        projectMap.forEach(proj => {
          if (proj.status === 'over-budget') {
            detectedExceptions.push({
              id: `exc-${proj.projectId}-overrun`,
              type: 'overrun',
              description: `Project ${proj.projectName} exceeded budget by ${((proj.actualCost / proj.budget - 1) * 100).toFixed(1)}%`,
              amount: proj.actualCost - proj.budget,
              project: proj.projectName,
              date: new Date(),
              severity: 'high',
              resolved: false
            });
          }
          
          if (proj.revenue > proj.received * 1.2) {
            detectedExceptions.push({
              id: `exc-${proj.projectId}-collection`,
              type: 'under-collection',
              description: `Project ${proj.projectName} has significant uncollected revenue`,
              amount: proj.revenue - proj.received,
              project: proj.projectName,
              date: new Date(),
              severity: 'medium',
              resolved: false
            });
          }
        });
        
        setExceptions(detectedExceptions);
        
        // Save to localStorage
        PersistenceService.saveModuleData('projectFinancials', Array.from(projectMap.values()));
        PersistenceService.saveModuleData('cashFlowProjections', projections);
        PersistenceService.saveModuleData('financialExceptions', detectedExceptions);
      }
    } catch (error) {
      console.error('[FinancialControlCenter] Failed to load financial data:', error);
      setError('Failed to load financial data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-budget': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'at-risk': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'over-budget': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const totalBudget = projectFinancials.reduce((sum, p) => sum + p.budget, 0);
  const totalActual = projectFinancials.reduce((sum, p) => sum + p.actualCost, 0);
  const totalRevenue = projectFinancials.reduce((sum, p) => sum + p.revenue, 0);
  const totalProfit = projectFinancials.reduce((sum, p) => sum + p.grossProfit, 0);
  const avgMargin = projectFinancials.length > 0 
    ? projectFinancials.reduce((sum, p) => sum + p.margin, 0) / projectFinancials.length 
    : 0;

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Financial Data</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={loadFinancialData}
            className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-sm font-medium hover:bg-[#CA9332]/30 transition-all"
            aria-label="Retry loading financial data"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Financial Control Center</h2>
            <p className="text-sm text-slate-400 mt-1">Comprehensive financial analysis and control</p>
          </div>
          <button
            onClick={loadFinancialData}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {(['overview', 'projects', 'cashflow', 'exceptions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="glass-card rounded-xl p-5">
              <p className="text-3xl font-bold text-white">{formatCurrency(totalBudget)}</p>
              <p className="text-xs text-slate-400 mt-1">Total Budget</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-3xl font-bold text-[#EBC07E]">{formatCurrency(totalActual)}</p>
              <p className="text-xs text-slate-400 mt-1">Actual Cost</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-3xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-slate-400 mt-1">Total Revenue</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(totalProfit)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Gross Profit</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className={`text-3xl font-bold ${avgMargin >= 20 ? 'text-green-400' : avgMargin >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                {avgMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Avg Margin</p>
            </div>
          </div>

          {/* Budget vs Actual */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Budget vs Actual</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                <span className="text-xs text-slate-400">Budget Utilization</span>
                <span className="text-sm font-bold text-white">
                  {totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalActual > totalBudget ? 'bg-red-500' :
                    totalActual > totalBudget * 0.9 ? 'bg-amber-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Exception Summary */}
          {exceptions.length > 0 && (
            <div className="glass-card rounded-xl p-6 border-l-4 border-l-amber-500">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white mb-1">Financial Exceptions</h3>
                  <p className="text-xs text-slate-400">
                    {exceptions.filter(e => !e.resolved).length} unresolved exceptions require attention
                  </p>
                  <button
                    onClick={() => setActiveTab('exceptions')}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-all"
                  >
                    View Exceptions
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Project Financial Performance</h3>
          <div className="space-y-3">
            {projectFinancials.map(project => (
              <div key={project.projectId} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{project.projectName}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(project.status)}`}>
                      {project.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#EBC07E]">{project.margin.toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400">Margin</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500">Budget</p>
                    <p className="text-xs text-white font-semibold">{formatCurrency(project.budget)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Actual Cost</p>
                    <p className="text-xs text-[#EBC07E] font-semibold">{formatCurrency(project.actualCost)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Revenue</p>
                    <p className="text-xs text-green-400 font-semibold">{formatCurrency(project.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Gross Profit</p>
                    <p className={`text-xs font-semibold ${project.grossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(project.grossProfit)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash Flow Tab */}
      {activeTab === 'cashflow' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Cash Flow Projections (6 Months)</h3>
          <div className="space-y-3">
            {cashFlowProjections.map((projection, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white">{projection.month}</h4>
                  <p className={`text-sm font-bold ${projection.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(projection.net)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500">Inflow</p>
                    <p className="text-xs text-green-400 font-semibold">{formatCurrency(projection.inflow)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Outflow</p>
                    <p className="text-xs text-red-400 font-semibold">{formatCurrency(projection.outflow)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Cumulative</p>
                    <p className={`text-xs font-semibold ${projection.cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(projection.cumulative)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exceptions Tab */}
      {activeTab === 'exceptions' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Financial Exceptions</h3>
          <div className="space-y-3">
            {exceptions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-xs">No financial exceptions detected</p>
              </div>
            ) : (
              exceptions.map(exception => (
                <div
                  key={exception.id}
                  className={`p-4 rounded-lg border ${
                    exception.resolved ? 'bg-slate-800/20 border-slate-700/20 opacity-50' : getSeverityColor(exception.severity)
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {exception.type === 'overrun' ? '💸' : 
                         exception.type === 'under-collection' ? '💰' :
                         exception.type === 'unapproved' ? '⚠️' : '🔍'}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">{exception.description}</p>
                        {exception.project && (
                          <p className="text-[10px] text-slate-400 mt-1">Project: {exception.project}</p>
                        )}
                        <p className="text-xs text-[#EBC07E] font-bold mt-2">{formatCurrency(exception.amount)}</p>
                      </div>
                    </div>
                    {!exception.resolved && (
                      <button
                        onClick={() => {
                          setExceptions(prev => prev.map(e => 
                            e.id === exception.id ? { ...e, resolved: true } : e
                          ));
                          orchestrationEngine.addAuditLog(
                            'user',
                            'CEO',
                            'exception_resolved',
                            'financial',
                            exception.id,
                            `Resolved: ${exception.description}`,
                            'info'
                          );
                        }}
                        className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-500">
                      {exception.date.toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getSeverityColor(exception.severity)}`}>
                      {exception.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700/50 text-xs text-slate-400">
          <span className="animate-spin">⏳</span> Loading financial data...
        </div>
      )}
    </div>
  );
}
