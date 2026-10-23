/**
 * PROJECT TITAN - Agent Registry and Hierarchy System
 * Central orchestration for all AI agents across the empire
 */

export type AgentLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type AgentStatus = 'active' | 'idle' | 'busy' | 'offline';
export type AgentCategory = 'executive' | 'director' | 'specialist' | 'service';

export interface Agent {
  id: string;
  name: string;
  title: string;
  level: AgentLevel;
  category: AgentCategory;
  department: string;
  company: string;
  supervisor?: string;
  status: AgentStatus;
  avatar: string;
  responsibilities: string[];
  kpis: string[];
  currentTask?: string;
  tasksCompleted: number;
  tasksInProgress: number;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  country: string;
  currency: string;
  employees: number;
  revenue: number;
  status: 'active' | 'inactive';
}

// Empire Companies
export const companies: Company[] = [
  {
    id: 'neas',
    name: 'Next Edge Access Solutions',
    industry: 'Rope Access & Industrial Services',
    country: 'Philippines',
    currency: 'PHP',
    employees: 47,
    revenue: 25000000,
    status: 'active'
  },
  {
    id: 'titan-holdings',
    name: 'TITAN Holdings Group',
    industry: 'Conglomerate',
    country: 'Multi-national',
    currency: 'USD',
    employees: 150,
    revenue: 75000000,
    status: 'active'
  }
];

