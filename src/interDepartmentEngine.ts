/**
 * Inter-Department Communication System
 * Enables real-time collaboration between departments
 */

import { departments } from './data';

export interface DepartmentMessage {
  id: string;
  fromDepartment: string;
  fromAgent: string;
  fromAvatar: string;
  toDepartment: string;
  toAgent?: string; // Optional: specific agent or whole department
  message: string;
  type: 'request' | 'response' | 'update' | 'alert' | 'collaboration';
  priority: 'urgent' | 'normal' | 'low';
  timestamp: Date;
  status: 'sent' | 'received' | 'acknowledged' | 'completed';
  relatedTask?: string;
}

export interface CollaborationSession {
  id: string;
  title: string;
  departments: string[];
  agents: string[];
  status: 'active' | 'completed' | 'paused';
  startTime: Date;
  messages: DepartmentMessage[];
  objective: string;
}

class InterDepartmentEngine {
  private messages: DepartmentMessage[] = [];
  private collaborations: CollaborationSession[] = [];
  private intervalId: number | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.startCommunication();
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
   * Start inter-department communication
   */
  private startCommunication() {
    // Departments communicate every 8-20 seconds
    this.intervalId = setInterval(() => {
      this.simulateDepartmentInteraction();
    }, Math.random() * 12000 + 8000);
  }

  /**
   * Stop communication
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Simulate department interaction
   */
  private simulateDepartmentInteraction() {
    const allAgents = departments.flatMap(d => d.agents);
    const activeAgents = allAgents.filter(a => a.status === 'on-duty');
    
    if (activeAgents.length < 2) return;

    // Pick two random agents from different departments
    const agent1 = activeAgents[Math.floor(Math.random() * activeAgents.length)];
    const otherDepartments = activeAgents.filter(a => a.departmentId !== agent1.departmentId);
    
    if (otherDepartments.length === 0) return;
    
    const agent2 = otherDepartments[Math.floor(Math.random() * otherDepartments.length)];
    
    // Generate interaction
    const message = this.generateDepartmentMessage(agent1, agent2);
    this.messages.unshift(message);
    
    // Keep only last 100 messages
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(0, 100);
    }

    // Sometimes start a collaboration session
    if (Math.random() < 0.2 && this.collaborations.filter(c => c.status === 'active').length < 3) {
      const collab = this.startCollaboration(agent1, agent2);
      this.collaborations.unshift(collab);
      
      // Keep only last 10 collaborations
      if (this.collaborations.length > 10) {
        this.collaborations = this.collaborations.slice(0, 10);
      }
    }

    this.notify();
  }

  /**
   * Generate a department message
   */
  private generateDepartmentMessage(fromAgent: any, toAgent: any): DepartmentMessage {
    const fromDept = departments.find(d => d.id === fromAgent.departmentId);
    const toDept = departments.find(d => d.id === toAgent.departmentId);
    
    const messageTemplates = [
      {
        type: 'request' as const,
        messages: [
          `Need your input on ${fromAgent.tasks[0]?.title || 'current project'}`,
          `Can you review the ${fromDept?.name} documentation?`,
          `Requesting approval for ${fromAgent.tasks[0]?.title || 'proposal'}`,
          `Need data from ${fromDept?.name} for quarterly report`,
        ],
      },
      {
        type: 'response' as const,
        messages: [
          `Here's the information you requested about ${toAgent.tasks[0]?.title || 'the project'}`,
          `Approved! You can proceed with the next steps`,
          `I've reviewed the documents, looks good to me`,
          `Data has been compiled and is ready for your review`,
        ],
      },
      {
        type: 'update' as const,
        messages: [
          `Update: ${fromAgent.tasks[0]?.title || 'Task'} is now 75% complete`,
          `Status update: We've completed the ${fromDept?.name} phase`,
          `Progress report: All ${fromDept?.name} tasks are on track`,
          `Milestone reached: ${fromAgent.tasks[0]?.title || 'Project'} phase 1 done`,
        ],
      },
      {
        type: 'alert' as const,
        messages: [
          `⚠️ Urgent: Need immediate attention on ${fromAgent.tasks[0]?.title || 'critical issue'}`,
          `🔔 Alert: Deadline approaching for ${fromDept?.name} deliverables`,
          `⚡ Priority: ${fromAgent.tasks[0]?.title || 'Task'} requires your input`,
          `🚨 Important: ${fromDept?.name} needs coordination on shared project`,
        ],
      },
      {
        type: 'collaboration' as const,
        messages: [
          `Let's collaborate on the upcoming ${toDept?.name} initiative`,
          `Can we schedule a sync about the cross-department project?`,
          `I'd like to coordinate our efforts on the Q4 planning`,
          `Let's align our timelines for the shared deliverables`,
        ],
      },
    ];

    const selectedType = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
    const selectedMessage = selectedType.messages[Math.floor(Math.random() * selectedType.messages.length)];

    return {
      id: `msg-${Date.now()}-${Math.random()}`,
      fromDepartment: fromDept?.name || 'Unknown',
      fromAgent: fromAgent.name,
      fromAvatar: fromAgent.avatar,
      toDepartment: toDept?.name || 'Unknown',
      toAgent: toAgent.name,
      message: selectedMessage,
      type: selectedType.type,
      priority: Math.random() < 0.2 ? 'urgent' : Math.random() < 0.5 ? 'normal' : 'low',
      timestamp: new Date(),
      status: 'sent',
      relatedTask: fromAgent.tasks[0]?.title,
    };
  }

  /**
   * Start a collaboration session
   */
  private startCollaboration(agent1: any, agent2: any): CollaborationSession {
    const dept1 = departments.find(d => d.id === agent1.departmentId);
    const dept2 = departments.find(d => d.id === agent2.departmentId);
    
    const objectives = [
      `Coordinate Q4 planning between ${dept1?.name} and ${dept2?.name}`,
      `Align timelines for cross-department project`,
      `Review and approve shared deliverables`,
      `Sync on upcoming initiatives and resource allocation`,
      `Collaborate on process improvement between departments`,
    ];

    return {
      id: `collab-${Date.now()}-${Math.random()}`,
      title: `${dept1?.name} × ${dept2?.name} Collaboration`,
      departments: [dept1?.name || '', dept2?.name || ''],
      agents: [agent1.name, agent2.name],
      status: 'active',
      startTime: new Date(),
      messages: [],
      objective: objectives[Math.floor(Math.random() * objectives.length)],
    };
  }

  /**
   * Get all messages
   */
  getMessages(): DepartmentMessage[] {
    return this.messages;
  }

  /**
   * Get messages for specific department
   */
  getDepartmentMessages(departmentName: string): DepartmentMessage[] {
    return this.messages.filter(
      m => m.fromDepartment === departmentName || m.toDepartment === departmentName
    );
  }

  /**
   * Get recent messages
   */
  getRecentMessages(count: number = 20): DepartmentMessage[] {
    return this.messages.slice(0, count);
  }

  /**
   * Get all collaborations
   */
  getCollaborations(): CollaborationSession[] {
    return this.collaborations;
  }

  /**
   * Get active collaborations
   */
  getActiveCollaborations(): CollaborationSession[] {
    return this.collaborations.filter(c => c.status === 'active');
  }

  /**
   * Send a message manually
   */
  sendMessage(message: Omit<DepartmentMessage, 'id' | 'timestamp' | 'status'>) {
    const newMessage: DepartmentMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      status: 'sent',
    };
    this.messages.unshift(newMessage);
    this.notify();
  }
}

// Singleton instance
export const interDepartmentEngine = new InterDepartmentEngine();
