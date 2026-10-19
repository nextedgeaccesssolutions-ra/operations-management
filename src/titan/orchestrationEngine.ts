/**
 * PROJECT TITAN - Multi-Agent Orchestration Engine
 * Core orchestration system for coordinating AI agents
 */

export type TaskStatus = 
  | 'NEW'
  | 'PLANNING'
  | 'QUEUED'
  | 'RUNNING'
  | 'REVIEW'
  | 'REWORK_REQUIRED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type ActionClassification = 'A' | 'B' | 'C'; // A=Automatic, B=Approval Required, C=Prohibited

export interface Task {
  id: string;
  organizationId: string;
  parentTaskId?: string;
  createdByUserId: string;
  assignedAgentId?: string;
  taskType: string;
  title: string;
  objective: string;
  status: TaskStatus;
  priority: TaskPriority;
  inputReferences: string[];
  resultReference?: string;
  idempotencyKey: string;
  attemptCount: number;
  maxAttempts: number;
  deadlineAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  actionClassification: ActionClassification;
  estimatedCost?: number;
  actualCost?: number;
}

export interface TaskDependency {
  id: string;
  organizationId: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'blocking' | 'informational' | 'optional';
  createdAt: Date;
}

export interface TaskEvent {
  id: string;
  taskId: string;
  eventType: string;
  actorType: 'user' | 'agent' | 'system';
  actorId: string;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface AgentMessage {
  id: string;
  taskId: string;
  subtaskId?: string;
  senderAgentId: string;
  recipientAgentId: string;
  messageType: 
    | 'task_request'
    | 'task_acceptance'
    | 'task_progress'
    | 'information_request'
    | 'information_response'
    | 'review_request'
    | 'review_result'
    | 'approval_request'
    | 'approval_result'
    | 'risk_alert'
    | 'task_blocked'
    | 'task_completed'
    | 'task_failed'
    | 'cancellation_request';
  correlationId: string;
  priority: TaskPriority;
  payload: {
    objective?: string;
    inputReferences?: string[];
    constraints?: string[];
    expectedOutputSchema?: Record<string, any>;
    findings?: any;
    questions?: string[];
    risks?: string[];
    recommendations?: string[];
  };
  status: 'queued' | 'delivered' | 'read' | 'processed' | 'failed';
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  processedAt?: Date;
}

export interface ApprovalRequest {
  id: string;
  organizationId: string;
  taskId: string;
  requestedByAgentId: string;
  actionType: string;
  actionPayloadReference: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'delegated';
  assignedApproverId?: string;
  decisionReason?: string;
  expiresAt?: Date;
  createdAt: Date;
  decidedAt?: Date;
}

export interface AgentRun {
  id: string;
  taskId: string;
  agentId: string;
  agentVersion: string;
  modelProvider: string;
  modelIdentifier: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  estimatedCost?: number;
  toolCalls: ToolCall[];
  output?: any;
  error?: string;
}

export interface ToolCall {
  id: string;
  runId: string;
  toolName: string;
  input: Record<string, any>;
  output?: any;
  status: 'pending' | 'success' | 'failed';
  executedAt: Date;
  duration?: number;
}

export interface PolicyRule {
  id: string;
  organizationId: string;
  ruleType: string;
  condition: Record<string, any>;
  action: 'allow' | 'require_approval' | 'deny';
  approvalThreshold?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  eventType: string;
  actorType: 'user' | 'agent' | 'system';
  actorId: string;
  action: string;
  target: string;
  metadata: Record<string, any>;
  beforeState?: any;
  afterState?: any;
  createdAt: Date;
}

// Orchestration Engine Class
export class OrchestrationEngine {
  private tasks: Map<string, Task> = new Map();
  private dependencies: Map<string, TaskDependency[]> = new Map();
  private events: TaskEvent[] = [];
  private messages: AgentMessage[] = [];
  private approvals: Map<string, ApprovalRequest> = new Map();
  private runs: Map<string, AgentRun> = new Map();
  private policies: Map<string, PolicyRule[]> = new Map();
  private auditLog: AuditEvent[] = [];

