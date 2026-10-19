import React, { useState } from 'react';
import { useOperations } from '../OperationsContext';
import { departments, type TaskPriority } from '../data';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDepartment?: string;
}

export default function CreateTaskModal({ isOpen, onClose, defaultDepartment }: CreateTaskModalProps) {
  const { createTask } = useOperations();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(defaultDepartment || 'Operations');
  const [assignee, setAssignee] = useState('Dele Okafor');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [gated, setGated] = useState(false);
  const [dueDate, setDueDate] = useState('Today');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentDept = departments.find(d => d.name === department) || departments[0];

  const handleDepartmentChange = (newDeptName: string) => {
    setDepartment(newDeptName);
    const dept = departments.find(d => d.name === newDeptName);
    if (dept && dept.agents.length > 0) {
      setAssignee(dept.agents[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    await createTask({
      title: title.trim(),
      assignee,
      department,
      priority,
      gated,
      dueDate,
    });
    setSubmitting(false);
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 border-slate-700/60 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/40 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg">
              ＋
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dispatch New Task</h3>
              <p className="text-xs text-slate-400">Queue action item into operations roster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title & Scope
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Audit perimeter badge access logs for Facility B"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={e => handleDepartmentChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500/60 transition-colors"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.icon} {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500/60 transition-colors"
              >
                {currentDept.agents.map(a => (
                  <option key={a.id} value={a.name}>
                    {a.avatar} {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                      priority === p
                        ? p === 'critical'
                          ? 'bg-red-500/20 text-red-300 border-red-500/50'
                          : p === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : p === 'medium'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                          : 'bg-slate-700/40 text-slate-300 border-slate-600'
                        : 'bg-slate-800/40 text-slate-500 border-slate-700/50 hover:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Due Horizon
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                placeholder="e.g. Today, Tomorrow, Oct 25"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white flex items-center gap-1.5">
                <span>🔒</span> Require Human Sign-Off (Gated)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Task cannot be finalized without executive or department lead sign-off
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGated(!gated)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                gated ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  gated ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/40 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Dispatching...' : 'Dispatch Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
