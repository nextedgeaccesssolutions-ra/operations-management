import { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  status: 'active' | 'on-leave' | 'terminated';
  hireDate: string;
  certifications: { name: string; expiryDate: string; status: 'valid' | 'expiring' | 'expired' }[];
  skills: string[];
}

const sampleEmployees: Employee[] = [
  {
    id: '1',
    name: 'Juan Dela Cruz',
    position: 'IRATA L2 Technician',
    department: 'Operations',
    status: 'active',
    hireDate: '2022-03-15',
    certifications: [
      { name: 'IRATA Level 2', expiryDate: '2025-06-30', status: 'valid' },
      { name: 'First Aid', expiryDate: '2024-12-31', status: 'expiring' }
    ],
    skills: ['Rope Access', 'Facade Cleaning', 'Safety Inspection']
  },
  {
    id: '2',
    name: 'Maria Santos',
    position: 'IRATA L3 Supervisor',
    department: 'Operations',
    status: 'active',
    hireDate: '2020-01-10',
    certifications: [
      { name: 'IRATA Level 3', expiryDate: '2026-03-15', status: 'valid' },
      { name: 'Safety Officer', expiryDate: '2025-09-30', status: 'valid' }
    ],
    skills: ['Team Leadership', 'Risk Assessment', 'Project Management']
  }
];

export default function HRModule() {
  const [employees] = useState<Employee[]>(sampleEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'on-leave': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'terminated': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getCertStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-500/20 text-green-400';
      case 'expiring': return 'bg-amber-500/20 text-amber-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{employees.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Employees</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{employees.filter(e => e.status === 'active').length}</p>
          <p className="text-xs text-slate-400 mt-1">Active</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-amber-400">
            {employees.reduce((sum, e) => sum + e.certifications.filter(c => c.status === 'expiring').length, 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Expiring Certs</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-red-400">
            {employees.reduce((sum, e) => sum + e.certifications.filter(c => c.status === 'expired').length, 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Expired Certs</p>
        </div>
      </div>

      {/* Employee List */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Employee Directory</h3>
        <div className="space-y-3">
          {employees.map(emp => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 cursor-pointer hover:border-[#CA9332]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{emp.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{emp.position} • {emp.department}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusColor(emp.status)}`}>
                  {emp.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {emp.certifications.map((cert, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded text-[9px] font-medium ${getCertStatusColor(cert.status)}`}>
                    {cert.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#CA9332]/20">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedEmployee.name}</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedEmployee.position}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedEmployee.department}</p>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Status</p>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(selectedEmployee.status)}`}>
                  {selectedEmployee.status.toUpperCase()}
                </span>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1">Hire Date</p>
                <p className="text-sm text-white">{new Date(selectedEmployee.hireDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Certifications</h3>
              <div className="space-y-2">
                {selectedEmployee.certifications.map((cert, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">{cert.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Expires: {new Date(cert.expiryDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[9px] font-bold ${getCertStatusColor(cert.status)}`}>
                        {cert.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {selectedEmployee.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-slate-800/30 border border-slate-700/30 text-xs text-white">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
