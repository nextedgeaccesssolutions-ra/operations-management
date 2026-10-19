export type AgentStatus = 'on-duty' | 'idle' | 'held';
export type TaskStatus = 'running' | 'queued' | 'blocked' | 'awaiting-sign-off' | 'completed' | 'cancelled';
export type PresenceStatus = 'available' | 'busy' | 'away' | 'dnd';
export type EmailStatus = 'unread' | 'read' | 'replied' | 'archived';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  gated: boolean;
  blockedBy?: number;
  priority?: TaskPriority;
  department?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface MonitoredEmail {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  status: EmailStatus;
  priority: 'urgent' | 'normal' | 'low';
  labels: string[];
  hasAttachment?: boolean;
  threadCount?: number;
}

export interface AdminLog {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  admin: string;
  details?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  model: string;
  avatar: string;
  tasks: Task[];
  departmentId: string;
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

export interface MeetingRoom {
  id: string;
  name: string;
  icon: string;
  capacity: number;
  status: 'available' | 'in-use' | 'reserved';
  currentMeeting?: string;
  participants?: string[];
  nextAvailable?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  channel: string;
  isSystem?: boolean;
}

export interface ActivityEvent {
  id: string;
  type: 'task-started' | 'task-completed' | 'meeting-started' | 'agent-online' | 'agent-offline' | 'sign-off-required' | 'message';
  actor: string;
  actorAvatar: string;
  description: string;
  timestamp: string;
  department?: string;
}

export interface OfficeRoom {
  id: string;
  name: string;
  type: 'desk' | 'meeting' | 'break' | 'reception' | 'server';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  occupants?: string[];
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
        departmentId: 'executive',
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
        departmentId: 'operations',
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
        departmentId: 'finance',
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
        departmentId: 'sales',
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
        departmentId: 'procurement',
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
        departmentId: 'safety',
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
        departmentId: 'people',
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
        departmentId: 'people',
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
        departmentId: 'customer',
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

export const meetingRooms: MeetingRoom[] = [
  {
    id: 'mr-1',
    name: 'Summit Room',
    icon: '🏔️',
    capacity: 8,
    status: 'in-use',
    currentMeeting: 'Q4 Planning Sync',
    participants: ['Mara Vance', 'Dele Okafor', 'Tobias Bram'],
    nextAvailable: '11:30 AM',
  },
  {
    id: 'mr-2',
    name: 'Horizon Room',
    icon: '🌅',
    capacity: 4,
    status: 'available',
    nextAvailable: 'Now',
  },
  {
    id: 'mr-3',
    name: 'Focus Pod A',
    icon: '🎯',
    capacity: 2,
    status: 'reserved',
    currentMeeting: '1:1 — Yuna & Mara',
    participants: ['Yuna Haruki', 'Mara Vance'],
    nextAvailable: '2:00 PM',
  },
  {
    id: 'mr-4',
    name: 'Focus Pod B',
    icon: '💡',
    capacity: 2,
    status: 'available',
    nextAvailable: 'Now',
  },
  {
    id: 'mr-5',
    name: 'Board Room',
    icon: '🏛️',
    capacity: 12,
    status: 'in-use',
    currentMeeting: 'Safety Review Committee',
    participants: ['Clara Fonte', 'Imelda Delgado', 'Dele Okafor'],
    nextAvailable: '3:00 PM',
  },
];

export const chatChannels = [
  { id: 'general', name: 'General', icon: '💬', unread: 3 },
  { id: 'operations', name: 'Operations', icon: '⚙️', unread: 1 },
  { id: 'alerts', name: 'Alerts', icon: '🚨', unread: 0 },
  { id: 'social', name: 'Water Cooler', icon: '☕', unread: 5 },
];

export const chatMessages: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'Mara Vance',
    senderAvatar: '👩‍💼',
    content: 'Good morning team! Q4 planning deck is almost ready. Need sign-off from Operations by EOD.',
    timestamp: '9:15 AM',
    channel: 'general',
  },
  {
    id: 'm2',
    sender: 'Dele Okafor',
    senderAvatar: '👨‍💻',
    content: 'On it! The Cebu crew schedule rebuild is in final review. Should have it for you by noon.',
    timestamp: '9:18 AM',
    channel: 'general',
  },
  {
    id: 'm3',
    sender: 'System',
    senderAvatar: '🤖',
    content: '🔔 Sign-off required: Revised quotation for Ortigas facade recoat — Tobias Bram',
    timestamp: '9:22 AM',
    channel: 'general',
    isSystem: true,
  },
  {
    id: 'm4',
    sender: 'Clara Fonte',
    senderAvatar: '👩‍🔬',
    content: 'Anchor-point certs for BGC tower are 80% done. Found one non-conformance — flagging in the safety log.',
    timestamp: '9:30 AM',
    channel: 'general',
  },
  {
    id: 'm5',
    sender: 'Yuna Haruki',
    senderAvatar: '👩‍💻',
    content: 'September reconciliation running now. Two subcontractor invoices have mismatched PO numbers — investigating.',
    timestamp: '9:35 AM',
    channel: 'general',
  },
  {
    id: 'm6',
    sender: 'Kofi Mensah',
    senderAvatar: '👨‍💻',
    content: '⚠️ Customer ticket backlog is higher than expected. Need procurement to expedite the static line order — client is waiting.',
    timestamp: '9:42 AM',
    channel: 'alerts',
  },
  {
    id: 'm7',
    sender: 'Ilesh Rana',
    senderAvatar: '👨‍🔧',
    content: 'Got it Kofi. Pulling quotes from three suppliers now. Will have pricing by 11 AM.',
    timestamp: '9:45 AM',
    channel: 'alerts',
  },
  {
    id: 'm8',
    sender: 'Tobias Bram',
    senderAvatar: '👨‍💼',
    content: 'Anyone up for virtual coffee at 3? ☕',
    timestamp: '9:50 AM',
    channel: 'social',
  },
  {
    id: 'm9',
    sender: 'Petra Rowe',
    senderAvatar: '👩‍🏫',
    content: 'Count me in! Also — the new IRATA techs start Monday. Onboarding pack is in draft.',
    timestamp: '9:52 AM',
    channel: 'social',
  },
  {
    id: 'm10',
    sender: 'Imelda Delgado',
    senderAvatar: '👩‍💼',
    content: 'Payroll cut-off is Friday. I still have 51 shifts to chase. If anyone has site contacts, please ping me!',
    timestamp: '10:01 AM',
    channel: 'operations',
  },
];

