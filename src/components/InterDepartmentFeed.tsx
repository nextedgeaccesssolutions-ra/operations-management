import { useState, useEffect } from 'react';
import { interDepartmentEngine, type DepartmentMessage, type CollaborationSession } from '../interDepartmentEngine';
import { departments } from '../data';

export default function InterDepartmentFeed() {
  const [messages, setMessages] = useState<DepartmentMessage[]>([]);
  const [collaborations, setCollaborations] = useState<CollaborationSession[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'messages' | 'collaborations'>('messages');

  useEffect(() => {
    const unsubscribe = interDepartmentEngine.subscribe(() => {
      if (selectedDept === 'all') {
        setMessages(interDepartmentEngine.getRecentMessages(30));
      } else {
        setMessages(interDepartmentEngine.getDepartmentMessages(selectedDept).slice(0, 30));
      }
      setCollaborations(interDepartmentEngine.getCollaborations().slice(0, 10));
    });

    // Initial load
    if (selectedDept === 'all') {
      setMessages(interDepartmentEngine.getRecentMessages(30));
    } else {
      setMessages(interDepartmentEngine.getDepartmentMessages(selectedDept).slice(0, 30));
    }
    setCollaborations(interDepartmentEngine.getCollaborations().slice(0, 10));

    return () => {
      unsubscribe();
    };
  }, [selectedDept]);

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'request': return '📤';
      case 'response': return '📥';
      case 'update': return '📊';
      case 'alert': return '⚠️';
      case 'collaboration': return '🤝';
      default: return '💬';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500/50 bg-red-500/5';
      case 'normal': return 'border-blue-500/30 bg-blue-500/5';
      case 'low': return 'border-slate-600/30 bg-slate-800/20';
      default: return 'border-slate-600/30 bg-slate-800/20';
    }
  };

  const getDepartmentColor = (deptName: string) => {
    const dept = departments.find(d => d.name === deptName);
    return dept?.color || '#64748b';
  };

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            Inter-Department Communication
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Live collaboration between all departments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 status-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('messages')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'messages'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-300 bg-slate-800/30 border border-slate-700/30'
          }`}
        >
          💬 Messages ({messages.length})
        </button>
        <button
          onClick={() => setViewMode('collaborations')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === 'collaborations'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-300 bg-slate-800/30 border border-slate-700/30'
          }`}
        >
          🤝 Collaborations ({collaborations.filter(c => c.status === 'active').length})
        </button>
      </div>

      {/* Department Filter */}
      {viewMode === 'messages' && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedDept === 'all'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-300 bg-slate-800/30 border border-slate-700/30'
            }`}
          >
            All Departments
          </button>
          {departments.map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDept === dept.name
                  ? 'border'
                  : 'text-slate-400 hover:text-slate-300 bg-slate-800/30 border border-slate-700/30'
              }`}
              style={
                selectedDept === dept.name
                  ? {
                      backgroundColor: `${dept.color}20`,
                      color: dept.color,
                      borderColor: `${dept.color}40`,
                    }
                  : undefined
              }
            >
              {dept.icon} {dept.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'messages' ? (
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-slate-400">Waiting for inter-department messages...</p>
                <p className="text-xs text-slate-500 mt-2">Messages will appear here in real-time</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${getPriorityColor(msg.priority)}`}
                >
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{msg.fromAvatar}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{msg.fromAgent}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${getDepartmentColor(msg.fromDepartment)}20`,
                              color: getDepartmentColor(msg.fromDepartment),
                            }}
                          >
                            {msg.fromDepartment}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">
                            {getMessageTypeIcon(msg.type)} {msg.type}
                          </span>
                          <span className="text-xs text-slate-600">→</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${getDepartmentColor(msg.toDepartment)}20`,
                              color: getDepartmentColor(msg.toDepartment),
                            }}
                          >
                            {msg.toDepartment}
                          </span>
                          {msg.toAgent && (
                            <span className="text-xs text-slate-500">({msg.toAgent})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-500">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                      {msg.priority === 'urgent' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          URGENT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="pl-12">
                    <p className="text-sm text-slate-300 leading-relaxed">{msg.message}</p>
                    {msg.relatedTask && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Related:</span>
                        <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                          {msg.relatedTask}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {collaborations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🤝</div>
                <p className="text-slate-400">No active collaborations yet</p>
                <p className="text-xs text-slate-500 mt-2">Collaboration sessions will appear here</p>
              </div>
            ) : (
              collaborations.map((collab) => (
                <div
                  key={collab.id}
                  className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 transition-all hover:scale-[1.01]"
                >
                  {/* Collaboration Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        🤝 {collab.title}
                        {collab.status === 'active' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{collab.objective}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      Started {collab.startTime.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Departments & Agents */}
                  <div className="pl-2 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">Departments:</span>
                      {collab.departments.map((dept, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${getDepartmentColor(dept)}20`,
                            color: getDepartmentColor(dept),
                          }}
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">Agents:</span>
                      {collab.agents.map((agent, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded bg-slate-800/50 text-slate-300"
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-slate-700/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{messages.length}</div>
            <div className="text-xs text-slate-500">Messages</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {collaborations.filter(c => c.status === 'active').length}
            </div>
            <div className="text-xs text-slate-500">Active Collabs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{departments.length}</div>
            <div className="text-xs text-slate-500">Departments</div>
          </div>
        </div>
      </div>
    </div>
  );
}
