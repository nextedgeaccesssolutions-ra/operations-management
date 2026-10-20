import { useState } from 'react';

interface Quotation {
  id: string;
  quoteNumber: string;
  client: string;
  project: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdDate: string;
  validUntil: string;
  items: { description: string; quantity: number; unit: string; unitPrice: number; total: number }[];
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
    ]
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
    ]
  }
];

export default function BOQModule() {
  const [quotations] = useState<Quotation[]>(sampleQuotations);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{quotations.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Quotations</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{quotations.filter(q => q.status === 'approved').length}</p>
          <p className="text-xs text-slate-400 mt-1">Approved</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-400">{quotations.filter(q => q.status === 'sent').length}</p>
          <p className="text-xs text-slate-400 mt-1">Pending</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-[#EBC07E]">{formatCurrency(quotations.reduce((sum, q) => sum + q.totalAmount, 0))}</p>
          <p className="text-xs text-slate-400 mt-1">Total Value</p>
        </div>
      </div>

      {/* Quotation List */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Quotations</h3>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all">
            + New Quotation
          </button>
        </div>
        <div className="space-y-3">
          {quotations.map(quote => (
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
          ))}
        </div>
      </div>

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
