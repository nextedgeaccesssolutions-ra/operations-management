/**
 * NEAS AI Virtual Office - Orchestration Engine
 * Central task management and agent coordination system
 */

import { Agent, getAgentById } from './agentRegistry';

export type TaskStatus = 
  | 'queued'
  | 'assigned'
  | 'in_progress'
  | 'waiting_for_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'blocked';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type ApprovalLevel = 1 | 2 | 3 | 4;

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedAgentId: string;
  createdBy: string;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  approvalLevel: ApprovalLevel;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  notes: string[];
  attachments: string[];
  tags: string[];
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  taskTitle: string;
  requestedBy: string;
  requestedByAgent: string;
  approvalLevel: ApprovalLevel;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionNotes?: string;
  actionDescription: string;
  impact: string;
  evidence: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorType: 'user' | 'agent' | 'system';
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  taskId?: string;
  messageType: 'request' | 'response' | 'notification' | 'escalation';
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  priority: TaskPriority;
}

class OrchestrationEngine {
  private tasks: Map<string, Task> = new Map();
  private approvals: Map<string, ApprovalRequest> = new Map();
  private auditLogs: AuditLog[] = [];
  private messages: AgentMessage[] = [];
  private taskCounter = 0;
  private approvalCounter = 0;
  private messageCounter = 0;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample tasks for each agent
    const sampleTasks: Partial<Task>[] = [
      {
        title: 'Prepare Q1 Executive Briefing',
        description: 'Compile comprehensive Q1 performance report with KPIs and recommendations',
        assignedAgentId: 'ceo-agent',
        department: 'executive',
        priority: 'high',
        status: 'in_progress',
        approvalLevel: 1,
        progress: 65,
        dueDate: '2024-02-15',
        tags: ['reporting', 'executive', 'quarterly']
      },
      {
        title: 'Monitor Tower Maintenance Project',
        description: 'Track progress of BGC Tower facade maintenance project',
        assignedAgentId: 'operations-agent',
        department: 'operations',
        priority: 'high',
        status: 'in_progress',
        approvalLevel: 1,
        progress: 45,
        dueDate: '2024-02-20',
        tags: ['project', 'monitoring', 'facade']
      },
      {
        title: 'Qualify New Lead - Ortigas Office',
        description: 'Assess new inquiry from Ortigas office building for facade cleaning',
        assignedAgentId: 'sales-agent',
        department: 'sales',
        priority: 'medium',
        status: 'queued',
        approvalLevel: 1,
        progress: 0,
        dueDate: '2024-02-10',
        tags: ['lead', 'qualification', 'ortigas']
      },
      {
        title: 'Prepare BOQ for Cebu Project',
        description: 'Create detailed bill of quantities for Cebu rope access project',
        assignedAgentId: 'estimating-agent',
        department: 'estimating',
        priority: 'high',
        status: 'in_progress',
        approvalLevel: 1,
        progress: 80,
        dueDate: '2024-02-12',
        tags: ['boq', 'estimating', 'cebu']
      },
      {
        title: 'Reconcile January Invoices',
        description: 'Reconcile all January invoices and prepare payment schedule',
        assignedAgentId: 'finance-agent',
        department: 'finance',
        priority: 'high',
        status: 'waiting_for_approval',
        approvalLevel: 3,
        approvalStatus: 'pending',
        progress: 90,
        dueDate: '2024-02-08',
        tags: ['finance', 'reconciliation', 'invoices']
      },
      {
        title: 'Update Employee Certification Records',
        description: 'Review and update all employee certification expiry dates',
        assignedAgentId: 'hr-agent',
        department: 'hr',
        priority: 'medium',
        status: 'in_progress',
        approvalLevel: 2,
        progress: 55,
        dueDate: '2024-02-18',
        tags: ['hr', 'certifications', 'compliance']
      },
      {
        title: 'Review Site Safety Inspection Report',
        description: 'Analyze latest safety inspection report and identify corrective actions',
        assignedAgentId: 'hse-agent',
        department: 'hse',
        priority: 'critical',
        status: 'in_progress',
        approvalLevel: 2,
        progress: 70,
        dueDate: '2024-02-09',
        tags: ['safety', 'inspection', 'compliance']
      },
      {
        title: 'Respond to Customer Complaint',
        description: 'Address customer complaint regarding project delay',
        assignedAgentId: 'customer-service-agent',
        department: 'customer-service',
        priority: 'critical',
        status: 'in_progress',
        approvalLevel: 3,
        approvalStatus: 'pending',
        progress: 40,
        dueDate: '2024-02-08',
        tags: ['customer', 'complaint', 'urgent']
      },
      {
        title: 'Create LinkedIn Campaign Draft',
        description: 'Draft LinkedIn marketing campaign for rope access services',
        assignedAgentId: 'marketing-agent',
        department: 'marketing',
        priority: 'medium',
        status: 'queued',
        approvalLevel: 3,
        progress: 0,
        dueDate: '2024-02-25',
        tags: ['marketing', 'linkedin', 'campaign']
      },
      {
        title: 'Compare Supplier Quotes for PPE',
        description: 'Analyze and compare quotes from 3 PPE suppliers',
        assignedAgentId: 'procurement-agent',
        department: 'procurement',
        priority: 'medium',
        status: 'in_progress',
        approvalLevel: 1,
        progress: 60,
        dueDate: '2024-02-14',
        tags: ['procurement', 'ppe', 'suppliers']
      }
    ];

