/**
 * NEAS AI Virtual Office - Agent Registry
 * Defines all 10 specialized AI agents with capabilities and permissions
 */

export type AgentLevel = 'executive' | 'manager' | 'specialist' | 'support';
export type AgentStatus = 'active' | 'idle' | 'busy' | 'offline' | 'error';
export type Department = 
  | 'executive'
  | 'operations'
  | 'sales'
  | 'estimating'
  | 'finance'
  | 'hr'
  | 'hse'
  | 'customer-service'
  | 'marketing'
  | 'procurement';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  tools: string[];
  permissions: string[];
  approvalLevel: 1 | 2 | 3 | 4;
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  department: Department;
  level: AgentLevel;
  status: AgentStatus;
  avatar: string;
  description: string;
  responsibilities: string[];
  capabilities: AgentCapability[];
  kpis: string[];
  escalationRules: string[];
  currentTasks: number;
  completedTasks: number;
  successRate: number;
}

export const agents: Agent[] = [
  {
    id: 'ceo-agent',
    name: 'ARIA',
    title: 'CEO & Executive Intelligence Agent',
    department: 'executive',
    level: 'executive',
    status: 'active',
    avatar: '👔',
    description: 'Strategic leadership and executive decision support',
    responsibilities: [
      'Provide consolidated daily executive briefing',
      'Summarize company emails, opportunities, and risks',
      'Assign tasks to AI agents and employees',
      'Monitor KPIs and operational performance',
      'Identify bottlenecks and recommend corrections',
      'Maintain approval inbox for important decisions',
      'Generate daily, weekly, and monthly reports'
    ],
    capabilities: [
      {
        id: 'executive-briefing',
        name: 'Executive Briefing Generation',
        description: 'Create comprehensive daily/weekly/monthly briefings',
        tools: ['email-reader', 'project-tracker', 'finance-tracker', 'task-manager'],
        permissions: ['read:all-departments', 'read:financials', 'read:projects'],
        approvalLevel: 1
      },
      {
        id: 'task-assignment',
        name: 'Task Assignment & Coordination',
        description: 'Assign and coordinate tasks across agents',
        tools: ['task-manager', 'agent-registry'],
        permissions: ['write:tasks', 'read:agents'],
        approvalLevel: 2
      },
      {
        id: 'kpi-monitoring',
        name: 'KPI Monitoring & Analysis',
        description: 'Track and analyze key performance indicators',
        tools: ['analytics-engine', 'report-generator'],
        permissions: ['read:all-metrics'],
        approvalLevel: 1
      }
    ],
    kpis: [
      'Briefing delivery rate',
      'Task assignment accuracy',
      'Bottleneck identification speed',
      'Decision turnaround time'
    ],
    escalationRules: [
      'Escalate to CEO for decisions > ₱500,000',
      'Escalate legal matters immediately',
      'Escalate safety incidents within 1 hour'
    ],
    currentTasks: 3,
    completedTasks: 142,
    successRate: 96.5
  },
  {
    id: 'operations-agent',
    name: 'ATLAS',
    title: 'Operations Manager AI',
    department: 'operations',
    level: 'manager',
    status: 'active',
    avatar: '⚙️',
    description: 'Project execution and resource coordination',
    responsibilities: [
      'Monitor active projects and work orders',
      'Create task plans and schedules',
      'Track manpower, equipment, and materials',
      'Flag delays and resource conflicts',
      'Prepare progress reports and Gantt charts',
      'Coordinate site supervisors and technicians',
      'Maintain project action register'
    ],
    capabilities: [
      {
        id: 'project-monitoring',
        name: 'Project Monitoring',
        description: 'Track project progress and identify issues',
        tools: ['project-tracker', 'gantt-chart', 's-curve-generator'],
        permissions: ['read:projects', 'read:resources'],
        approvalLevel: 1
      },
      {
        id: 'resource-allocation',
        name: 'Resource Allocation',
        description: 'Allocate manpower and equipment',
        tools: ['resource-manager', 'schedule-optimizer'],
        permissions: ['write:resources', 'read:availability'],
        approvalLevel: 2
      },
      {
        id: 'progress-reporting',
        name: 'Progress Reporting',
        description: 'Generate project progress reports',
        tools: ['report-generator', 'document-creator'],
        permissions: ['read:projects', 'write:reports'],
        approvalLevel: 2
      }
    ],
    kpis: [
      'On-time delivery rate',
      'Resource utilization',
      'Schedule adherence',
      'Issue resolution time'
    ],
    escalationRules: [
      'Escalate delays > 3 days to CEO',
      'Escalate safety incidents immediately',
      'Escalate resource conflicts to HR'
    ],
    currentTasks: 5,
    completedTasks: 89,
    successRate: 94.2
  },
  {
    id: 'sales-agent',
    name: 'MERCURY',
    title: 'Sales & Business Development AI',
    department: 'sales',
    level: 'manager',
    status: 'active',
    avatar: '📈',
    description: 'Lead generation and client relationship management',
    responsibilities: [
      'Monitor sales emails and inquiries',
      'Classify leads by industry and potential',
      'Create CRM records and follow-up tasks',
      'Prepare capability statements and proposals',
      'Track tender opportunities',
      'Recommend relevant NEAS services',
      'Manage quotation conversion'
    ],
    capabilities: [
      {
        id: 'lead-qualification',
        name: 'Lead Qualification',
        description: 'Classify and qualify incoming leads',
        tools: ['email-classifier', 'crm-manager'],
        permissions: ['read:emails', 'write:crm'],
        approvalLevel: 1
      },
      {
        id: 'proposal-drafting',
        name: 'Proposal Drafting',
        description: 'Create draft proposals and quotations',
        tools: ['document-creator', 'template-engine'],
        permissions: ['read:services', 'write:drafts'],
        approvalLevel: 2
      },
      {
        id: 'pipeline-management',
        name: 'Pipeline Management',
        description: 'Track and manage sales pipeline',
        tools: ['crm-manager', 'analytics-engine'],
        permissions: ['read:crm', 'write:crm'],
        approvalLevel: 1
      }
    ],
    kpis: [
      'Lead conversion rate',
      'Quotation turnaround time',
      'Pipeline value',
      'Client satisfaction'
    ],
    escalationRules: [
      'Escalate high-value opportunities (> ₱1M) to CEO',
      'Escalate client complaints immediately',
      'Escalate pricing decisions to Finance'
    ],
    currentTasks: 8,
    completedTasks: 156,
    successRate: 92.8
  },
  {
    id: 'estimating-agent',
    name: 'CALCULUS',
    title: 'Estimating & Commercial AI',
    department: 'estimating',
    level: 'specialist',
    status: 'active',
    avatar: '🧮',
    description: 'Cost estimation and quotation preparation',
    responsibilities: [
      'Prepare BOQs and material takeoffs',
      'Calculate labor and equipment costs',
      'Generate project budgets',
      'Create draft quotations',
      'Display assumptions and exclusions',
      'Flag incomplete specifications',
      'Support multiple project types'
    ],
    capabilities: [
      {
        id: 'boq-generation',
        name: 'BOQ Generation',
        description: 'Create bills of quantities',
        tools: ['estimating-engine', 'material-database'],
        permissions: ['read:projects', 'read:materials'],
        approvalLevel: 1
      },
      {
        id: 'cost-calculation',
        name: 'Cost Calculation',
        description: 'Calculate project costs and margins',
        tools: ['calculator', 'pricing-database'],
        permissions: ['read:costs', 'read:pricing'],
        approvalLevel: 1
      },
      {
        id: 'quotation-drafting',
        name: 'Quotation Drafting',
        description: 'Prepare draft quotations',
        tools: ['document-creator', 'template-engine'],
        permissions: ['read:projects', 'write:drafts'],
        approvalLevel: 3
      }
    ],
    kpis: [
      'Estimation accuracy',
      'Quotation turnaround time',
      'Win rate',
      'Margin achievement'
    ],
    escalationRules: [
      'All quotations require Finance approval',
      'Escalate uncertainties to Operations',
      'Escalate pricing disputes to CEO'
    ],
    currentTasks: 4,
    completedTasks: 203,
    successRate: 95.1
  },
  {
    id: 'finance-agent',
    name: 'LEDGER',
    title: 'Finance & Accounting AI',
    department: 'finance',
    level: 'manager',
    status: 'active',
    avatar: '💰',
    description: 'Financial control and accounting management',
    responsibilities: [
      'Organize invoices and purchase orders',
      'Prepare billing documents',
      'Track cash flow and budgets',
      'Monitor receivables and payables',
      'Reconcile financial records',
      'Flag overdue invoices',
      'Prepare financial reports'
    ],
    capabilities: [
      {
        id: 'invoice-management',
        name: 'Invoice Management',
        description: 'Process and track invoices',
        tools: ['invoice-processor', 'accounting-system'],
        permissions: ['read:invoices', 'write:invoices'],
        approvalLevel: 2
      },
      {
        id: 'cash-flow-tracking',
        name: 'Cash Flow Tracking',
        description: 'Monitor cash flow and forecasts',
        tools: ['analytics-engine', 'report-generator'],
        permissions: ['read:financials'],
        approvalLevel: 1
      },
      {
        id: 'payment-reminders',
        name: 'Payment Reminders',
        description: 'Generate payment reminder drafts',
        tools: ['email-drafter', 'accounting-system'],
        permissions: ['read:receivables', 'write:drafts'],
        approvalLevel: 3
      }
    ],
    kpis: [
      'Cash collection rate',
      'Invoice accuracy',
      'Budget variance',
      'Days sales outstanding'
    ],
    escalationRules: [
      'Escalate overdue invoices > 30 days to CEO',
      'All payments require CEO approval',
      'Escalate discrepancies immediately'
    ],
    currentTasks: 6,
    completedTasks: 178,
    successRate: 97.3
  },
  {
    id: 'hr-agent',
    name: 'PEOPLE',
    title: 'HR & Recruitment AI',
    department: 'hr',
    level: 'manager',
    status: 'active',
    avatar: '👥',
    description: 'Human resources and workforce management',
    responsibilities: [
      'Organize employee profiles and records',
      'Track certifications and training',
      'Draft job advertisements',
      'Support recruitment process',
      'Forecast manpower requirements',
      'Review timesheets',
      'Maintain confidential records'
    ],
    capabilities: [
      {
        id: 'employee-management',
        name: 'Employee Management',
        description: 'Manage employee records',
        tools: ['hr-system', 'document-manager'],
        permissions: ['read:employees', 'write:employees'],
        approvalLevel: 2
      },
      {
        id: 'certification-tracking',
        name: 'Certification Tracking',
        description: 'Track certifications and expiries',
        tools: ['alert-system', 'hr-system'],
        permissions: ['read:certifications'],
        approvalLevel: 1
      },
      {
        id: 'recruitment-support',
        name: 'Recruitment Support',
        description: 'Support hiring process',
        tools: ['job-board', 'document-creator'],
        permissions: ['read:positions', 'write:drafts'],
        approvalLevel: 3
      }
    ],
    kpis: [
      'Time to hire',
      'Employee retention rate',
      'Training completion rate',
      'Certification compliance'
    ],
    escalationRules: [
      'All hiring decisions require CEO approval',
      'Escalate disciplinary issues immediately',
      'Escalate safety certification expiries'
    ],
    currentTasks: 3,
    completedTasks: 94,
    successRate: 93.6
  },
  {
    id: 'hse-agent',
    name: 'SHIELD',
    title: 'HSE & Quality AI',
    department: 'hse',
    level: 'specialist',
    status: 'active',
    avatar: '🛡️',
    description: 'Health, safety, environment and quality assurance',
    responsibilities: [
      'Prepare risk assessments and method statements',
      'Create job safety analyses',
      'Track corrective actions',
      'Monitor audit findings',
      'Flag expired credentials',
      'Maintain safety documentation',
      'Support compliance requirements'
    ],
    capabilities: [
      {
        id: 'risk-assessment',
        name: 'Risk Assessment',
        description: 'Create risk assessments and JSA',
        tools: ['document-creator', 'risk-matrix'],
        permissions: ['read:projects', 'write:drafts'],
        approvalLevel: 2
      },
      {
        id: 'compliance-monitoring',
        name: 'Compliance Monitoring',
        description: 'Track compliance and certifications',
        tools: ['alert-system', 'document-manager'],
        permissions: ['read:certifications', 'read:audits'],
        approvalLevel: 1
      },
      {
        id: 'incident-reporting',
        name: 'Incident Reporting',
        description: 'Prepare incident reports',
        tools: ['document-creator', 'alert-system'],
        permissions: ['write:incidents'],
        approvalLevel: 3
      }
    ],
    kpis: [
      'Safety incident rate',
      'Compliance score',
      'Audit findings closure rate',
      'Training completion rate'
    ],
    escalationRules: [
      'All incidents require immediate CEO notification',
      'Safety documents require qualified human review',
      'Escalate expired certifications immediately'
    ],
    currentTasks: 2,
    completedTasks: 167,
    successRate: 98.1
  },
  {
    id: 'customer-service-agent',
    name: 'ECHO',
    title: 'Customer Service & AI Caller',
    department: 'customer-service',
    level: 'support',
    status: 'active',
    avatar: '🎧',
    description: 'Customer support and communication management',
    responsibilities: [
      'Classify customer inquiries',
      'Prepare professional responses',
      'Support AI voice agent for calls',
      'Schedule callbacks and appointments',
      'Record call outcomes',
      'Create CRM tasks',
      'Escalate complex issues'
    ],
    capabilities: [
      {
        id: 'inquiry-classification',
        name: 'Inquiry Classification',
        description: 'Classify and route customer inquiries',
        tools: ['email-classifier', 'crm-manager'],
        permissions: ['read:emails', 'write:crm'],
        approvalLevel: 1
      },
      {
        id: 'response-drafting',
        name: 'Response Drafting',
        description: 'Draft customer responses',
        tools: ['email-drafter', 'template-engine'],
        permissions: ['read:knowledge-base', 'write:drafts'],
        approvalLevel: 3
      },
      {
        id: 'appointment-scheduling',
        name: 'Appointment Scheduling',
        description: 'Schedule callbacks and meetings',
        tools: ['calendar-manager', 'crm-manager'],
        permissions: ['read:calendar', 'write:calendar'],
        approvalLevel: 2
      }
    ],
    kpis: [
      'Response time',
      'Customer satisfaction',
      'First contact resolution',
      'Escalation rate'
    ],
    escalationRules: [
      'Escalate complaints to Operations',
      'Escalate legal issues immediately',
      'Escalate emergencies to CEO'
    ],
    currentTasks: 7,
    completedTasks: 234,
    successRate: 91.4
  },
  {
    id: 'marketing-agent',
    name: 'PRISM',
    title: 'Marketing & SEO AI',
    department: 'marketing',
    level: 'specialist',
    status: 'active',
    avatar: '📣',
    description: 'Marketing content and digital presence',
    responsibilities: [
      'Generate SEO-focused content',
      'Create blog outlines and social posts',
      'Maintain content calendar',
      'Prepare keyword research',
      'Produce marketing campaigns',
      'Track campaign performance',
      'Support lead generation'
    ],
    capabilities: [
      {
        id: 'content-creation',
        name: 'Content Creation',
        description: 'Create marketing content',
        tools: ['content-generator', 'seo-analyzer'],
        permissions: ['read:services', 'write:drafts'],
        approvalLevel: 2
      },
      {
        id: 'seo-optimization',
        name: 'SEO Optimization',
        description: 'Optimize content for search',
        tools: ['seo-analyzer', 'keyword-researcher'],
        permissions: ['read:website', 'write:recommendations'],
        approvalLevel: 1
      },
      {
        id: 'campaign-management',
        name: 'Campaign Management',
        description: 'Plan and track marketing campaigns',
        tools: ['campaign-manager', 'analytics-engine'],
        permissions: ['read:campaigns', 'write:drafts'],
        approvalLevel: 3
      }
    ],
    kpis: [
      'Content engagement rate',
      'SEO ranking improvements',
      'Lead generation rate',
      'Campaign ROI'
    ],
    escalationRules: [
      'All published content requires CEO approval',
      'Escalate budget decisions to Finance',
      'Escalate brand issues to CEO'
    ],
    currentTasks: 4,
    completedTasks: 112,
    successRate: 90.7
  },
  {
    id: 'procurement-agent',
    name: 'SOURCE',
    title: 'Procurement & Inventory AI',
    department: 'procurement',
    level: 'specialist',
    status: 'active',
    avatar: '📦',
    description: 'Procurement management and inventory control',
    responsibilities: [
      'Track materials and equipment',
      'Monitor stock levels',
      'Compare supplier quotations',
      'Prepare purchase requests',
      'Link materials to projects',
      'Track supplier performance',
      'Support reorder decisions'
    ],
    capabilities: [
      {
        id: 'inventory-tracking',
        name: 'Inventory Tracking',
        description: 'Track materials and stock levels',
        tools: ['inventory-system', 'alert-system'],
        permissions: ['read:inventory', 'write:inventory'],
        approvalLevel: 1
      },
      {
        id: 'supplier-comparison',
        name: 'Supplier Comparison',
        description: 'Compare supplier quotations',
        tools: ['procurement-engine', 'analytics-engine'],
        permissions: ['read:suppliers', 'read:quotations'],
        approvalLevel: 1
      },
      {
        id: 'purchase-order-drafting',
        name: 'Purchase Order Drafting',
        description: 'Prepare draft purchase orders',
        tools: ['document-creator', 'procurement-engine'],
        permissions: ['read:inventory', 'write:drafts'],
        approvalLevel: 3
      }
    ],
    kpis: [
      'Cost savings achieved',
      'Supplier delivery performance',
      'Stock accuracy',
      'Procurement cycle time'
    ],
    escalationRules: [
      'All purchase orders require Finance approval',
      'Escalate stock-outs to Operations',
      'Escalate supplier issues to CEO'
    ],
    currentTasks: 5,
    completedTasks: 145,
    successRate: 94.8
  }
];

