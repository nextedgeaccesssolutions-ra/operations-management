export type AgentStatus = 'on-duty' | 'idle' | 'held';
export type TaskStatus = 'running' | 'queued' | 'blocked' | 'awaiting-sign-off';

export interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  gated: boolean;
  blockedBy?: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  model: string;
  avatar: string;
  tasks: Task[];
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  color: string;
  seats: number;
  openSeats: number;
  agents: Agent[];
}

export const departments: Department[] = [
  {
    id: 'executive',
    name: 'Executive',
    icon: '👔',
    color: '#8b5cf6',
    seats: 1,
    openSeats: 1,
    agents: [
      {
        id: 'mara',
        name: 'Mara Vance',
        role: 'Chief of Staff',
        status: 'on-duty',
        model: 'opus-5',
        avatar: '👩‍💼',
        tasks: [
          {
            id: 't1',
            title: 'Draft the Q4 capacity review board pack',
            assignee: 'Mara Vance',
            dueDate: '22 Oct',
            status: 'blocked',
            gated: true,
            blockedBy: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: '⚙️',
    color: '#3b82f6',
    seats: 1,
    openSeats: 1,
    agents: [
      {
        id: 'dele',
        name: 'Dele Okafor',
        role: 'Operations Scheduler',
        status: 'on-duty',
        model: 'sonnet-5-5',
        avatar: '👨‍💻',
        tasks: [
          {
            id: 't2',
            title: "Rebuild next week's rope-access crew schedule around the Cebu shutdown",
            assignee: 'Dele Okafor',
            dueDate: 'Today',
            status: 'awaiting-sign-off',
            gated: true,
          },
        ],
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '💰',
    color: '#10b981',
    seats: 1,
    openSeats: 1,
    agents: [
      {
        id: 'yuna',
        name: 'Yuna Haruki',
        role: 'Management Accountant',
        status: 'on-duty',
        model: 'opus-5',
        avatar: '👩‍💻',
        tasks: [
          {
            id: 't3',
            title: 'Reconcile September subcontractor invoices against job costings',
            assignee: 'Yuna Haruki',
            dueDate: '20 Oct',
            status: 'running',
            gated: true,
          },
        ],
      },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: '📈',
    color: '#f59e0b',
    seats: 1,
    openSeats: 1,
    agents: [
      {
        id: 'tobias',
        name: 'Tobias Bram',
        role: 'Quotation Desk',
        status: 'on-duty',
        model: 'sonnet-5-5',
        avatar: '👨‍💼',
        tasks: [
          {
            id: 't4',
            title: 'Issue the revised quotation for the Ortigas facade recoat',
            assignee: 'Tobias Bram',
            dueDate: 'Today',
            status: 'awaiting-sign-off',
            gated: true,
          },
        ],
      },
    ],
  },
  {
    id: 'procurement',
    name: 'Procurement',
    icon: '🔗',
    color: '#06b6d4',
    seats: 1,
    openSeats: 1,
    agents: [
      {
        id: 'ilesh',
        name: 'Ilesh Rana',
        role: 'Procurement Analyst',
        status: 'idle',
        model: 'sonnet-5-5',
        avatar: '👨‍🔧',
        tasks: [
          {
            id: 't5',
            title: 'Price three suppliers for 400 m of 11 mm static line',
            assignee: 'Ilesh Rana',
            dueDate: '21 Oct',
            status: 'queued',
            gated: false,
          },
        ],
      },
    ],
  },
  {
    id: 'safety',
    name: 'Safety & Quality',
    icon: '🛡️',
    color: '#ef4444',
    seats: 1,
    openSeats: 1,
    agents: [
      {
        id: 'clara',
        name: 'Clara Fonte',
        role: 'Safety & Compliance Officer',
        status: 'on-duty',
        model: 'opus-5',
        avatar: '👩‍🔬',
        tasks: [
          {
            id: 't6',
            title: 'Compile anchor-point inspection certificates for the BGC tower file',
            assignee: 'Clara Fonte',
            dueDate: '19 Oct',
            status: 'running',
            gated: false,
          },
        ],
      },
    ],
  },
  {
    id: 'people',
    name: 'People',
    icon: '🤝',
    color: '#ec4899',
    seats: 3,
    openSeats: 3,
    agents: [
      {
        id: 'petra',
        name: 'Petra Rowe',
        role: 'People Operations',
        status: 'idle',
        model: 'opus-5',
        avatar: '👩‍🏫',
        tasks: [
          {
            id: 't7',
            title: 'Draft the onboarding pack for two new IRATA L1 technicians',
            assignee: 'Petra Rowe',
            dueDate: '23 Oct',
            status: 'queued',
            gated: true,
          },
        ],
      },
      {
        id: 'imelda',
        name: 'Imelda Delgado',
        role: 'HR Manager',
        status: 'on-duty',
        model: 'opus-5',
        avatar: '👩‍💼',
        tasks: [
          {
            id: 't8',
            title: 'Review the 2 employees flagged for rate review in the timesheet',
            assignee: 'Imelda Delgado',
            dueDate: 'Today',
            status: 'awaiting-sign-off',
            gated: true,
          },
          {
            id: 't9',
            title: 'Chase the 51 shifts missing a site or rate before payroll cut-off',
            assignee: 'Imelda Delgado',
            dueDate: '21 Oct',
            status: 'running',
            gated: false,
          },
        ],
      },
    ],
  },
  {
    id: 'customer',
    name: 'Customer',
    icon: '🎧',
    color: '#f97316',
    seats: 1,
    openSeats: 1,
    agents: [
      {
        id: 'kofi',
        name: 'Kofi Mensah',
        role: 'Customer Desk',
        status: 'held',
        model: 'haiku-5-5',
        avatar: '👨‍💻',
        tasks: [
          {
            id: 't10',
            title: 'Clear the overnight customer ticket backlog',
            assignee: 'Kofi Mensah',
            dueDate: 'Today',
            status: 'blocked',
            gated: false,
          },
        ],
      },
    ],
  },
];

export const signOffDepartments = ['Executive', 'Operations', 'Finance'];
