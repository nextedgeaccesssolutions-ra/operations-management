import { useState } from 'react';
import { orchestrationEngine, type ApprovalRequest, type ApprovalLevel } from '../neas/orchestrationEngine';
import { getAgentById } from '../neas/agentRegistry';

export default function ApprovalInbox() {
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [filterLevel, setFilterLevel] = useState<ApprovalLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');

  const allApprovals = orchestrationEngine.getAllApprovals();
  
  const filteredApprovals = allApprovals.filter(approval => {
    if (filterLevel !== 'all' && approval.approvalLevel !== filterLevel) return false;
    if (filterStatus !== 'all' && approval.status !== filterStatus) return false;
    return true;
  });

  const pendingApprovals = filteredApprovals.filter(a => a.status === 'pending');
  const approvedApprovals = filteredApprovals.filter(a => a.status === 'approved');
  const rejectedApprovals = filteredApprovals.filter(a => a.status === 'rejected');

  const handleApprove = (approvalId: string) => {
    orchestrationEngine.approveRequest(approvalId, 'CEO', decisionNotes);
    setShowDecisionModal(false);
    setDecisionNotes('');
    setSelectedApproval(null);
  };

  const handleReject = (approvalId: string) => {
    orchestrationEngine.rejectRequest(approvalId, 'CEO', decisionNotes);
    setShowDecisionModal(false);
    setDecisionNotes('');
    setSelectedApproval(null);
  };

  const getLevelColor = (level: ApprovalLevel) => {
    switch (level) {
      case 1: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 2: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 3: return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 4: return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const getLevelDescription = (level: ApprovalLevel) => {
    switch (level) {
      case 1: return 'Read & Analyze';
      case 2: return 'Internal Execution';
      case 3: return 'Human Approval Required';
      case 4: return 'Restricted - CEO Only';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-3xl font-bold text-white">{pendingApprovals.length}</p>
          <p className="text-xs text-slate-400 mt-1">Pending Approval</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-3xl font-bold text-white">{approvedApprovals.length}</p>
          <p className="text-xs text-slate-400 mt-1">Approved</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">✕</span>
          </div>
          <p className="text-3xl font-bold text-white">{rejectedApprovals.length}</p>
          <p className="text-xs text-slate-400 mt-1">Rejected</p>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-[#CA9332]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-white">{allApprovals.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Approval Level:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1 - Read & Analyze</option>
              <option value="2">Level 2 - Internal Execution</option>
              <option value="3">Level 3 - Human Approval</option>
              <option value="4">Level 4 - Restricted</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="ml-auto text-xs text-slate-400">
            Showing {filteredApprovals.length} of {allApprovals.length} requests
          </div>
        </div>
      </div>

      {/* Approval List */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>✓</span> Approval Requests
        </h3>
        <div className="space-y-3">
          {filteredApprovals.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">✓</div>
              <p>No approval requests found</p>
            </div>
          ) : (
            filteredApprovals.map(approval => {
              const agent = getAgentById(approval.requestedByAgent);
              return (
                <div
                  key={approval.id}
                  onClick={() => setSelectedApproval(approval)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedApproval?.id === approval.id
                      ? 'bg-[#CA9332]/10 border border-[#CA9332]/30'
                      : 'bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white">{approval.taskTitle}</h4>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getLevelColor(approval.approvalLevel)}`}>
                          Level {approval.approvalLevel}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          approval.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          approval.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {approval.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{approval.actionDescription}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{agent?.avatar}</span>
                      <div>
                        <p className="text-xs text-white font-medium">{agent?.name}</p>
                        <p className="text-[10px] text-slate-500">{agent?.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Requested: {new Date(approval.requestedAt).toLocaleDateString()}</span>
                      {approval.decidedAt && (
                        <>
                          <span>•</span>
                          <span>Decided: {new Date(approval.decidedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                    <p className="text-[10px] text-slate-500 mb-1">Impact:</p>
                    <p className="text-xs text-slate-300">{approval.impact}</p>
                  </div>

                  {approval.status === 'pending' && (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDecisionModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDecisionModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all"
                      >
                        ✕ Reject
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                        View Details
                      </button>
                    </div>
                  )}

                  {approval.status !== 'pending' && approval.decisionNotes && (
                    <div className="mt-3 p-2 rounded-lg bg-slate-900/30 border border-slate-700/20">
                      <p className="text-[10px] text-slate-500 mb-1">Decision Notes:</p>
                      <p className="text-xs text-slate-400">{approval.decisionNotes}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-2xl w-full border border-[#CA9332]/20">
            <h2 className="text-xl font-bold text-white mb-4">
              {selectedApproval.status === 'pending' ? 'Make Decision' : 'Decision Details'}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Request Details</h3>
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 space-y-2">
                  <div>
                    <p className="text-[10px] text-slate-500">Task</p>
                    <p className="text-xs text-white">{selectedApproval.taskTitle}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Action</p>
                    <p className="text-xs text-white">{selectedApproval.actionDescription}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Impact</p>
                    <p className="text-xs text-white">{selectedApproval.impact}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Approval Level</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelColor(selectedApproval.approvalLevel)}`}>
                      Level {selectedApproval.approvalLevel} - {getLevelDescription(selectedApproval.approvalLevel)}
                    </span>
                  </div>
                  {selectedApproval.evidence.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1">Evidence</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedApproval.evidence.map((doc, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-slate-700/50 text-[10px] text-slate-300">
                            📎 {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedApproval.status === 'pending' && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Decision Notes (Optional)</h3>
                  <textarea
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Add notes for your decision..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50 resize-none"
                    rows={4}
                  />
                </div>
              )}

              {selectedApproval.status !== 'pending' && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Decision</h3>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        selectedApproval.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedApproval.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">
                        by {selectedApproval.decidedBy} on {new Date(selectedApproval.decidedAt!).toLocaleString()}
                      </span>
                    </div>
                    {selectedApproval.decisionNotes && (
                      <p className="text-xs text-slate-300">{selectedApproval.decisionNotes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectedApproval.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleApprove(selectedApproval.id)}
                    className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedApproval.id)}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all"
                  >
                    ✕ Reject
                  </button>
                </>
              ) : null}
              <button
                onClick={() => {
                  setShowDecisionModal(false);
                  setDecisionNotes('');
                }}
                className="ml-auto px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