export function getAgentById(id: string): Agent | undefined {
  return agents.find(agent => agent.id === id);
}

export function getAgentsByDepartment(department: Department): Agent[] {
  return agents.filter(agent => agent.department === department);
}

export function getAgentsByLevel(level: AgentLevel): Agent[] {
  return agents.filter(agent => agent.level === level);
}

export function getAgentsByStatus(status: AgentStatus): Agent[] {
  return agents.filter(agent => agent.status === status);
}

export function getActiveAgents(): Agent[] {
  return agents.filter(agent => agent.status === 'active' || agent.status === 'busy');
}

export function getDepartmentStats() {
  const stats: Record<Department, { count: number; active: number; tasks: number }> = {
    'executive': { count: 0, active: 0, tasks: 0 },
    'operations': { count: 0, active: 0, tasks: 0 },
    'sales': { count: 0, active: 0, tasks: 0 },
    'estimating': { count: 0, active: 0, tasks: 0 },
    'finance': { count: 0, active: 0, tasks: 0 },
    'hr': { count: 0, active: 0, tasks: 0 },
    'hse': { count: 0, active: 0, tasks: 0 },
    'customer-service': { count: 0, active: 0, tasks: 0 },
    'marketing': { count: 0, active: 0, tasks: 0 },
    'procurement': { count: 0, active: 0, tasks: 0 }
  };

  agents.forEach(agent => {
    stats[agent.department].count++;
    if (agent.status === 'active' || agent.status === 'busy') {
      stats[agent.department].active++;
    }
    stats[agent.department].tasks += agent.currentTasks;
  });

  return stats;
}