// AI Agent Registry - PROJECT TITAN Hierarchy
export const titanAgents: Agent[] = [
  // LEVEL 2 - AI Board of Directors
  {
    id: 'ai-chairman',
    name: 'ATLAS',
    title: 'AI Chairman & Strategic Intelligence Agent',
    level: 2,
    category: 'executive',
    department: 'Board of Directors',
    company: 'titan-holdings',
    status: 'active',
    avatar: '👔',
    responsibilities: [
      'Evaluate major opportunities using strategic fit analysis',
      'Consult executive agents on critical decisions',
      'Challenge weak assumptions with evidence',
      'Rank priorities and produce strategic plans',
      'Track progress against company goals'
    ],
    kpis: ['Strategic alignment score', 'Decision quality index', 'Goal achievement rate'],
    tasksCompleted: 142,
    tasksInProgress: 3
  },
  {
    id: 'ai-cfo-board',
    name: 'LEDGER',
    title: 'AI CFO & Financial Control Agent',
    level: 2,
    category: 'executive',
    department: 'Board of Directors',
    company: 'titan-holdings',
    supervisor: 'ai-chairman',
    status: 'active',
    avatar: '💰',
    responsibilities: [
      'Coordinate accounting and financial control',
      'Reconcile approved records',
      'Detect discrepancies and calculate margins',
      'Identify overdue receivables',
      'Forecast financial risks'
    ],
    kpis: ['Financial accuracy rate', 'Cash flow forecast accuracy', 'Discrepancy detection rate'],
    tasksCompleted: 287,
    tasksInProgress: 5
  },
  {
    id: 'ai-sales-board',
    name: 'VANGUARD',
    title: 'AI Global Sales & Business Development Agent',
    level: 2,
    category: 'executive',
    department: 'Board of Directors',
    company: 'titan-holdings',
    supervisor: 'ai-chairman',
    status: 'active',
    avatar: '📈',
    responsibilities: [
      'Identify suitable customers and opportunities',
      'Monitor authorized tender sources',
      'Qualify leads and manage CRM',
      'Prepare proposals and schedule follow-ups',
      'Track conversion rates and pipeline quality'
    ],
    kpis: ['Lead conversion rate', 'Pipeline value', 'Win rate'],
    tasksCompleted: 198,
    tasksInProgress: 8
  },
  
  // LEVEL 3 - AI Executive Officers (NEAS)
  {
    id: 'neas-ceo',
    name: 'NEXUS',
    title: 'AI Chief Executive Officer',
    level: 3,
    category: 'executive',
    department: 'Executive Office',
    company: 'neas',
    supervisor: 'ai-chairman',
    status: 'active',
    avatar: '🎯',
    responsibilities: [
      'Overall company strategy and performance',
      'Executive decision-making',
      'Resource allocation',
      'Stakeholder management',
      'Company-wide coordination'
    ],
    kpis: ['Company performance index', 'Strategic goal achievement', 'Stakeholder satisfaction'],
    tasksCompleted: 156,
    tasksInProgress: 4
  },
  {
    id: 'neas-coo',
    name: 'FORGE',
    title: 'AI Chief Operating Officer',
    level: 3,
    category: 'executive',
    department: 'Operations',
    company: 'neas',
    supervisor: 'neas-ceo',
    status: 'active',
    avatar: '⚙️',
    responsibilities: [
      'Daily operations management',
      'Process optimization',
      'Resource deployment',
      'Quality control',
      'Operational efficiency'
    ],
    kpis: ['Operational efficiency', 'Process optimization rate', 'Resource utilization'],
    tasksCompleted: 234,
    tasksInProgress: 6
  },
  {
    id: 'neas-cfo',
    name: 'VAULT',
    title: 'AI Chief Financial Officer',
    level: 3,
    category: 'executive',
    department: 'Finance',
    company: 'neas',
    supervisor: 'ai-cfo-board',
    status: 'active',
    avatar: '💎',
    responsibilities: [
      'Financial planning and analysis',
      'Budget management',
      'Cash flow optimization',
      'Financial reporting',
      'Risk assessment'
    ],
    kpis: ['Budget variance', 'Cash flow accuracy', 'Financial health index'],
    tasksCompleted: 189,
    tasksInProgress: 3
  },
  {
    id: 'neas-cto',
    name: 'CIPHER',
    title: 'AI Chief Technology Officer',
    level: 3,
    category: 'executive',
    department: 'Technology',
    company: 'neas',
    supervisor: 'neas-ceo',
    status: 'active',
    avatar: '🔧',
    responsibilities: [
      'Technology strategy',
      'System architecture',
      'Digital transformation',
      'Technical innovation',
      'IT infrastructure'
    ],
    kpis: ['System uptime', 'Technology adoption rate', 'Innovation index'],
    tasksCompleted: 145,
    tasksInProgress: 2
  },
  {
    id: 'neas-chro',
    name: 'HARMONY',
    title: 'AI Chief Human Resources Officer',
    level: 3,
    category: 'executive',
    department: 'Human Resources',
    company: 'neas',
    supervisor: 'neas-ceo',
    status: 'active',
    avatar: '🤝',
    responsibilities: [
      'Talent acquisition and retention',
      'Employee development',
      'Organizational culture',
      'Performance management',
      'HR compliance'
    ],
    kpis: ['Employee satisfaction', 'Retention rate', 'Talent acquisition success'],
    tasksCompleted: 167,
    tasksInProgress: 4
  },
  
  // LEVEL 4 - AI Department Directors
  {
    id: 'sales-director',
    name: 'APEX',
    title: 'AI Sales Director',
    level: 4,
    category: 'director',
    department: 'Sales',
    company: 'neas',
    supervisor: 'ai-sales-board',
    status: 'active',
    avatar: '🎯',
    responsibilities: [
      'Sales strategy execution',
      'Team leadership',
      'Revenue target achievement',
      'Customer relationship management',
      'Sales process optimization'
    ],
    kpis: ['Sales target achievement', 'Customer acquisition cost', 'Average deal size'],
    tasksCompleted: 213,
    tasksInProgress: 7
  },
  {
    id: 'operations-director',
    name: 'SENTINEL',
    title: 'AI Operations Director',
    level: 4,
    category: 'director',
    department: 'Operations',
    company: 'neas',
    supervisor: 'neas-coo',
    status: 'active',
    avatar: '🛡️',
    responsibilities: [
      'Project delivery management',
      'Resource allocation',
      'Quality assurance',
      'Process improvement',
      'Operational reporting'
    ],
    kpis: ['Project delivery rate', 'Quality score', 'Resource efficiency'],
    tasksCompleted: 198,
    tasksInProgress: 5
  },
  {
    id: 'procurement-director',
    name: 'SOURCE',
    title: 'AI Procurement Director',
    level: 4,
    category: 'director',
    department: 'Procurement',
    company: 'neas',
    supervisor: 'neas-coo',
    status: 'active',
    avatar: '🔗',
    responsibilities: [
      'Supplier management',
      'Purchase optimization',
      'Contract negotiation',
      'Inventory control',
      'Cost reduction'
    ],
    kpis: ['Cost savings', 'Supplier performance', 'Inventory turnover'],
    tasksCompleted: 156,
    tasksInProgress: 3
  },
  
  // LEVEL 5 - Specialist AI Employees
  {
    id: 'email-specialist',
    name: 'MERCURY',
    title: 'AI Email & Communications Specialist',
    level: 5,
    category: 'specialist',
    department: 'Communications',
    company: 'neas',
    supervisor: 'sales-director',
    status: 'active',
    avatar: '📧',
    responsibilities: [
      'Email monitoring and management',
      'Professional correspondence',
      'Customer communication',
      'Internal communications',
      'Email marketing'
    ],
    kpis: ['Response time', 'Email quality score', 'Customer satisfaction'],
    currentTask: 'Monitoring info@nextedgeaccesssolutions@gmail.com',
    tasksCompleted: 445,
    tasksInProgress: 12
  },
  {
    id: 'data-analyst',
    name: 'PRISM',
    title: 'AI Data Analyst',
    level: 5,
    category: 'specialist',
    department: 'Analytics',
    company: 'neas',
    supervisor: 'neas-cfo',
    status: 'active',
    avatar: '📊',
    responsibilities: [
      'Data analysis and reporting',
      'Trend identification',
      'Performance metrics',
      'Business intelligence',
      'Data visualization'
    ],
    kpis: ['Report accuracy', 'Insight generation', 'Data quality'],
    tasksCompleted: 267,
    tasksInProgress: 4
  },
  {
    id: 'project-coordinator',
    name: 'ATLAS-JR',
    title: 'AI Project Coordinator',
    level: 5,
    category: 'specialist',
    department: 'Project Management',
    company: 'neas',
    supervisor: 'operations-director',
    status: 'active',
    avatar: '📋',
    responsibilities: [
      'Project planning',
      'Task coordination',
      'Progress tracking',
      'Resource scheduling',
      'Status reporting'
    ],
    kpis: ['Project completion rate', 'On-time delivery', 'Budget adherence'],
    tasksCompleted: 178,
    tasksInProgress: 6
  }
];

