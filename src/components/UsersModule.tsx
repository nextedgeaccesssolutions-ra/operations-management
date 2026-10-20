import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ceo' | 'manager' | 'employee' | 'client' | 'supplier';
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  department?: string;
}

const sampleUsers: User[] = [
  { id: '1', name: 'John CEO', email: 'ceo@neas.com.ph', role: 'ceo', status: 'active', lastLogin: '2024-02-08T10:30:00' },
  { id: '2', name: 'Maria Manager', email: 'maria@neas.com.ph', role: 'manager', status: 'active', lastLogin: '2024-02-08T09:15:00', department: 'Operations' },
  { id: '3', name: 'Juan Employee', email: 'juan@neas.com.ph', role: 'employee', status: 'active', lastLogin: '2024-02-07T16:45:00', department: 'Sales' },
  { id: '4', name: 'Ana Client', email: 'ana@client.com', role: 'client', status: 'active', lastLogin: '2024-02-06T14:20:00' },
  { id: '5', name: 'Pedro Supplier', email: 'pedro@supplier.com', role: 'supplier', status: 'pending', lastLogin: '2024-02-01T11:00:00' }
];

export default function UsersModule() {
  const [users] = useState<User[]>(sampleUsers);
  const [filterRole, setFilterRole] = useState<string>('all');

  const filteredUsers = users.filter(u => filterRole === 'all' || u.role === filterRole);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ceo': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'manager': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'employee': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'client': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'supplier': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'inactive': return 'bg-slate-500/20 text-slate-400';
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* The list below is a fixed sample compiled into the build, not the
          accounts that can actually sign in. Those live in the account store
          and are managed under Access Requests. Saying so here keeps this
          screen from reading as a real access-control surface. */}
      <div className="glass-card rounded-xl p-4 border border-amber-500/30">
        <p className="text-xs text-amber-200 leading-relaxed">
          <strong>These are sample people, not sign-in accounts.</strong> This directory is a
          fixed list compiled into the build. The accounts that can actually sign in to this
          deployment, and the requests waiting on a decision, are under{' '}
          <strong>Access Requests</strong>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{users.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Users</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{users.filter(u => u.status === 'active').length}</p>
          <p className="text-xs text-slate-400 mt-1">Active Users</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-amber-400">{users.filter(u => u.status === 'pending').length}</p>
          <p className="text-xs text-slate-400 mt-1">Pending Approval</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-purple-400">{new Set(users.map(u => u.role)).size}</p>
          <p className="text-xs text-slate-400 mt-1">User Roles</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Filter by Role:</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
          >
            <option value="all">All Roles</option>
            <option value="ceo">CEO</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
            <option value="client">Client</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">User Management</h3>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all">
            + Add User
          </button>
        </div>
        <div className="space-y-3">
          {filteredUsers.map(user => (
            <div key={user.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{user.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{user.email}</p>
                  {user.department && <p className="text-[10px] text-slate-500 mt-1">{user.department}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getRoleColor(user.role)}`}>
                    {user.role.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusColor(user.status)}`}>
                    {user.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Last login: {new Date(user.lastLogin).toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all">
                    Edit
                  </button>
                  {user.status === 'pending' && (
                    <button className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all">
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
