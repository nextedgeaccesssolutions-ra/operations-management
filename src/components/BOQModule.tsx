import { useState, useEffect } from 'react';
import RefrensService, { RefrensQuotation } from '../services/refrensService';
import { orchestrationEngine } from '../neas/orchestrationEngine';

interface Quotation {
  id: string;
  quoteNumber: string;
  client: string;
  project: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'created' | 'won' | 'lost' | 'cancelled';
  createdDate: string;
  validUntil: string;
  items: { description: string; quantity: number; unit: string; unitPrice: number; total: number }[];
  source: 'internal' | 'refrens';
  sourceId?: string;
  sourceUrl?: string;
  currency: string;
}

const sampleQuotations: Quotation[] = [
  {
    id: '1',
    quoteNumber: 'QT-2024-001',
    client: 'BGC Tower Management',
    project: 'Facade Maintenance - 30 Floors',
    totalAmount: 2500000,
    status: 'approved',
    createdDate: '2024-01-10',
    validUntil: '2024-02-10',
    items: [
      { description: 'IRATA L3 Supervisor', quantity: 20, unit: 'days', unitPrice: 7500, total: 150000 },
      { description: 'IRATA L2 Technician', quantity: 40, unit: 'days', unitPrice: 3000, total: 120000 },
      { description: 'Rope Access Equipment', quantity: 1, unit: 'lot', unitPrice: 50000, total: 50000 }
    ],
    source: 'internal',
    currency: 'PHP'
  },
  {
    id: '2',
    quoteNumber: 'QT-2024-002',
    client: 'Ortigas Corporation',
    project: 'Office Facade Cleaning',
    totalAmount: 1500000,
    status: 'sent',
    createdDate: '2024-02-01',
    validUntil: '2024-03-01',
    items: [
      { description: 'IRATA L2 Supervisor', quantity: 15, unit: 'days', unitPrice: 3000, total: 45000 },
      { description: 'IRATA L1 Technician', quantity: 30, unit: 'days', unitPrice: 2500, total: 75000 }
    ],
    source: 'internal',
    currency: 'PHP'
  }
];

// Convert Refrens quotation to internal format
const convertRefrensQuotation = (refrensQuote: RefrensQuotation): Quotation => {
  return {
    id: refrensQuote.id,
    quoteNumber: refrensQuote.quotationNumber,
    client: refrensQuote.clientName,
    project: refrensQuote.projectName || 'N/A',
    totalAmount: refrensQuote.totalAmount,
    status: refrensQuote.status as Quotation['status'],
    createdDate: refrensQuote.issueDate,
    validUntil: refrensQuote.validUntil || '',
    items: refrensQuote.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.totalAmount
    })),
    source: 'refrens',
    sourceId: refrensQuote.sourceRecordId,
    sourceUrl: refrensQuote.sourceUrl,
    currency: refrensQuote.currency
  };
};

