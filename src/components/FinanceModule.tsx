import { useState, useEffect } from 'react';
import GoogleSheetsService, { FinancialRecord } from '../services/googleSheetsService';
import RefrensService, { RefrensInvoice } from '../services/refrensService';
import PersistenceService from '../services/persistenceService';
import { orchestrationEngine } from '../neas/orchestrationEngine';

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  project: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'void';
  paidDate?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overdue';
  paidAmount?: number;
  outstandingAmount?: number;
  source: 'internal' | 'refrens' | 'sheets';
  sourceId?: string;
  sourceUrl?: string;
  currency: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  project?: string;
  approved: boolean;
}

// Convert FinancialRecord to Invoice/Expense format
const convertToInvoices = (records: FinancialRecord[]): Invoice[] => {
  return records
    .filter(r => r.type === 'income')
    .map((r, i) => ({
      id: r.id || `INV-${i + 1}`,
      invoiceNumber: `INV-2024-${(i + 1).toString().padStart(3, '0')}`,
      client: r.project || 'Client',
      project: r.project || 'Project',
      amount: r.amount,
      issuedDate: r.date,
      dueDate: new Date(new Date(r.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: r.approved ? 'paid' as const : 'sent' as const,
      paidDate: r.approved ? r.date : undefined,
      paymentStatus: r.approved ? 'paid' as const : 'unpaid' as const,
      paidAmount: r.approved ? r.amount : 0,
      outstandingAmount: r.approved ? 0 : r.amount,
      source: 'sheets' as const,
      currency: 'PHP'
    }));
};

// Convert Refrens invoice to internal format
const convertRefrensInvoice = (refrensInvoice: RefrensInvoice): Invoice => {
  return {
    id: refrensInvoice.id,
    invoiceNumber: refrensInvoice.invoiceNumber,
    client: refrensInvoice.clientName,
    project: refrensInvoice.projectName || 'N/A',
    amount: refrensInvoice.totalAmount,
    issuedDate: refrensInvoice.issueDate,
    dueDate: refrensInvoice.dueDate,
    status: refrensInvoice.status as Invoice['status'],
    paidDate: refrensInvoice.paidDate,
    paymentStatus: refrensInvoice.paymentStatus,
    paidAmount: refrensInvoice.paidAmount,
    outstandingAmount: refrensInvoice.outstandingAmount,
    source: 'refrens',
    sourceId: refrensInvoice.sourceRecordId,
    sourceUrl: refrensInvoice.sourceUrl,
    currency: refrensInvoice.currency
  };
};

const convertToExpenses = (records: FinancialRecord[]): Expense[] => {
  return records
    .filter(r => r.type === 'expense')
    .map(r => ({
      id: r.id,
      category: r.category,
      description: r.description,
      amount: r.amount,
      date: r.date,
      project: r.project,
      approved: r.approved
    }));
};

const sampleInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    client: 'BGC Tower Management',
    project: 'BGC Tower Facade Maintenance',
    amount: 1250000,
    issuedDate: '2024-01-20',
    dueDate: '2024-02-20',
    status: 'paid',
    paidDate: '2024-02-15',
    paymentStatus: 'paid',
    paidAmount: 1250000,
    outstandingAmount: 0,
    source: 'internal',
    currency: 'PHP'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    client: 'Cebu Port Authority',
    project: 'Cebu Port Rope Access',
    amount: 400000,
    issuedDate: '2024-01-25',
    dueDate: '2024-02-25',
    status: 'sent',
    paymentStatus: 'unpaid',
    paidAmount: 0,
    outstandingAmount: 400000,
    source: 'internal',
    currency: 'PHP'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    client: 'Ortigas Corporation',
    project: 'Ortigas Office Facade Cleaning',
    amount: 750000,
    issuedDate: '2024-02-01',
    dueDate: '2024-03-01',
    status: 'overdue',
    paymentStatus: 'overdue',
    paidAmount: 0,
    outstandingAmount: 750000,
    source: 'internal',
    currency: 'PHP'
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    client: 'Ayala Malls',
    project: 'Ayala Malls Waterproofing',
    amount: 600000,
    issuedDate: '2024-02-05',
    dueDate: '2024-03-05',
    status: 'draft',
    paymentStatus: 'unpaid',
    paidAmount: 0,
    outstandingAmount: 600000,
    source: 'internal',
    currency: 'PHP'
  }
];

