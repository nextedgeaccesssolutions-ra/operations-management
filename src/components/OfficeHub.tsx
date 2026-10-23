import { useState } from 'react';
import { officeDevices, type OfficeDevice } from '../data';

export default function OfficeHub() {
  const [selectedType, setSelectedType] = useState<'all' | 'table' | 'laptop' | 'windows' | 'salas' | 'tv'>('all');
  const [selectedDevice, setSelectedDevice] = useState<OfficeDevice | null>(null);

  const filteredDevices = selectedType === 'all' 
    ? officeDevices 
    : officeDevices.filter(d => d.type === selectedType);

  const deviceStats = {
    table: officeDevices.filter(d => d.type === 'table').length,
    laptop: officeDevices.filter(d => d.type === 'laptop').length,
    windows: officeDevices.filter(d => d.type === 'windows').length,
    salas: officeDevices.filter(d => d.type === 'salas').length,
    tv: officeDevices.filter(d => d.type === 'tv').length,
  };

  const statusStats = {
    active: officeDevices.filter(d => d.status === 'active').length,
    idle: officeDevices.filter(d => d.status === 'idle').length,
    maintenance: officeDevices.filter(d => d.status === 'maintenance').length,
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      table: 'Tables',
      laptop: 'Laptops',
      windows: 'Windows',
      salas: 'Salas',
      tv: 'TVs',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'idle': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'maintenance': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border-blue-500/20!">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-2xl">
              🏢
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Virtual Office Hub</h2>
              <p className="text-xs text-slate-400">Office equipment and asset management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
              <span className="text-[10px] text-green-400 font-medium">All Systems Online</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-lg font-bold text-blue-400">{deviceStats.table}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Tables</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-lg font-bold text-purple-400">{deviceStats.laptop}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Laptops</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <p className="text-lg font-bold text-cyan-400">{deviceStats.windows}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Windows</p>
          </div>
          <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20">
            <p className="text-lg font-bold text-pink-400">{deviceStats.salas}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Salas</p>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <p className="text-lg font-bold text-orange-400">{deviceStats.tv}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">TVs</p>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
            <p className="text-lg font-bold text-green-400">{statusStats.active}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Active</p>
          </div>
          <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-lg font-bold text-yellow-400">{statusStats.idle}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Idle</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-lg font-bold text-red-400">{statusStats.maintenance}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Maintenance</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700/50 w-fit">
        <button
          onClick={() => setSelectedType('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedType === 'all'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
          }`}
        >
          <span>📊</span>
          <span>All ({officeDevices.length})</span>
        </button>
        <button
          onClick={() => setSelectedType('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedType === 'table'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
          }`}
        >
          <span>🪑</span>
          <span>Tables ({deviceStats.table})</span>
        </button>
        <button
          onClick={() => setSelectedType('laptop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedType === 'laptop'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
          }`}
        >
          <span>💻</span>
          <span>Laptops ({deviceStats.laptop})</span>
        </button>
        <button
          onClick={() => setSelectedType('windows')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedType === 'windows'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
          }`}
        >
          <span>🪟</span>
          <span>Windows ({deviceStats.windows})</span>
        </button>
        <button
          onClick={() => setSelectedType('salas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedType === 'salas'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
          }`}
        >
          <span>🛋️</span>
          <span>Salas ({deviceStats.salas})</span>
        </button>
        <button
          onClick={() => setSelectedType('tv')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedType === 'tv'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
          }`}
        >
          <span>📺</span>
          <span>TVs ({deviceStats.tv})</span>
        </button>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map((device) => (
          <div
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            className="glass-card rounded-xl p-5 cursor-pointer transition-all hover:border-blue-500/40! hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{device.icon}</div>
                <div>
                  <h3 className="text-sm font-bold text-white">{device.name}</h3>
                  <p className="text-[10px] text-slate-500">{device.location}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getStatusColor(device.status)}`}>
                {device.status}
              </span>
            </div>

            <div className="space-y-2">
              {device.department && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Department:</span>
                  <span className="text-[10px] text-slate-300">{device.department}</span>
                </div>
              )}
              {device.assignedTo && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Assigned to:</span>
                  <span className="text-[10px] text-slate-300">{device.assignedTo}</span>
                </div>
              )}
              {device.specs && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Specs:</span>
                  <span className="text-[10px] text-slate-300">{device.specs}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">Last checked:</span>
                <span className="text-[10px] text-slate-300">{device.lastChecked}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-full max-w-2xl border-blue-500/20!">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{selectedDevice.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedDevice.name}</h3>
                  <p className="text-xs text-slate-400">{selectedDevice.location}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDevice(null)}
                className="text-slate-500 hover:text-slate-300 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm text-white font-medium">{getTypeLabel(selectedDevice.type)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(selectedDevice.status)}`}>
                    {selectedDevice.status}
                  </span>
                </div>
              </div>

              {selectedDevice.department && (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Department</p>
                  <p className="text-sm text-white font-medium">{selectedDevice.department}</p>
                </div>
              )}

              {selectedDevice.assignedTo && (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Assigned To</p>
                  <p className="text-sm text-white font-medium">{selectedDevice.assignedTo}</p>
                </div>
              )}

              {selectedDevice.specs && (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Specifications</p>
                  <p className="text-sm text-white font-medium">{selectedDevice.specs}</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/20">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Checked</p>
                <p className="text-sm text-white font-medium">{selectedDevice.lastChecked}</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700/30 border border-slate-600/30 text-xs text-slate-400 font-medium hover:bg-slate-700/50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