    sampleTasks.forEach(taskData => {
      this.createTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'attachments' | 'dependencies'>);
    });

    // Create sample approval requests
    const sampleApprovals: Partial<ApprovalRequest>[] = [
      {
        taskId: this.getTasksByAgent('finance-agent')[0]?.id || '',
        taskTitle: 'Reconcile January Invoices',
        requestedBy: 'CEO',
        requestedByAgent: 'finance-agent',
        approvalLevel: 3,
        status: 'pending',
        actionDescription: 'Approve payment schedule for January invoices totaling ₱2.5M',
        impact: 'Financial commitment of ₱2.5M to suppliers and contractors',
        evidence: ['invoice_summary.pdf', 'payment_schedule.xlsx']
      },
      {
        taskId: this.getTasksByAgent('customer-service-agent')[0]?.id || '',
        taskTitle: 'Respond to Customer Complaint',
        requestedBy: 'CEO',
        requestedByAgent: 'customer-service-agent',
        approvalLevel: 3,
        status: 'pending',
        actionDescription: 'Send response email to customer regarding project delay',
        impact: 'External communication with client, potential compensation offer',
        evidence: ['complaint_email.eml', 'proposed_response.docx']
      }
    ];

    sampleApprovals.forEach(approvalData => {
      if (approvalData.taskId) {
        this.createApprovalRequest(approvalData as Omit<ApprovalRequest, 'id' | 'requestedAt'>);
      }
    });

    // Create sample audit logs
    const sampleLogs: Omit<AuditLog, 'id'>[] = [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actor: 'ARIA',
        actorType: 'agent',
        action: 'task_created',
        resource: 'task',
        resourceId: 'task-1',
        details: 'Created task: Prepare Q1 Executive Briefing',
        severity: 'info'
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        actor: 'LEDGER',
        actorType: 'agent',
        action: 'approval_requested',
        resource: 'approval',
        resourceId: 'approval-1',
        details: 'Requested approval for January invoice reconciliation',
        severity: 'info'
      },
      {
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        actor: 'system',
        actorType: 'system',
        action: 'email_synced',
        resource: 'email',
        resourceId: 'email-123',
        details: 'Synchronized 15 new emails from company inbox',
        severity: 'info'
      },
      {
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        actor: 'SHIELD',
        actorType: 'agent',
        action: 'safety_alert',
        resource: 'project',
        resourceId: 'project-456',
        details: 'Identified expired safety certification for 2 employees',
        severity: 'warning'
      }
    ];

    sampleLogs.forEach(log => {
      this.auditLogs.push({
        ...log,
        id: `audit-${Date.now()}-${Math.random()}`
      });
    });

    // Create sample messages
    const sampleMessages: Partial<AgentMessage>[] = [
      {
        fromAgentId: 'ceo-agent',
        toAgentId: 'operations-agent',
        messageType: 'request',
        subject: 'Urgent: Project Delay Investigation',
        content: 'Please investigate the delay on BGC Tower project and provide root cause analysis by EOD.',
        priority: 'high',
        read: false
      },
      {
        fromAgentId: 'sales-agent',
        toAgentId: 'estimating-agent',
        messageType: 'request',
        subject: 'Quotation Request - Ortigas Office',
        content: 'New lead received for Ortigas office facade cleaning. Please prepare preliminary estimate.',
        priority: 'medium',
        read: false
      },
      {
        fromAgentId: 'finance-agent',
        toAgentId: 'ceo-agent',
        messageType: 'notification',
        subject: 'Payment Approval Required',
        content: 'January invoice reconciliation complete. Awaiting your approval for ₱2.5M payment schedule.',
        priority: 'high',
        read: false
      }
    ];

    sampleMessages.forEach(msg => {
      this.messages.push({
        ...msg,
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString()
      } as AgentMessage);
    });
  }

  // Task Management
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'attachments' | 'dependencies'>): Task {
    this.taskCounter++;
    const task: Task = {
      ...taskData,
      id: `task-${this.taskCounter}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
      attachments: [],
      dependencies: []
    };

    this.tasks.set(task.id, task);
    this.addAuditLog('system', 'system', 'task_created', 'task', task.id, `Created task: ${task.title}`);
    
    return task;
  }

  updateTask(taskId: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(taskId, updatedTask);
    this.addAuditLog('system', 'system', 'task_updated', 'task', taskId, `Updated task: ${updatedTask.title}`);
    
    return updatedTask;
  }

  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) || null;
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByAgent(agentId: string): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.assignedAgentId === agentId);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  getTasksByDepartment(department: string): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.department === department);
  }

  getTasksByPriority(priority: TaskPriority): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.priority === priority);
  }

  assignTask(taskId: string, agentId: string): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const updatedTask = {
      ...task,
      assignedAgentId: agentId,
      status: 'assigned' as TaskStatus,
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(taskId, updatedTask);
    this.addAuditLog('system', 'system', 'task_assigned', 'task', taskId, `Assigned task to agent ${agentId}`);
    
    return updatedTask;
  }

  startTask(taskId: string): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const updatedTask = {
      ...task,
      status: 'in_progress' as TaskStatus,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(taskId, updatedTask);
    this.addAuditLog('agent', task.assignedAgentId, 'task_started', 'task', taskId, `Started task: ${task.title}`);
    
    return updatedTask;
  }

  completeTask(taskId: string): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const updatedTask = {
      ...task,
      status: 'completed' as TaskStatus,
      progress: 100,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(taskId, updatedTask);
    this.addAuditLog('agent', task.assignedAgentId, 'task_completed', 'task', taskId, `Completed task: ${task.title}`);
    
    return updatedTask;
  }

  // Approval Management
  createApprovalRequest(data: Omit<ApprovalRequest, 'id' | 'requestedAt'>): ApprovalRequest {
    this.approvalCounter++;
    const approval: ApprovalRequest = {
      ...data,
      id: `approval-${this.approvalCounter}`,
      requestedAt: new Date().toISOString()
    };

    this.approvals.set(approval.id, approval);
    this.addAuditLog('agent', approval.requestedByAgent, 'approval_requested', 'approval', approval.id, `Approval requested: ${approval.actionDescription}`);
    
    return approval;
  }

  approveRequest(approvalId: string, decidedBy: string, notes?: string): ApprovalRequest | null {
    const approval = this.approvals.get(approvalId);
    if (!approval) return null;

    const updatedApproval = {
      ...approval,
      status: 'approved' as const,
      decidedAt: new Date().toISOString(),
      decidedBy,
      decisionNotes: notes
    };

    this.approvals.set(approvalId, updatedApproval);
    
    // Update associated task
    if (approval.taskId) {
      this.updateTask(approval.taskId, {
        approvalStatus: 'approved',
        status: 'approved'
      });
    }

    this.addAuditLog('user', decidedBy, 'approval_granted', 'approval', approvalId, `Approved: ${approval.actionDescription}`);
    
    return updatedApproval;
  }

  rejectRequest(approvalId: string, decidedBy: string, notes?: string): ApprovalRequest | null {
    const approval = this.approvals.get(approvalId);
    if (!approval) return null;

    const updatedApproval = {
      ...approval,
      status: 'rejected' as const,
      decidedAt: new Date().toISOString(),
      decidedBy,
      decisionNotes: notes
    };

    this.approvals.set(approvalId, updatedApproval);
    
    // Update associated task
    if (approval.taskId) {
      this.updateTask(approval.taskId, {
        approvalStatus: 'rejected',
        status: 'rejected'
      });
    }

    this.addAuditLog('user', decidedBy, 'approval_rejected', 'approval', approvalId, `Rejected: ${approval.actionDescription}`);
    
    return updatedApproval;
  }

  getApproval(approvalId: string): ApprovalRequest | null {
    return this.approvals.get(approvalId) || null;
  }

  getAllApprovals(): ApprovalRequest[] {
    return Array.from(this.approvals.values());
  }

  getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.approvals.values()).filter(a => a.status === 'pending');
  }

  getApprovalsByLevel(level: ApprovalLevel): ApprovalRequest[] {
    return Array.from(this.approvals.values()).filter(a => a.approvalLevel === level);
  }

  // Audit Logging
  addAuditLog(
    actorType: 'user' | 'agent' | 'system',
    actor: string,
    action: string,
    resource: string,
    resourceId: string,
    details: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
    metadata?: Record<string, any>
  ): AuditLog {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      actorType,
      actor,
      action,
      resource,
      resourceId,
      details,
      severity,
      metadata
    };

    this.auditLogs.unshift(log);
    return log;
  }

  getAuditLogs(limit: number = 100): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  getAuditLogsByActor(actor: string): AuditLog[] {
    return this.auditLogs.filter(log => log.actor === actor);
  }

  getAuditLogsBySeverity(severity: 'info' | 'warning' | 'error' | 'critical'): AuditLog[] {
    return this.auditLogs.filter(log => log.severity === severity);
  }

  // Agent Messaging
  sendMessage(messageData: Omit<AgentMessage, 'id' | 'timestamp' | 'read'>): AgentMessage {
    this.messageCounter++;
    const message: AgentMessage = {
      ...messageData,
      id: `msg-${this.messageCounter}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.messages.push(message);
    this.addAuditLog('agent', message.fromAgentId, 'message_sent', 'message', message.id, `Message to ${message.toAgentId}: ${message.subject}`);
    
    return message;
  }

  getMessagesForAgent(agentId: string): AgentMessage[] {
    return this.messages.filter(m => m.toAgentId === agentId);
  }

  getUnreadMessages(agentId: string): AgentMessage[] {
    return this.messages.filter(m => m.toAgentId === agentId && !m.read);
  }

  markMessageAsRead(messageId: string): void {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.read = true;
    }
  }

  // Statistics and Reporting
  getTaskStatistics() {
    const allTasks = this.getAllTasks();
    return {
      total: allTasks.length,
      byStatus: {
        queued: allTasks.filter(t => t.status === 'queued').length,
        inProgress: allTasks.filter(t => t.status === 'in_progress').length,
        waitingForApproval: allTasks.filter(t => t.status === 'waiting_for_approval').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        failed: allTasks.filter(t => t.status === 'failed').length
      },
      byPriority: {
        critical: allTasks.filter(t => t.priority === 'critical').length,
        high: allTasks.filter(t => t.priority === 'high').length,
        medium: allTasks.filter(t => t.priority === 'medium').length,
        low: allTasks.filter(t => t.priority === 'low').length
      },
      averageProgress: allTasks.reduce((sum, t) => sum + t.progress, 0) / allTasks.length || 0
    };
  }

  getAgentWorkload(agentId: string) {
    const agentTasks = this.getTasksByAgent(agentId);
    return {
      total: agentTasks.length,
      active: agentTasks.filter(t => t.status === 'in_progress').length,
      queued: agentTasks.filter(t => t.status === 'queued').length,
      completed: agentTasks.filter(t => t.status === 'completed').length,
      waitingForApproval: agentTasks.filter(t => t.status === 'waiting_for_approval').length
    };
  }

  getDepartmentWorkload(department: string) {
    const deptTasks = this.getTasksByDepartment(department);
    return {
      total: deptTasks.length,
      active: deptTasks.filter(t => t.status === 'in_progress').length,
      queued: deptTasks.filter(t => t.status === 'queued').length,
      completed: deptTasks.filter(t => t.status === 'completed').length
    };
  }
}

// Export singleton instance
export const orchestrationEngine = new OrchestrationEngine();