const sampleExpenses: Expense[] = [
  {
    id: '1',
    category: 'Equipment',
    description: 'Rope access kit rental',
    amount: 25000,
    date: '2024-02-01',
    project: 'BGC Tower Facade Maintenance',
    approved: true
  },
  {
    id: '2',
    category: 'Transport',
    description: 'Team transport to Cebu',
    amount: 45000,
    date: '2024-02-03',
    project: 'Cebu Port Rope Access',
    approved: true
  },
  {
    id: '3',
    category: 'Materials',
    description: 'Cleaning supplies',
    amount: 18000,
    date: '2024-02-05',
    project: 'BGC Tower Facade Maintenance',
    approved: true
  },
  {
    id: '4',
    category: 'Labor',
    description: 'Technician wages - Week 1',
    amount: 85000,
    date: '2024-02-07',
    project: 'Cebu Port Rope Access',
    approved: false
  }
];

export default function FinanceModule() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = PersistenceService.loadModuleData<Invoice[]>('invoices', []);
    return saved.length > 0 ? saved : sampleInvoices;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = PersistenceService.loadModuleData<Expense[]>('expenses', []);
    return saved.length > 0 ? saved : sampleExpenses;
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'expenses' | 'cashflow'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'internal' | 'refrens' | 'sheets'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load real data from Google Sheets and Refrens on mount
  useEffect(() => {
    const loadRealData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Load from Google Sheets
        const records = await GoogleSheetsService.getFinancialRecords();
        let sheetsInvoices: Invoice[] = [];
        let sheetsExpenses: Expense[] = [];
        
        if (records.length > 0) {
          sheetsInvoices = convertToInvoices(records);
          sheetsExpenses = convertToExpenses(records);
          console.log('[FinanceModule] Loaded', records.length, 'financial records from Google Sheets');
        }

        // Load from Refrens
        const refrensInvoices = RefrensService.getInvoices();
        let refrensConverted: Invoice[] = [];
        
        if (refrensInvoices.length > 0) {
          refrensConverted = refrensInvoices.map(convertRefrensInvoice);
          console.log('[FinanceModule] Loaded', refrensInvoices.length, 'invoices from Refrens');
        }

        // Merge all invoices (sample + sheets + refrens) with deduplication
        const allInvoices = [...sampleInvoices];
        
        // Add Sheets invoices (avoid duplicates by sourceId)
        sheetsInvoices.forEach(sheetInv => {
          if (!allInvoices.find(inv => inv.sourceId === sheetInv.sourceId || inv.id === sheetInv.id)) {
            allInvoices.push(sheetInv);
          }
        });

        // Add Refrens invoices (avoid duplicates by sourceId)
        refrensConverted.forEach(refrensInv => {
          if (!allInvoices.find(inv => inv.sourceId === refrensInv.sourceId || inv.id === refrensInv.id)) {
            allInvoices.push(refrensInv);
          }
        });

        if (allInvoices.length > 0) {
          setInvoices(allInvoices);
          PersistenceService.saveModuleData('invoices', allInvoices);
        }

        if (sheetsExpenses.length > 0) {
          setExpenses(sheetsExpenses);
          PersistenceService.saveModuleData('expenses', sheetsExpenses);
        }
      } catch (error) {
        setError('Failed to load financial data');
        console.error('[FinanceModule] Failed to load real data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRealData();
  }, []);

  const formatCurrency = (value: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netCashFlow = totalPaid - totalExpenses;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': case 'void': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = searchQuery === '' || 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchesSource = filterSource === 'all' || inv.source === filterSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Data source indicators
  const hasRefrensData = invoices.some(inv => inv.source === 'refrens');
  const hasSheetsData = invoices.some(inv => inv.source === 'sheets');
  const hasSampleData = invoices.some(inv => inv.source === 'internal');

  const handleSyncRefrens = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await RefrensService.syncInvoices();
      const refrensInvoices = RefrensService.getInvoices();
      const refrensConverted = refrensInvoices.map(convertRefrensInvoice);
      
      // Merge with existing invoices
      const allInvoices = [...invoices];
      refrensConverted.forEach(refrensInv => {
        const existingIndex = allInvoices.findIndex(inv => inv.sourceId === refrensInv.sourceId);
        if (existingIndex >= 0) {
          allInvoices[existingIndex] = refrensInv;
        } else {
          allInvoices.push(refrensInv);
        }
      });
      
      setInvoices(allInvoices);
      PersistenceService.saveModuleData('invoices', allInvoices);
      
      orchestrationEngine.addAuditLog(
        'user',
        'CEO',
        'refrens_invoices_synced',
        'integration',
        'refrens',
        `Synced ${refrensConverted.length} invoices from Refrens`,
        'info'
      );
    } catch (err) {
      setError('Failed to sync Refrens invoices');
      console.error('[FinanceModule] Sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Data Source Indicator */}
      {(hasSampleData || hasRefrensData || hasSheetsData) && (
        <div className={`glass-card rounded-xl p-3 border-l-4 ${
          hasRefrensData ? 'border-l-blue-500 bg-blue-500/5' : 
          hasSheetsData ? 'border-l-green-500 bg-green-500/5' :
          'border-l-amber-500 bg-amber-500/5'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {hasRefrensData ? '📑' : hasSheetsData ? '📊' : '⚠️'}
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">
                {hasRefrensData && hasSheetsData && hasSampleData ? 'MIXED DATA SOURCES' :
                 hasRefrensData && hasSheetsData ? 'REFRENS + GOOGLE SHEETS' :
                 hasRefrensData ? 'REFRENS DATA' :
                 hasSheetsData ? 'GOOGLE SHEETS DATA' : 'SAMPLE DATA'}
              </p>
              <p className="text-[10px] text-slate-400">
                {hasRefrensData && hasSheetsData && hasSampleData
                  ? `Showing ${invoices.filter(i => i.source === 'refrens').length} Refrens + ${invoices.filter(i => i.source === 'sheets').length} Sheets + ${invoices.filter(i => i.source === 'internal').length} sample invoices`
                  : hasRefrensData && hasSheetsData
                  ? `Showing ${invoices.filter(i => i.source === 'refrens').length} Refrens + ${invoices.filter(i => i.source === 'sheets').length} Sheets invoices`
                  : hasRefrensData
                  ? 'Invoices synced from Refrens. Backend API configuration required for real-time sync.'
                  : hasSheetsData
                  ? 'Invoices synced from Google Sheets.'
                  : 'Invoices shown are sample data for demonstration. Real invoice data requires Refrens or Google Sheets integration.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700/50 w-fit">
        {(['overview', 'invoices', 'expenses', 'cashflow'] as const).map(tab => (
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Financial Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500">
              <p className="text-3xl font-bold text-white">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-slate-400 mt-1">Total Received</p>
            </div>
            <div className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500">
              <p className="text-3xl font-bold text-white">{formatCurrency(totalOutstanding)}</p>
              <p className="text-xs text-slate-400 mt-1">Outstanding</p>
            </div>
            <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500">
              <p className="text-3xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-slate-400 mt-1">Total Expenses</p>
            </div>
            <div className="glass-card rounded-xl p-5 border-l-4 border-l-[#CA9332]">
              <p className={`text-3xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(netCashFlow)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Net Cash Flow</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Recent Invoices</h3>
              <div className="space-y-2">
                {invoices.slice(0, 3).map(invoice => (
                  <div key={invoice.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{invoice.invoiceNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{invoice.client}</p>
                    <p className="text-xs text-[#EBC07E] font-semibold mt-1">{formatCurrency(invoice.amount)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Recent Expenses</h3>
              <div className="space-y-2">
                {expenses.slice(0, 3).map(expense => (
                  <div key={expense.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{expense.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        expense.approved ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {expense.approved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{expense.description}</p>
                    <p className="text-xs text-red-400 font-semibold mt-1">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <>
          {/* Filters and Controls */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search invoices..."
                  className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50"
                  aria-label="Search invoices by number, client, or project"
                />
                <label className="text-xs text-slate-400" htmlFor="invoice-status-filter">Status:</label>
                <select
                  id="invoice-status-filter"
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
                  aria-label="Filter invoices by status"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="void">Void</option>
                </select>
                <label className="text-xs text-slate-400" htmlFor="invoice-source-filter">Source:</label>
                <select
                  id="invoice-source-filter"
                  value={filterSource}
                  onChange={(e) => { setFilterSource(e.target.value as any); setCurrentPage(1); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
                  aria-label="Filter invoices by source"
                >
                  <option value="all">All Sources</option>
                  <option value="internal">Internal Only</option>
                  <option value="refrens">Refrens Only</option>
                  <option value="sheets">Google Sheets Only</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSyncRefrens}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all disabled:opacity-50"
                  aria-label="Sync invoices from Refrens"
                >
                  {isLoading ? '⏳ Syncing...' : '🔄 Sync Refrens'}
                </button>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-slate-500">
              Showing {paginatedInvoices.length} of {filteredInvoices.length} invoices
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </div>
          </div>

          {/* Invoice List */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">All Invoices</h3>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-2">💰</div>
                <p className="text-sm">No invoices found</p>
                <p className="text-xs mt-1">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedInvoices.map(invoice => (
                  <div key={invoice.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-white">{invoice.invoiceNumber}</h4>
                          {invoice.source === 'refrens' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              REFRENS
                            </span>
                          )}
                          {invoice.source === 'sheets' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                              SHEETS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{invoice.client}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{invoice.project}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] text-slate-500">Amount</p>
                        <p className="text-sm text-[#EBC07E] font-bold">{formatCurrency(invoice.amount, invoice.currency)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Issued</p>
                        <p className="text-xs text-white">{new Date(invoice.issuedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Due</p>
                        <p className="text-xs text-white">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Payment</p>
                        <p className={`text-xs font-semibold ${
                          invoice.paymentStatus === 'paid' ? 'text-green-400' :
                          invoice.paymentStatus === 'overdue' ? 'text-red-400' :
                          'text-amber-400'
                        }`}>
                          {invoice.paymentStatus?.toUpperCase() || 'UNKNOWN'}
                        </p>
                      </div>
                    </div>
                    {invoice.paidAmount !== undefined && invoice.paidAmount > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/30">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-slate-500">Paid</p>
                            <p className="text-xs text-green-400 font-semibold">{formatCurrency(invoice.paidAmount, invoice.currency)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500">Outstanding</p>
                            <p className="text-xs text-amber-400 font-semibold">{formatCurrency(invoice.outstandingAmount || 0, invoice.currency)}</p>
                          </div>
                        </div>
                        {invoice.paidDate && (
                          <p className="text-[10px] text-green-400 mt-2">✓ Paid on {new Date(invoice.paidDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                    {invoice.sourceUrl && (
                      <div className="mt-2 pt-2 border-t border-slate-700/30">
                        <a 
                          href={invoice.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-400 hover:text-blue-300"
                        >
                          🔗 View in Refrens
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">All Expenses</h3>
          <div className="space-y-3">
            {expenses.map(expense => (
              <div key={expense.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{expense.category}</h4>
                    <p className="text-xs text-slate-400 mt-1">{expense.description}</p>
                    {expense.project && <p className="text-[10px] text-slate-500 mt-1">Project: {expense.project}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    expense.approved ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {expense.approved ? 'APPROVED' : 'PENDING'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500">Amount</p>
                    <p className="text-sm text-red-400 font-bold">{formatCurrency(expense.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Date</p>
                    <p className="text-xs text-white">{new Date(expense.date).toLocaleDateString()}</p>
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
          <h3 className="text-sm font-bold text-white mb-4">Cash Flow Analysis</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-xs text-slate-400 mb-1">Cash Inflow</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs text-slate-400 mb-1">Cash Outflow</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#CA9332]/5 border border-[#CA9332]/20">
              <p className="text-xs text-slate-400 mb-1">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(netCashFlow)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-xs text-slate-400 mb-1">Accounts Receivable</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalOutstanding)}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {invoices.filter(inv => inv.status === 'overdue').length} overdue invoice(s)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