export const activityFeed: ActivityEvent[] = [
  {
    id: 'a1',
    type: 'task-started',
    actor: 'Yuna Haruki',
    actorAvatar: '👩‍💻',
    description: 'Started reconciling September invoices',
    timestamp: '9:35 AM',
    department: 'Finance',
  },
  {
    id: 'a2',
    type: 'meeting-started',
    actor: 'Mara Vance',
    actorAvatar: '👩‍💼',
    description: 'Q4 Planning Sync started in Summit Room',
    timestamp: '9:30 AM',
    department: 'Executive',
  },
  {
    id: 'a3',
    type: 'sign-off-required',
    actor: 'Tobias Bram',
    actorAvatar: '👨‍💼',
    description: 'Revised quotation awaiting human sign-off',
    timestamp: '9:22 AM',
    department: 'Sales',
  },
  {
    id: 'a4',
    type: 'agent-online',
    actor: 'Clara Fonte',
    actorAvatar: '👩‍🔬',
    description: 'Came online — Safety & Quality',
    timestamp: '9:00 AM',
    department: 'Safety & Quality',
  },
  {
    id: 'a5',
    type: 'task-completed',
    actor: 'Dele Okafor',
    actorAvatar: '👨‍💻',
    description: 'Completed preliminary crew schedule draft',
    timestamp: '8:45 AM',
    department: 'Operations',
  },
  {
    id: 'a6',
    type: 'agent-online',
    actor: 'Imelda Delgado',
    actorAvatar: '👩‍💼',
    description: 'Came online — People Department',
    timestamp: '8:30 AM',
    department: 'People',
  },
  {
    id: 'a7',
    type: 'meeting-started',
    actor: 'Clara Fonte',
    actorAvatar: '👩‍🔬',
    description: 'Safety Review Committee started in Board Room',
    timestamp: '8:00 AM',
    department: 'Safety & Quality',
  },
  {
    id: 'a8',
    type: 'agent-offline',
    actor: 'Ilesh Rana',
    actorAvatar: '👨‍🔧',
    description: 'Went idle — Procurement',
    timestamp: '7:55 AM',
    department: 'Procurement',
  },
];

