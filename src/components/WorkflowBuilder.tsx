import { useState } from 'react';
import { orchestrationEngine } from '../neas/orchestrationEngine';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  steps: WorkflowStep[];
  executionCount: number;
  lastExecuted?: Date;
  successRate: number;
  createdBy: string;
  createdAt: Date;
}

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'approval' | 'notification';
  title: string;
  description: string;
  agent?: string;
  config: Record<string, any>;
}

const sampleWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'New Email Inquiry Processing',
    description: 'Automatically process incoming customer inquiries from email',
    trigger: 'New email received',
    status: 'active',
    steps: [
      {
        id: '1-1',
        type: 'trigger',
        title: 'Detect New Email',
        description: 'Monitor company inbox for new messages',
        config: { inbox: 'company.info.nextedgeaccesssolutions@gmail.com' }
      },
      {
        id: '1-2',
        type: 'action',
        title: 'Extract & Classify',
        description: 'Extract inquiry details and classify by type',
        agent: 'MERCURY',
        config: { classification: ['lead', 'project', 'billing', 'complaint'] }
      },
      {
        id: '1-3',
        type: 'condition',
        title: 'Check for Duplicates',
        description: 'Search CRM for existing contacts',
        agent: 'MERCURY',
        config: { searchFields: ['email', 'company', 'phone'] }
      },
      {
        id: '1-4',
        type: 'action',
        title: 'Create CRM Record',
        description: 'Create new contact and opportunity in CRM',
        agent: 'MERCURY',
        config: { autoCreate: true }
      },
      {
        id: '1-5',
        type: 'action',
        title: 'Assign to Sales Rep',
        description: 'Assign opportunity based on territory and service',
        agent: 'MERCURY',
        config: { assignmentRule: 'territory-based' }
      },
      {
        id: '1-6',
        type: 'action',
        title: 'Draft Response',
        description: 'Prepare professional response draft',
        agent: 'ECHO',
        config: { template: 'inquiry-response' }
      },
      {
        id: '1-7',
        type: 'approval',
        title: 'CEO Approval',
        description: 'Review and approve response before sending',
        config: { approver: 'CEO', timeout: '24h' }
      },
      {
        id: '1-8',
        type: 'action',
        title: 'Send Email',
        description: 'Send approved response to client',
        agent: 'ECHO',
        config: { viaGmail: true }
      },
      {
        id: '1-9',
        type: 'notification',
        title: 'Notify Sales Team',
        description: 'Alert assigned sales rep of new lead',
        config: { channel: 'email', recipients: ['sales-team@neas.com.ph'] }
      }
    ],
    executionCount: 47,
    lastExecuted: new Date('2024-02-08T10:30:00'),
    successRate: 94.5,
    createdBy: 'CEO',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Quotation Preparation & Approval',
    description: 'Automated workflow for preparing and approving quotations',
    trigger: 'Quotation requested',
    status: 'active',
    steps: [
      {
        id: '2-1',
        type: 'trigger',
        title: 'Quotation Request',
        description: 'Receive quotation request from sales or client',
        config: {}
      },
      {
        id: '2-2',
        type: 'action',
        title: 'Gather Requirements',
        description: 'Collect project specifications and requirements',
        agent: 'CALCULUS',
        config: {}
      },
      {
        id: '2-3',
        type: 'action',
        title: 'Prepare BOQ',
        description: 'Generate bill of quantities',
        agent: 'CALCULUS',
        config: { template: 'standard-boq' }
      },
      {
        id: '2-4',
        type: 'action',
        title: 'Calculate Costs',
        description: 'Calculate labor, materials, equipment costs',
        agent: 'CALCULUS',
        config: { includeOverhead: true, includeContingency: true }
      },
      {
        id: '2-5',
        type: 'action',
        title: 'Apply Markup',
        description: 'Apply standard markup and calculate final price',
        agent: 'CALCULUS',
        config: { markup: 0.25 }
      },
      {
        id: '2-6',
        type: 'approval',
        title: 'Finance Review',
        description: 'Finance manager reviews costing',
        config: { approver: 'Finance Manager', level: 2 }
      },
      {
        id: '2-7',
        type: 'approval',
        title: 'CEO Approval',
        description: 'CEO approves final quotation',
        config: { approver: 'CEO', level: 3 }
      },
      {
        id: '2-8',
        type: 'action',
        title: 'Generate Quotation Document',
        description: 'Create professional quotation PDF',
        agent: 'CALCULUS',
        config: { format: 'PDF', template: 'standard-quotation' }
      },
      {
        id: '2-9',
        type: 'action',
        title: 'Send to Client',
        description: 'Email quotation to client',
        agent: 'ECHO',
        config: { viaGmail: true }
      }
    ],
    executionCount: 23,
    lastExecuted: new Date('2024-02-07T14:20:00'),
    successRate: 91.3,
    createdBy: 'CEO',
    createdAt: new Date('2024-01-20')
  },
  {
    id: '3',
    name: 'Certification Expiry Alert',
    description: 'Monitor and alert on expiring employee certifications',
    trigger: 'Daily check at 8:00 AM',
    status: 'active',
    steps: [
      {
        id: '3-1',
        type: 'trigger',
        title: 'Daily Schedule',
        description: 'Run daily at 8:00 AM',
        config: { schedule: '0 8 * * *' }
      },
      {
        id: '3-2',
        type: 'action',
        title: 'Check Certifications',
        description: 'Review all employee certifications',
        agent: 'PEOPLE',
        config: { lookAhead: 30 } // days
      },
      {
        id: '3-3',
        type: 'condition',
        title: 'Identify Expiring',
        description: 'Filter certifications expiring within 30 days',
        agent: 'PEOPLE',
        config: {}
      },
      {
        id: '3-4',
        type: 'notification',
        title: 'Alert Employee',
        description: 'Notify employee of upcoming expiry',
        config: { channel: 'email', template: 'cert-expiry-reminder' }
      },
      {
        id: '3-5',
        type: 'notification',
        title: 'Alert Supervisor',
        description: 'Notify supervisor for planning',
        config: { channel: 'email' }
      },
      {
        id: '3-6',
        type: 'action',
        title: 'Create Training Task',
        description: 'Create task for certification renewal',
        agent: 'PEOPLE',
        config: { autoCreate: true }
      }
    ],
    executionCount: 156,
    lastExecuted: new Date('2024-02-08T08:00:00'),
    successRate: 100,
    createdBy: 'HR Manager',
    createdAt: new Date('2024-01-10')
  },
  {
    id: '4',
    name: 'Invoice Follow-up',
    description: 'Automated follow-up on overdue invoices',
    trigger: 'Daily check at 9:00 AM',
    status: 'paused',
    steps: [
      {
        id: '4-1',
        type: 'trigger',
        title: 'Daily Schedule',
        description: 'Run daily at 9:00 AM',
        config: { schedule: '0 9 * * *' }
      },
      {
        id: '4-2',
        type: 'action',
        title: 'Identify Overdue',
        description: 'Find invoices overdue by 7+ days',
        agent: 'LEDGER',
        config: { overdueDays: 7 }
      },
      {
        id: '4-3',
        type: 'action',
        title: 'Generate Reminder',
        description: 'Create payment reminder email',
        agent: 'LEDGER',
        config: { template: 'payment-reminder' }
      },
      {
        id: '4-4',
        type: 'approval',
        title: 'Finance Approval',
        description: 'Finance manager approves reminder',
        config: { approver: 'Finance Manager' }
      },
      {
        id: '4-5',
        type: 'action',
        title: 'Send Reminder',
        description: 'Email reminder to client',
        agent: 'ECHO',
        config: { viaGmail: true }
      }
    ],
    executionCount: 89,
    lastExecuted: new Date('2024-02-01T09:00:00'),
    successRate: 87.2,
    createdBy: 'Finance Manager',
    createdAt: new Date('2024-01-05')
  }
];

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>(sampleWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredWorkflows = workflows.filter(w => {
    if (filterStatus === 'all') return true;
    return w.status === filterStatus;
  });

  const handleToggleStatus = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id === workflowId) {
        const newStatus = w.status === 'active' ? 'paused' : 'active';
        orchestrationEngine.addAuditLog(
          'user',
          'CEO',
          'workflow_status_changed',
          'workflow',
          workflowId,
          `Workflow ${w.name} ${newStatus}`,
          'info'
        );
        return { ...w, status: newStatus };
      }
      return w;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'trigger': return '🎯';
      case 'condition': return '❓';
      case 'action': return '⚡';
      case 'approval': return '✓';
      case 'notification': return '🔔';
      default: return '📌';
    }
  };

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'border-purple-500/30 bg-purple-500/5';
      case 'condition': return 'border-blue-500/30 bg-blue-500/5';
      case 'action': return 'border-green-500/30 bg-green-500/5';
      case 'approval': return 'border-amber-500/30 bg-amber-500/5';
      case 'notification': return 'border-cyan-500/30 bg-cyan-500/5';
      default: return 'border-slate-700/30 bg-slate-800/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Workflow Builder</h2>
          <p className="text-xs text-slate-400 mt-1">Configure and manage automated business workflows</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all"
        >
          + Create Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{workflows.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Workflows</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{workflows.filter(w => w.status === 'active').length}</p>
          <p className="text-xs text-slate-400 mt-1">Active</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-[#EBC07E]">{workflows.reduce((sum, w) => sum + w.executionCount, 0)}</p>
          <p className="text-xs text-slate-400 mt-1">Total Executions</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-blue-400">
            {(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Avg Success Rate</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 space-y-3">
          {filteredWorkflows.map(workflow => (
            <div
              key={workflow.id}
              onClick={() => setSelectedWorkflow(workflow)}
              className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${
                selectedWorkflow?.id === workflow.id
                  ? 'border-[#CA9332]/30 bg-[#CA9332]/5'
                  : 'hover:border-slate-600/30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-white">{workflow.name}</h3>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(workflow.status)}`}>
                  {workflow.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{workflow.description}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{workflow.steps.length} steps</span>
                <span>{workflow.executionCount} executions</span>
                <span className="text-green-400">{workflow.successRate}% success</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          {selectedWorkflow ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedWorkflow.name}</h2>
                    <p className="text-xs text-slate-400 mt-1">{selectedWorkflow.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(selectedWorkflow.status)}`}>
                    {selectedWorkflow.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 mb-1">Trigger</p>
                  <p className="text-xs text-white">{selectedWorkflow.trigger}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 mb-1">Executions</p>
                  <p className="text-xs text-white">{selectedWorkflow.executionCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 mb-1">Success Rate</p>
                  <p className="text-xs text-green-400">{selectedWorkflow.successRate}%</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 mb-1">Last Executed</p>
                  <p className="text-xs text-white">
                    {selectedWorkflow.lastExecuted ? selectedWorkflow.lastExecuted.toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>

              {/* Workflow Steps */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Workflow Steps</h3>
                <div className="space-y-2">
                  {selectedWorkflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${getStepTypeColor(step.type)}`}>
                          <span className="text-sm">{getStepTypeIcon(step.type)}</span>
                        </div>
                        {index < selectedWorkflow.steps.length - 1 && (
                          <div className="w-0.5 h-8 bg-slate-700/30 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-semibold text-white">{step.title}</h4>
                          {step.agent && (
                            <span className="px-2 py-0.5 rounded bg-[#CA9332]/20 text-[#EBC07E] text-[9px] font-medium">
                              {step.agent}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700/30">
                <button
                  onClick={() => handleToggleStatus(selectedWorkflow.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedWorkflow.status === 'active'
                      ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {selectedWorkflow.status === 'active' ? '⏸ Pause' : '▶ Activate'}
                </button>
                <button className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all">
                  Edit Workflow
                </button>
                <button className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                  View Execution History
                </button>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="ml-auto px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">⚙️</div>
                <h3 className="text-lg font-bold text-white mb-2">Select a Workflow</h3>
                <p className="text-xs text-slate-400">Choose a workflow from the list to view details and steps</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-2xl w-full border border-[#CA9332]/20">
            <h2 className="text-xl font-bold text-white mb-4">Create New Workflow</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Workflow Name</label>
                <input
                  type="text"
                  placeholder="Enter workflow name..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Description</label>
                <textarea
                  placeholder="Describe what this workflow does..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Trigger</label>
                <select className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50">
                  <option>New email received</option>
                  <option>Daily schedule</option>
                  <option>Task completed</option>
                  <option>Manual trigger</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#CA9332] to-[#EBC07E] text-white text-xs font-medium hover:opacity-90 transition-all"
                >
                  Create Workflow
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