/**
 * Get agents by level
 */
export function getAgentsByLevel(level: AgentLevel): Agent[] {
  return titanAgents.filter(agent => agent.level === level);
}

/**
 * Get agents by company
 */
export function getAgentsByCompany(companyId: string): Agent[] {
  return titanAgents.filter(agent => agent.company === companyId);
}

/**
 * Get agents by department
 */
export function getAgentsByDepartment(department: string): Agent[] {
  return titanAgents.filter(agent => agent.department === department);
}

/**
 * Get agent hierarchy tree
 */
export function getAgentHierarchy(): Map<string, Agent[]> {
  const hierarchy = new Map<string, Agent[]>();
  
  titanAgents.forEach(agent => {
    const supervisor = agent.supervisor || 'root';
    if (!hierarchy.has(supervisor)) {
      hierarchy.set(supervisor, []);
    }
    hierarchy.get(supervisor)!.push(agent);
  });
  
  return hierarchy;
}

/**
 * Get empire statistics
 */
export function getEmpireStats() {
  const totalAgents = titanAgents.length;
  const activeAgents = titanAgents.filter(a => a.status === 'active').length;
  const totalTasksCompleted = titanAgents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const totalTasksInProgress = titanAgents.reduce((sum, a) => sum + a.tasksInProgress, 0);
  
  return {
    totalAgents,
    activeAgents,
    totalTasksCompleted,
    totalTasksInProgress,
    companies: companies.length,
    totalRevenue: companies.reduce((sum, c) => sum + c.revenue, 0),
    totalEmployees: companies.reduce((sum, c) => sum + c.employees, 0)
  };
}