  // Task Management
  async createTask(params: {
    organizationId: string;
    createdByUserId: string;
    taskType: string;
    title: string;
    objective: string;
    priority: TaskPriority;
    inputReferences?: string[];
    parentTaskId?: string;
    actionClassification: ActionClassification;
    deadlineAt?: Date;
  }): Promise<Task> {
    const taskId = this.generateId();
    const idempotencyKey = this.generateIdempotencyKey(params);
    
    // Check for duplicate
    for (const task of this.tasks.values()) {
      if (task.idempotencyKey === idempotencyKey) {
        return task;
      }
    }

    const task: Task = {
      id: taskId,
      organizationId: params.organizationId,
      parentTaskId: params.parentTaskId,
      createdByUserId: params.createdByUserId,
      taskType: params.taskType,
      title: params.title,
      objective: params.objective,
      status: 'NEW',
      priority: params.priority,
      inputReferences: params.inputReferences || [],
      idempotencyKey,
      attemptCount: 0,
      maxAttempts: 3,
      deadlineAt: params.deadlineAt,
      actionClassification: params.actionClassification,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, task);
    this.recordEvent(taskId, 'user', params.createdByUserId, 'task_created', 'NEW', 'NEW', { task });
    
    return task;
  }

  async updateTaskStatus(taskId: string, newStatus: TaskStatus, actorType: 'user' | 'agent' | 'system', actorId: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const previousStatus = task.status;
    task.status = newStatus;
    task.updatedAt = new Date();

    if (newStatus === 'RUNNING' && !task.startedAt) {
      task.startedAt = new Date();
    }

    if (['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(newStatus)) {
      task.completedAt = new Date();
    }

    this.recordEvent(taskId, actorType, actorId, 'status_changed', previousStatus, newStatus, {});
    
    return task;
  }

  async assignTask(taskId: string, agentId: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.assignedAgentId = agentId;
    task.updatedAt = new Date();

    this.recordEvent(taskId, 'system', 'orchestrator', 'task_assigned', task.status, task.status, { agentId });
    
    return task;
  }

  // Dependency Management
  async addDependency(taskId: string, dependsOnTaskId: string, dependencyType: 'blocking' | 'informational' | 'optional' = 'blocking'): Promise<TaskDependency> {
    // Check for circular dependencies
    if (this.hasCircularDependency(taskId, dependsOnTaskId)) {
      throw new Error('Circular dependency detected');
    }

    const task = this.tasks.get(taskId);
    const dependsOnTask = this.tasks.get(dependsOnTaskId);
    
    if (!task || !dependsOnTask) {
      throw new Error('Task not found');
    }

    if (task.organizationId !== dependsOnTask.organizationId) {
      throw new Error('Cross-organization dependencies not allowed');
    }

    const dependency: TaskDependency = {
      id: this.generateId(),
      organizationId: task.organizationId,
      taskId,
      dependsOnTaskId,
      dependencyType,
      createdAt: new Date(),
    };

    const existing = this.dependencies.get(taskId) || [];
    existing.push(dependency);
    this.dependencies.set(taskId, existing);

    return dependency;
  }

  async canTaskExecute(taskId: string): Promise<boolean> {
    const deps = this.dependencies.get(taskId) || [];
    
    for (const dep of deps) {
      if (dep.dependencyType === 'blocking') {
        const dependentTask = this.tasks.get(dep.dependsOnTaskId);
        if (!dependentTask || dependentTask.status !== 'COMPLETED') {
          return false;
        }
      }
    }
    
    return true;
  }

  // Message Management
  async sendMessage(params: {
    taskId: string;
    senderAgentId: string;
    recipientAgentId: string;
    messageType: AgentMessage['messageType'];
    priority: TaskPriority;
    payload: AgentMessage['payload'];
  }): Promise<AgentMessage> {
    const task = this.tasks.get(params.taskId);
    if (!task) throw new Error(`Task ${params.taskId} not found`);

    const message: AgentMessage = {
      id: this.generateId(),
      taskId: params.taskId,
      senderAgentId: params.senderAgentId,
      recipientAgentId: params.recipientAgentId,
      messageType: params.messageType,
      correlationId: this.generateId(),
      priority: params.priority,
      payload: params.payload,
      status: 'queued',
      createdAt: new Date(),
    };

    this.messages.push(message);
    
    return message;
  }

  async getMessagesForAgent(agentId: string, taskId?: string): Promise<AgentMessage[]> {
    return this.messages.filter(m => 
      m.recipientAgentId === agentId && 
      (!taskId || m.taskId === taskId) &&
      m.status === 'queued'
    );
  }

  async markMessageProcessed(messageId: string): Promise<void> {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.status = 'processed';
      message.processedAt = new Date();
    }
  }

