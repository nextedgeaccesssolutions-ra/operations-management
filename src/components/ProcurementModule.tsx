import { useState } from 'react';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  items: string[];
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received';
  orderDate: string;
  expectedDelivery: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  lastUpdated: string;
}

const samplePOs: PurchaseOrder[] = [
  {
    id: '1',
    poNumber: 'PO-2024-001',
    supplier: 'Safety Supplies Inc',
    items: ['Rope Access Kit x5', 'Safety Harness x10'],
    totalAmount: 125000,
    status: 'ordered',
    orderDate: '2024-02-01',
    expectedDelivery: '2024-02-15'
  },
  {
    id: '2',
    poNumber: 'PO-2024-002',
    supplier: 'Industrial Tools Corp',
    items: ['Power Drills x3', 'Grinding Wheels x50'],
    totalAmount: 85000,
    status: 'pending',
    orderDate: '2024-02-05',
    expectedDelivery: '2024-02-20'
  }
];

const sampleInventory: InventoryItem[] = [
  { id: '1', name: 'Rope Access Kit', category: 'Equipment', quantity: 12, unit: 'sets', minStock: 5, lastUpdated: '2024-02-08' },
  { id: '2', name: 'Safety Harness', category: 'PPE', quantity: 25, unit: 'pieces', minStock: 10, lastUpdated: '2024-02-07' },
  { id: '3', name: 'Carabiners', category: 'Equipment', quantity: 48, unit: 'pieces', minStock: 20, lastUpdated: '2024-02-06' },
  { id: '4', name: 'Cleaning Solutions', category: 'Materials', quantity: 8, unit: 'gallons', minStock: 10, lastUpdated: '2024-02-05' }
];

export default function ProcurementModule() {
  const [purchaseOrders] = useState<PurchaseOrder[]>(samplePOs);
  const [inventory] = useState<InventoryItem[]>(sampleInventory);
  const [activeTab, setActiveTab] = useState<'inventory' | 'purchase-orders' | 'suppliers'>('inventory');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ordered': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'received': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{inventory.length}</p>
          <p className="text-xs text-slate-400 mt-1">Inventory Items</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-red-400">{lowStockItems.length}</p>
          <p className="text-xs text-slate-400 mt-1">Low Stock Alerts</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-400">{purchaseOrders.length}</p>
          <p className="text-xs text-slate-400 mt-1">Active POs</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-[#EBC07E]">
            {formatCurrency(purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0))}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total PO Value</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700/50 w-fit">
        {(['inventory', 'purchase-orders', 'suppliers'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab ? 'bg-[#CA9332]/20 text-[#EBC07E] border border-[#CA9332]/30' : 'text-slate-400'
            }`}
          >
            {tab === 'purchase-orders' ? 'Purchase Orders' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Inventory Management</h3>
          <div className="space-y-3">
            {inventory.map(item => (
              <div key={item.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{item.category}</p>
                  </div>
                  {item.quantity <= item.minStock && (
                    <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                      LOW STOCK
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] text-slate-500">Current Stock</p>
                    <p className="text-sm text-white font-bold">{item.quantity} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Minimum Stock</p>
                    <p className="text-sm text-amber-400 font-bold">{item.minStock} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Last Updated</p>
                    <p className="text-xs text-white">{new Date(item.lastUpdated).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'purchase-orders' && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Purchase Orders</h3>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all">
              + New PO
            </button>
          </div>
          <div className="space-y-3">
            {purchaseOrders.map(po => (
              <div key={po.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{po.poNumber}</h4>
                    <p className="text-xs text-slate-400 mt-1">{po.supplier}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(po.status)}`}>
                    {po.status.toUpperCase()}
                  </span>
                </div>
                <div className="mb-3">
                  <p className="text-[10px] text-slate-500 mb-1">Items:</p>
                  <div className="flex flex-wrap gap-1">
                    {po.items.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-700/50 text-[10px] text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500">Total Amount</p>
                    <p className="text-sm text-[#EBC07E] font-bold">{formatCurrency(po.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Order Date</p>
                    <p className="text-xs text-white">{new Date(po.orderDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Expected Delivery</p>
                    <p className="text-xs text-white">{new Date(po.expectedDelivery).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Supplier Directory</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <h4 className="text-sm font-bold text-white">Safety Supplies Inc</h4>
              <p className="text-xs text-slate-400 mt-1">Contact: Juan Santos | juan@safetysupplies.com</p>
              <p className="text-[10px] text-slate-500 mt-1">Specialty: PPE, Safety Equipment</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-bold">APPROVED</span>
                <span className="text-[10px] text-slate-500">Rating: 4.8/5</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <h4 className="text-sm font-bold text-white">Industrial Tools Corp</h4>
              <p className="text-xs text-slate-400 mt-1">Contact: Maria Cruz | maria@industrialtools.com</p>
              <p className="text-[10px] text-slate-500 mt-1">Specialty: Power Tools, Equipment</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-bold">APPROVED</span>
                <span className="text-[10px] text-slate-500">Rating: 4.5/5</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