export default function BOQModule() {
  const [quotations, setQuotations] = useState<Quotation[]>(sampleQuotations);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'internal' | 'refrens'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load Refrens quotations on mount
  useEffect(() => {
    loadRefrensQuotations();
  }, []);

  const loadRefrensQuotations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const refrensQuotations = RefrensService.getQuotations();
      if (refrensQuotations.length > 0) {
        const converted = refrensQuotations.map(convertRefrensQuotation);
        // Merge with sample data, avoiding duplicates
        const merged = [...sampleQuotations];
        converted.forEach(refrensQuote => {
          if (!merged.find(q => q.sourceId === refrensQuote.sourceId)) {
            merged.push(refrensQuote);
          }
        });
        setQuotations(merged);
      }
    } catch (err) {
      setError('Failed to load Refrens quotations');
      console.error('[BOQModule] Load Refrens failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': case 'created': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'approved': case 'won': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': case 'lost': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Filter and sort quotations
  const filteredQuotations = quotations
    .filter(q => {
      const matchesSearch = searchQuery === '' || 
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
      const matchesSource = filterSource === 'all' || q.source === filterSource;
      return matchesSearch && matchesStatus && matchesSource;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      } else if (sortBy === 'amount') {
        return b.totalAmount - a.totalAmount;
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasRefrensData = quotations.some(q => q.source === 'refrens');
  const hasSampleData = quotations.some(q => q.source === 'internal');

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
      {(hasSampleData || hasRefrensData) && (
        <div className={`glass-card rounded-xl p-3 border-l-4 ${
          hasRefrensData ? 'border-l-blue-500 bg-blue-500/5' : 'border-l-amber-500 bg-amber-500/5'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{hasRefrensData ? '📑' : '⚠️'}</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">
                {hasRefrensData && hasSampleData ? 'MIXED DATA SOURCES' : 
                 hasRefrensData ? 'REFRENS DATA' : 'SAMPLE DATA'}
              </p>
              <p className="text-[10px] text-slate-400">
                {hasRefrensData && hasSampleData 
                  ? `Showing ${quotations.filter(q => q.source === 'refrens').length} Refrens + ${quotations.filter(q => q.source === 'internal').length} sample quotations`
                  : hasRefrensData
                  ? 'Quotations synced from Refrens. Backend API configuration required for real-time sync.'
                  : 'Quotations shown are sample data for demonstration. Real quotation data requires Refrens API integration.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{quotations.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Quotations</p>
          <p className="text-[9px] text-slate-500 mt-2">
            Source: {hasRefrensData ? 'Refrens + Internal' : 'Sample Data'} • Updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{quotations.filter(q => q.status === 'approved' || q.status === 'won').length}</p>
          <p className="text-xs text-slate-400 mt-1">Approved/Won</p>
          <p className="text-[9px] text-slate-500 mt-2">
            Source: {hasRefrensData ? 'Refrens + Internal' : 'Sample Data'} • Status: Actual
          </p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-400">{quotations.filter(q => q.status === 'sent').length}</p>
          <p className="text-xs text-slate-400 mt-1">Pending</p>
          <p className="text-[9px] text-slate-500 mt-2">
            Source: {hasRefrensData ? 'Refrens + Internal' : 'Sample Data'} • Status: Actual
          </p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-[#EBC07E]">{formatCurrency(quotations.reduce((sum, q) => sum + q.totalAmount, 0))}</p>
          <p className="text-xs text-slate-400 mt-1">Total Value</p>
          <p className="text-[9px] text-slate-500 mt-2">
            Source: {hasRefrensData ? 'Refrens + Internal' : 'Sample Data'} • Currency: PHP
          </p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search quotations..."
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50"
              aria-label="Search quotations by number, client, or project"
            />
            <label className="text-xs text-slate-400" htmlFor="quote-status-filter">Status:</label>
            <select
              id="quote-status-filter"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
              aria-label="Filter quotations by status"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="created">Created</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="won">Won</option>
              <option value="rejected">Rejected</option>
              <option value="lost">Lost</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <label className="text-xs text-slate-400" htmlFor="quote-source-filter">Source:</label>
            <select
              id="quote-source-filter"
              value={filterSource}
              onChange={(e) => { setFilterSource(e.target.value as any); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
              aria-label="Filter quotations by source"
            >
              <option value="all">All Sources</option>
              <option value="internal">Internal Only</option>
              <option value="refrens">Refrens Only</option>
            </select>
            <label className="text-xs text-slate-400" htmlFor="quote-sort">Sort:</label>
            <select
              id="quote-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
              aria-label="Sort quotations"
            >
              <option value="date">Date (Newest)</option>
              <option value="amount">Amount (Highest)</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadRefrensQuotations}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-all disabled:opacity-50"
              aria-label="Refresh quotations from Refrens"
            >
              {isLoading ? '⏳ Syncing...' : '🔄 Sync Refrens'}
            </button>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all">
              + New Quotation
            </button>
          </div>
        </div>
        <div className="mt-3 text-[10px] text-slate-500">
          Showing {paginatedQuotations.length} of {filteredQuotations.length} quotations
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
        </div>
      </div>

      {/* Quotation List */}
      <div className="glass-card rounded-xl p-6">
        <div className="space-y-3">
          {filteredQuotations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm">No quotations found</p>
              <p className="text-xs mt-1">Try adjusting your filters or search query</p>
            </div>
          ) : (
          paginatedQuotations.map(quote => (
            <div
              key={quote.id}
              onClick={() => setSelectedQuote(quote)}
              className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 cursor-pointer hover:border-[#CA9332]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{quote.quoteNumber}</h4>
                  <p className="text-xs text-slate-400 mt-1">{quote.client}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{quote.project}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(quote.status)}`}>
                  {quote.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-slate-500">Total Amount</p>
                  <p className="text-sm text-[#EBC07E] font-bold">{formatCurrency(quote.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Created</p>
                  <p className="text-xs text-white">{new Date(quote.createdDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Valid Until</p>
                  <p className="text-xs text-white">{new Date(quote.validUntil).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
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

      {/* Quotation Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#CA9332]/20">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedQuote.quoteNumber}</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedQuote.client}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedQuote.project}</p>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-[#EBC07E]">{formatCurrency(selectedQuote.totalAmount)}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Status</p>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getStatusColor(selectedQuote.status)}`}>
                  {selectedQuote.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Line Items</h3>
              <div className="space-y-2">
                {selectedQuote.items.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{item.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="text-sm text-[#EBC07E] font-bold">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-slate-700/30">
              <button className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all">
                Edit Quotation
              </button>
              <button className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all">
                Send to Client
              </button>
              <button className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                Download PDF
              </button>
              <button onClick={() => setSelectedQuote(null)} className="ml-auto px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
