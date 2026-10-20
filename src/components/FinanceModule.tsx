import { useState, useEffect } from 'react';
import GoogleSheetsService, { FinancialRecord } from '../services/googleSheetsService';
import PersistenceService from '../services/persistenceService';

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: string;
  project: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  paidDate?: string;
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
      paidDate: r.approved ? r.date : undefined
    }));
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
    paidDate: '2024-02-15'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    client: 'Cebu Port Authority',
    project: 'Cebu Port Rope Access',
    amount: 400000,
    issuedDate: '2024-01-25',
    dueDate: '2024-02-25',
    status: 'sent'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    client: 'Ortigas Corporation',
    project: 'Ortigas Office Facade Cleaning',
    amount: 750000,
    issuedDate: '2024-02-01',
    dueDate: '2024-03-01',
    status: 'overdue'
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    client: 'Ayala Malls',
    project: 'Ayala Malls Waterproofing',
    amount: 600000,
    issuedDate: '2024-02-05',
    dueDate: '2024-03-05',
    status: 'draft'
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

  // Load real data from Google Sheets on mount
  useEffect(() => {
    const loadRealData = async () => {
      setIsLoading(true);
      try {
        const records = await GoogleSheetsService.getFinancialRecords();
        if (records.length > 0) {
          const convertedInvoices = convertToInvoices(records);
          const convertedExpenses = convertToExpenses(records);
          
          if (convertedInvoices.length > 0) {
            setInvoices(convertedInvoices);
            PersistenceService.saveModuleData('invoices', convertedInvoices);
          }
          if (convertedExpenses.length > 0) {
            setExpenses(convertedExpenses);
            PersistenceService.saveModuleData('expenses', convertedExpenses);
          }
          
          console.log('[FinanceModule] Loaded', records.length, 'financial records from Google Sheets');
        }
      } catch (error) {
        console.error('[FinanceModule] Failed to load real data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRealData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
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
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
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
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">All Invoices</h3>
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div key={invoice.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{invoice.invoiceNumber}</h4>
                    <p className="text-xs text-slate-400 mt-1">{invoice.client}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{invoice.project}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500">Amount</p>
                    <p className="text-sm text-[#EBC07E] font-bold">{formatCurrency(invoice.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Issued</p>
                    <p className="text-xs text-white">{new Date(invoice.issuedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Due</p>
                    <p className="text-xs text-white">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                {invoice.paidDate && (
                  <div className="mt-2 pt-2 border-t border-slate-700/30">
                    <p className="text-[10px] text-green-400">✓ Paid on {new Date(invoice.paidDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