export const officeRooms: OfficeRoom[] = [
  { id: 'reception', name: 'Reception', type: 'reception', x: 0, y: 0, width: 100, height: 60, color: '#6366f1' },
  { id: 'exec-desk', name: 'Executive', type: 'desk', x: 0, y: 70, width: 80, height: 70, color: '#8b5cf6', occupants: ['mara'] },
  { id: 'ops-desk', name: 'Operations', type: 'desk', x: 90, y: 70, width: 80, height: 70, color: '#3b82f6', occupants: ['dele'] },
  { id: 'finance-desk', name: 'Finance', type: 'desk', x: 180, y: 70, width: 80, height: 70, color: '#10b981', occupants: ['yuna'] },
  { id: 'sales-desk', name: 'Sales', type: 'desk', x: 0, y: 150, width: 80, height: 70, color: '#f59e0b', occupants: ['tobias'] },
  { id: 'proc-desk', name: 'Procurement', type: 'desk', x: 90, y: 150, width: 80, height: 70, color: '#06b6d4', occupants: ['ilesh'] },
  { id: 'safety-desk', name: 'Safety', type: 'desk', x: 180, y: 150, width: 80, height: 70, color: '#ef4444', occupants: ['clara'] },
  { id: 'people-desk', name: 'People', type: 'desk', x: 0, y: 230, width: 80, height: 70, color: '#ec4899', occupants: ['petra', 'imelda'] },
  { id: 'customer-desk', name: 'Customer', type: 'desk', x: 90, y: 230, width: 80, height: 70, color: '#f97316', occupants: ['kofi'] },
  { id: 'meeting-1', name: 'Summit Room', type: 'meeting', x: 180, y: 230, width: 80, height: 70, color: '#6366f1' },
  { id: 'break-room', name: 'Break Room', type: 'break', x: 270, y: 70, width: 70, height: 110, color: '#84cc16' },
  { id: 'server-room', name: 'Server Room', type: 'server', x: 270, y: 190, width: 70, height: 110, color: '#64748b' },
];

export const signOffDepartments = ['Executive', 'Operations', 'Finance'];

export const ADMIN_EMAIL = 'info.nextedgeaccesssolutions@gmail.com';

export const monitoredEmails: MonitoredEmail[] = [
  {
    id: 'e1',
    from: 'Cebu Port Authority',
    fromEmail: 'ops@cebuport.gov.ph',
    subject: 'RE: Rope Access Permit — Tower 3 Maintenance Window',
    preview: 'Thank you for your application. The maintenance window for Tower 3 has been confirmed for Oct 28–30. Please ensure all IRATA L3 supervisors are on-site by 0600...',
    body: 'Thank you for your application. The maintenance window for Tower 3 has been confirmed for Oct 28–30. Please ensure all IRATA L3 supervisors are on-site by 0600. Attach the revised risk assessment before mobilization.',
    timestamp: '10:42 AM',
    status: 'unread',
    priority: 'urgent',
    labels: ['Operations', 'Permits'],
    hasAttachment: true,
    threadCount: 4,
  },
  {
    id: 'e2',
    from: 'Ortigas Land Corp',
    fromEmail: 'facilities@ortigasland.com.ph',
    subject: 'Facade Recoat — Revised Quotation Received',
    preview: 'We acknowledge receipt of your revised quotation ref: NEAS-Q-2024-0892. The commercial team will review and revert within 5 business days...',
    body: 'We acknowledge receipt of your revised quotation ref: NEAS-Q-2024-0892. The commercial team will review and revert within 5 business days. Please keep the quotation validity until Nov 15.',
    timestamp: '10:15 AM',
    status: 'unread',
    priority: 'normal',
    labels: ['Sales', 'Quotations'],
    threadCount: 2,
  },
  {
    id: 'e3',
    from: 'BGC Tower Management',
    fromEmail: 'compliance@bgctower.com.ph',
    subject: 'Anchor Point Inspection Certificates — Submission Request',
    preview: 'Per our agreement clause 7.3, please submit the updated anchor-point inspection certificates for Levels 12–18 no later than October 25...',
    body: 'Per our agreement clause 7.3, please submit the updated anchor-point inspection certificates for Levels 12–18 no later than October 25. Non-compliance may result in work suspension.',
    timestamp: '9:58 AM',
    status: 'unread',
    priority: 'urgent',
    labels: ['Safety', 'Compliance'],
    hasAttachment: true,
  },
  {
    id: 'e4',
    from: 'Rope Access Supplies Inc',
    fromEmail: 'sales@ropesupplies.com',
    subject: 'Quote: 400m 11mm Static Line — 3 Supplier Comparison',
    preview: 'Please find attached our quotation for 400m of 11mm static line. Delivery: 5–7 business days. Payment terms: 30 days net...',
    body: 'Please find attached our quotation for 400m of 11mm static line. Delivery: 5–7 business days. Payment terms: 30 days net. All products EN-certified.',
    timestamp: '9:30 AM',
    status: 'read',
    priority: 'normal',
    labels: ['Procurement'],
    hasAttachment: true,
  },
  {
    id: 'e5',
    from: 'Payroll Processing Team',
    fromEmail: 'payroll@neas-internal.com',
    subject: 'ACTION REQUIRED: 51 Shifts Missing Site or Rate Data',
    preview: 'Hi team, the monthly payroll cut-off is Friday Oct 25. We currently have 51 shifts that are missing either site assignment or rate information...',
    body: 'Hi team, the monthly payroll cut-off is Friday Oct 25. We currently have 51 shifts that are missing either site assignment or rate information. Please resolve before EOD Thursday to avoid delays.',
    timestamp: '9:12 AM',
    status: 'read',
    priority: 'urgent',
    labels: ['Finance', 'Payroll'],
    threadCount: 3,
  },
  {
    id: 'e6',
    from: 'New Hire — Juan Dela Cruz',
    fromEmail: 'juan.delacruz@email.com',
    subject: 'Onboarding Documents Submission — IRATA L1',
    preview: 'Dear NEAS Team, Please find attached my IRATA L1 certification, medical clearance, and completed onboarding forms...',
    body: 'Dear NEAS Team, Please find attached my IRATA L1 certification, medical clearance, and completed onboarding forms. Looking forward to starting on Monday.',
    timestamp: '8:45 AM',
    status: 'read',
    priority: 'normal',
    labels: ['People', 'Onboarding'],
    hasAttachment: true,
  },
  {
    id: 'e7',
    from: 'Customer — Ayala Malls',
    fromEmail: 'maintenance@ayalamalls.com.ph',
    subject: 'URGENT: Ticket #4521 — Water Leak at Loading Bay',
    preview: 'We have an active water leak at the loading bay area. Previous repair attempt was unsuccessful. Requesting immediate dispatch...',
    body: 'We have an active water leak at the loading bay area. Previous repair attempt was unsuccessful. Requesting immediate dispatch of a rope access team for external inspection.',
    timestamp: '8:20 AM',
    status: 'replied',
    priority: 'urgent',
    labels: ['Customer', 'Urgent'],
    threadCount: 6,
  },
  {
    id: 'e8',
    from: 'Mara Vance (Internal)',
    fromEmail: 'mara.vance@neas.co',
    subject: 'Q4 Board Pack — Draft for Review',
    preview: 'Team, attaching the draft Q4 capacity review board pack. Please review sections 3 and 4 by EOD tomorrow...',
    body: 'Team, attaching the draft Q4 capacity review board pack. Please review sections 3 and 4 by EOD tomorrow. Need Operations input on crew utilization metrics.',
    timestamp: 'Yesterday',
    status: 'archived',
    priority: 'normal',
    labels: ['Executive'],
    hasAttachment: true,
  },
  {
    id: 'e9',
    from: 'Philippine Statistics Authority',
    fromEmail: 'notifications@psa.gov.ph',
    subject: 'Quarterly Report Submission Reminder',
    preview: 'This is a reminder that your quarterly labor report is due on October 30, 2024. Please submit via the online portal...',
    body: 'This is a reminder that your quarterly labor report is due on October 30, 2024. Please submit via the online portal at reports.psa.gov.ph.',
    timestamp: 'Yesterday',
    status: 'archived',
    priority: 'low',
    labels: ['Compliance'],
  },
  {
    id: 'e10',
    from: 'LinkedIn',
    fromEmail: 'notifications@linkedin.com',
    subject: '3 new candidates matched your job posting',
    preview: 'We found 3 candidates matching your IRATA L2 Technician posting. View profiles to shortlist...',
    body: 'We found 3 candidates matching your IRATA L2 Technician posting. View profiles to shortlist and invite for interview.',
    timestamp: '2 days ago',
    status: 'archived',
    priority: 'low',
    labels: ['People', 'Recruitment'],
  },
];