  // Approval Management
  async requestApproval(params: {
    organizationId: string;
    taskId: string;
    requestedByAgentId: string;
    actionType: string;
    actionPayloadReference: string;
    riskLevel: ApprovalRequest['riskLevel'];
    assignedApproverId?: string;
    expiresAt?: Date;
  }): Promise<ApprovalRequest> {
    const approval: ApprovalRequest = {
      id: this.generateId(),
      organizationId: params.organizationId,
      taskId: params.taskId,
      requestedByAgentId: params.requestedByAgentId,
      actionType: params.actionType,
      actionPayloadReference: params.actionPayloadReference,
      riskLevel: params.riskLevel,
      status: 'pending',
      assignedApproverId: params.assignedApproverId,
      expiresAt: params.expiresAt,
      createdAt: new Date(),
    };

    this.approvals.set(approval.id, approval);
    
    // Update task status
    await this.updateTaskStatus(params.taskId, 'APPROVAL_REQUIRED', 'agent', params.requestedByAgentId);
    
    return approval;
  }

  async decideApproval(approvalId: string, decision: 'approved' | 'rejected', approverId: string, reason?: string): Promise<ApprovalRequest> {
    const approval = this.approvals.get(approvalId);
    if (!approval) throw new Error(`Approval ${approvalId} not found`);

    if (approval.status !== 'pending') {
      throw new Error(`Approval ${approvalId} is not pending`);
    }

    approval.status = decision;
    approval.decisionReason = reason;
    approval.decidedAt = new Date();

    // Update task status based on decision
    if (decision === 'approved') {
      await this.updateTaskStatus(approval.taskId, 'APPROVED', 'user', approverId);
    } else {
      await this.updateTaskStatus(approval.taskId, 'REJECTED', 'user', approverId);
    }

    this.recordAuditEvent(approval.organizationId, 'user', approverId, 'approval_decided', approval.actionType, { approvalId, decision, reason });
    
    return approval;
  }

  getPendingApprovals(organizationId?: string, approverId?: string): ApprovalRequest[] {
    return Array.from(this.approvals.values()).filter(a => 
      a.status === 'pending' &&
      (!organizationId || a.organizationId === organizationId) &&
      (!approverId || a.assignedApproverId === approverId)
    );
  }

  // Policy Evaluation
  async evaluateAction(organizationId: string, actionType: string, context: Record<string, any>): Promise<{ allowed: boolean; requiresApproval: boolean; riskLevel?: 'low' | 'medium' | 'high' | 'critical' }> {
    const policies = this.policies.get(organizationId) || [];
    
    for (const policy of policies) {
      if (!policy.isActive) continue;
      
      // Simple policy matching (in production, this would be more sophisticated)
      if (policy.ruleType === actionType) {
        if (policy.action === 'deny') {
          return { allowed: false, requiresApproval: false };
        }
        if (policy.action === 'require_approval') {
          return { allowed: true, requiresApproval: true, riskLevel: policy.riskLevel };
        }
      }
    }

    // Default: allow with no approval required
    return { allowed: true, requiresApproval: false };
  }

