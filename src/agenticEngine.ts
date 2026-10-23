/**
 * NEAS Agentic AI Engine
 * Simulates autonomous agent behavior for the virtual office
 */

import { departments, monitoredEmails, type Task, type Agent, type MonitoredEmail } from './data';

export interface AgentAction {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  target: string;
  timestamp: Date;
  status: 'completed' | 'in-progress' | 'pending';
}

export interface AgentThought {
  agentId: string;
  thought: string;
  timestamp: Date;
}

class AgenticEngine {
  private actions: AgentAction[] = [];
  private thoughts: AgentThought[] = [];
  private intervalId: number | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.startSimulation();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notify() {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Start autonomous agent simulation
   */
  private startSimulation() {
    // Agents perform actions every 5-15 seconds
    this.intervalId = setInterval(() => {
      this.simulateAgentActivity();
    }, Math.random() * 10000 + 5000);
  }

  /**
   * Stop simulation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Simulate agent activity
   */
  private simulateAgentActivity() {
    const allAgents = departments.flatMap(d => d.agents);
    const activeAgents = allAgents.filter(a => a.status === 'on-duty');
    
    if (activeAgents.length === 0) return;

    // Pick a random active agent
    const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
    
    // Agent performs an action
    const action = this.generateAgentAction(agent);
    this.actions.unshift(action);
    
    // Keep only last 50 actions
    if (this.actions.length > 50) {
      this.actions = this.actions.slice(0, 50);
    }

    // Agent has a thought
    const thought = this.generateAgentThought(agent);
    this.thoughts.unshift(thought);
    
    // Keep only last 20 thoughts
    if (this.thoughts.length > 20) {
      this.thoughts = this.thoughts.slice(0, 20);
    }

    this.notify();
  }

  /**
   * Generate an agent action
   */
  private generateAgentAction(agent: Agent): AgentAction {
    const actions = [
      { action: 'Processing task', target: agent.tasks[0]?.title || 'general work' },
      { action: 'Reviewing documents', target: `${agent.departmentId} documents` },
      { action: 'Communicating with team', target: 'team coordination' },
      { action: 'Analyzing data', target: `${agent.departmentId} metrics` },
      { action: 'Updating records', target: 'system records' },
      { action: 'Responding to inquiry', target: 'customer query' },
      { action: 'Preparing report', target: `${agent.departmentId} report` },
    ];

    const selected = actions[Math.floor(Math.random() * actions.length)];

    return {
      id: `action-${Date.now()}-${Math.random()}`,
      agentId: agent.id,
      agentName: agent.name,
      action: selected.action,
      target: selected.target,
      timestamp: new Date(),
      status: 'completed',
    };
  }

  /**
   * Generate an agent thought
   */
  private generateAgentThought(agent: Agent): AgentThought {
    const thoughts = [
      `I should prioritize the ${agent.tasks[0]?.title || 'urgent task'} today.`,
      `Need to coordinate with ${agent.departmentId} team on this.`,
      `This task requires human sign-off before proceeding.`,
      `I've completed the analysis, ready for review.`,
      `Waiting for input from the team before continuing.`,
      `The data looks good, proceeding with the next step.`,
      `I should document this process for future reference.`,
    ];

    return {
      agentId: agent.id,
      thought: thoughts[Math.floor(Math.random() * thoughts.length)],
      timestamp: new Date(),
    };
  }

  /**
   * Get all actions
   */
  getActions(): AgentAction[] {
    return this.actions;
  }

  /**
   * Get all thoughts
   */
  getThoughts(): AgentThought[] {
    return this.thoughts;
  }

  /**
   * Get actions for a specific agent
   */
  getAgentActions(agentId: string): AgentAction[] {
    return this.actions.filter(a => a.agentId === agentId);
  }

  /**
   * Get recent actions (last N)
   */
  getRecentActions(count: number = 10): AgentAction[] {
    return this.actions.slice(0, count);
  }
}

// Singleton instance
export const agenticEngine = new AgenticEngine();

/**
 * Simulate task progression
 */
export function simulateTaskProgress(task: Task): Task {
  const random = Math.random();
  
  // 10% chance to complete a running task
  if (task.status === 'running' && random < 0.1) {
    return { ...task, status: 'completed', completedAt: new Date().toISOString() };
  }
  
  // 5% chance to move queued to running
  if (task.status === 'queued' && random < 0.05) {
    return { ...task, status: 'running' };
  }
  
  return task;
}

/**
 * Simulate email processing
 */
export function simulateEmailProcessing(email: MonitoredEmail): MonitoredEmail {
  const random = Math.random();
  
  // 15% chance to mark unread as read
  if (email.status === 'unread' && random < 0.15) {
    return { ...email, status: 'read' };
  }
  
  // 5% chance to reply to read emails
  if (email.status === 'read' && random < 0.05) {
    return { ...email, status: 'replied' };
  }
  
  return email;
}

/**
 * Generate AI response for email
 */
export function generateAIResponse(email: MonitoredEmail): string {
  const responses: Record<string, string[]> = {
    urgent: [
      `Thank you for reaching out. I understand the urgency and am prioritizing this matter. Our team will respond within 2 hours with a resolution plan.`,
      `I've received your urgent request and am personally overseeing this. You'll hear from our senior team within the next hour.`,
    ],
    normal: [
      `Thank you for your message. I've reviewed the details and will get back to you with a comprehensive response within 24 hours.`,
      `I appreciate you reaching out. Our team is looking into this and will provide you with an update shortly.`,
    ],
    low: [
      `Thank you for your inquiry. We've noted your request and will address it during our next review cycle.`,
      `We've received your message and will respond as soon as possible. Thank you for your patience.`,
    ],
  };

  const priorityResponses = responses[email.priority] || responses.normal;
  return priorityResponses[Math.floor(Math.random() * priorityResponses.length)];
}