export const adminLogs: AdminLog[] = [
  { id: 'l1', action: 'Approved', target: 'Revised Quotation — Ortigas Facade', timestamp: '10:30 AM', admin: 'System', details: 'Auto-approved by admin controller' },
  { id: 'l2', action: 'Escalated', target: 'Customer Ticket #4521', timestamp: '10:15 AM', admin: 'System', details: 'Escalated to Operations due to urgency' },
  { id: 'l3', action: 'Paused', target: 'Crew Schedule Rebuild', timestamp: '9:50 AM', admin: 'System', details: 'Paused awaiting sign-off from Operations' },
  { id: 'l4', action: 'Assigned', target: 'Anchor Certificates — BGC Tower', timestamp: '9:30 AM', admin: 'System', details: 'Assigned to Clara Fonte (Safety)' },
  { id: 'l5', action: 'Created', target: 'New Task: Payroll Shift Reconciliation', timestamp: '9:12 AM', admin: 'System', details: 'Auto-created from email alert' },
  { id: 'l6', action: 'Completed', target: 'Preliminary Crew Schedule Draft', timestamp: '8:45 AM', admin: 'System', details: 'Marked complete by Dele Okafor' },
  { id: 'l7', action: 'Blocked', target: 'Q4 Board Pack Draft', timestamp: '8:30 AM', admin: 'System', details: 'Blocked — awaiting Operations input' },
  { id: 'l8', action: 'Connected', target: 'Email Monitor — info@nextedge...', timestamp: '8:00 AM', admin: 'System', details: 'Gmail IMAP connection established' },
];