  // Agent Run Management
  async startAgentRun(params: {
    taskId: string;
    agentId: string;
    agentVersion: string;
    modelProvider: string;
    modelIdentifier: string;
  }): Promise<AgentRun> {
    const run: AgentRun = {
      id: this.generateId(),
      taskId: params.taskId,
      agentId: params.agentId,
      agentVersion: params.agentVersion,
      modelProvider: params.modelProvider,
      modelIdentifier: params.modelIdentifier,
      status: 'running',
      startedAt: new Date(),
      toolCalls: [],
    };

    this.runs.set(run.id, run);
    
    return run;
  }

  async completeAgentRun(runId: string, output: any, tokenUsage?: AgentRun['tokenUsage'], estimatedCost?: number): Promise<AgentRun> {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`Run ${runId} not found`);

    run.status = 'completed';
    run.completedAt = new Date();
    run.output = output;
    run.tokenUsage = tokenUsage;
    run.estimatedCost = estimatedCost;

    // Update task
    const task = this.tasks.get(run.taskId);
    if (task) {
      task.attemptCount++;
      if (estimatedCost) {
        task.actualCost = (task.actualCost || 0) + estimatedCost;
      }
    }

    return run;
  }

  async failAgentRun(runId: string, error: string): Promise<AgentRun> {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`Run ${runId} not found`);

    run.status = 'failed';
    run.completedAt = new Date();
    run.error = error;

    return run;
  }

  // Audit Logging
  private recordEvent(taskId: string, actorType: 'user' | 'agent' | 'system', actorId: string, eventType: string, previousStatus?: TaskStatus, newStatus?: TaskStatus, metadata: Record<string, any> = {}): void {
    const event: TaskEvent = {
      id: this.generateId(),
      taskId,
      eventType,
      actorType,
      actorId,
      previousStatus,
      newStatus,
      metadata,
      createdAt: new Date(),
    };

    this.events.push(event);
  }

  private recordAuditEvent(organizationId: string, actorType: 'user' | 'agent' | 'system', actorId: string, eventType: string, action: string, metadata: Record<string, any> = {}): void {
    const event: AuditEvent = {
      id: this.generateId(),
      organizationId,
      eventType,
      actorType,
      actorId,
      action,
      target: '',
      metadata,
      createdAt: new Date(),
    };

    this.auditLog.push(event);
  }

  // Query Methods
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getTasksByOrganization(organizationId: string): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.organizationId === organizationId);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  getTaskEvents(taskId: string): TaskEvent[] {
    return this.events.filter(e => e.taskId === taskId);
  }

  getAgentRuns(taskId?: string): AgentRun[] {
    return Array.from(this.runs.values()).filter(r => !taskId || r.taskId === taskId);
  }

  getAuditLog(organizationId?: string): AuditEvent[] {
    return this.auditLog.filter(e => !organizationId || e.organizationId === organizationId);
  }

  // Helper Methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateIdempotencyKey(params: any): string {
    const keyData = `${params.organizationId}-${params.taskType}-${params.title}-${params.objective}`;
    return btoa(keyData).substring(0, 32);
  }

  private hasCircularDependency(taskId: string, dependsOnTaskId: string, visited: Set<string> = new Set()): boolean {
    if (taskId === dependsOnTaskId) return true;
    if (visited.has(taskId)) return false;
    
    visited.add(taskId);
    
    const deps = this.dependencies.get(taskId) || [];
    for (const dep of deps) {
      if (this.hasCircularDependency(dep.dependsOnTaskId, dependsOnTaskId, visited)) {
        return true;
      }
    }
    
    return false;
  }
}

// Singleton instance
export const orchestrationEngine = new OrchestrationEngine();
