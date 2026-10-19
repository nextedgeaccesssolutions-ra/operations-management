import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  departments as initialDepartments,
  meetingRooms as initialMeetingRooms,
  chatMessages as initialMessages,
  monitoredEmails as initialEmails,
  adminLogs as initialAdminLogs,
  ADMIN_EMAIL,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type MonitoredEmail,
  type AdminLog,
  type ChatMessage,
  type Department,
} from './data';

export interface TaskWithMeta extends Task {
  agentId: string;
  agentName: string;
  department: string;
  departmentColor: string;
}

export interface MeetingItem {
  id: string;
  roomId: string;
  title: string;
  organizer: string;
  participants: string;
  status: 'available' | 'in-use' | 'reserved';
  startTime: string;
  endTime: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface OperationsContextType {
  tasks: TaskWithMeta[];
  emails: MonitoredEmail[];
  meetings: MeetingItem[];
  logs: AdminLog[];
  chatMessages: ChatMessage[];
  departments: Department[];
  toasts: ToastNotification[];
  dbStatus: 'connected' | 'offline' | 'syncing';
  createTask: (data: { title: string; assignee: string; department: string; priority: TaskPriority; gated: boolean; dueDate: string }) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  updateTaskPriority: (taskId: string, newPriority: TaskPriority) => Promise<void>;
  handleEmailAction: (emailId: string, action: 'read' | 'reply' | 'archive' | 'flag', replyBody?: string) => Promise<void>;
  convertEmailToTask: (email: MonitoredEmail, assignee?: string, department?: string) => Promise<void>;
  bookMeeting: (data: { roomId: string; title: string; organizer: string; participants: string; startTime: string; endTime: string }) => Promise<void>;
  sendChatMessage: (channel: string, content: string, sender: string, senderAvatar: string) => Promise<void>;
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const OperationsContext = createContext<OperationsContextType | null>(null);

export function OperationsProvider({ children }: { children: ReactNode }) {
  // Initialize tasks from departments data
  const [tasks, setTasks] = useState<TaskWithMeta[]>(() => {
    return initialDepartments.flatMap(dept =>
      dept.agents.flatMap(agent =>
        agent.tasks.map(task => ({
          ...task,
          agentId: agent.id,
          agentName: agent.name,
          department: dept.name,
          departmentColor: dept.color,
          priority: (task.gated ? 'high' : task.status === 'blocked' ? 'critical' : 'medium') as TaskPriority,
          createdAt: 'Today',
        }))
      )
    );
  });

  const [emails, setEmails] = useState<MonitoredEmail[]>(initialEmails);
  const [logs, setLogs] = useState<AdminLog[]>(initialAdminLogs);
  const [chatList, setChatList] = useState<ChatMessage[]>(initialMessages);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [dbStatus, setDbStatus] = useState<'connected' | 'offline' | 'syncing'>('syncing');

  // Initial meeting rooms converted to MeetingItem
  const [meetings, setMeetings] = useState<MeetingItem[]>(() => [
    {
      id: 'mtg-summit',
      roomId: 'meeting-1',
      title: 'Q4 Planning Sync & Gate Validation',
      organizer: 'Mara Vance',
      participants: 'Mara Vance, Dele Okafor, Tobias Bram',
      status: 'in-use',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
    },
    {
      id: 'mtg-board',
      roomId: 'meeting-2',
      title: 'Quarterly Audit Committee',
      organizer: 'Tobias Bram',
      participants: 'Tobias Bram, Sarah Jenkins',
      status: 'reserved',
      startTime: '02:00 PM',
      endTime: '03:00 PM',
    },
    {
      id: 'mtg-focus',
      roomId: 'meeting-3',
      title: 'Sprint Retrospective',
      organizer: 'Dele Okafor',
      participants: 'Priya Sharma, Kofi Mensah',
      status: 'available',
      startTime: '03:30 PM',
      endTime: '04:15 PM',
    },
  ]);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addLog = (action: string, target: string, details?: string, admin: string = 'Admin Controller') => {
    const newLog: AdminLog = {
      id: `l-${Date.now()}`,
      action,
      target,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      admin,
      details,
    };
    setLogs(prev => [newLog, ...prev]);

    // Async sync to database
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog),
    }).catch(() => {});
  };

  // Synchronize with Netlify Database on load
  useEffect(() => {
    let active = true;

    async function syncDatabase() {
      try {
        const [tasksRes, emailsRes, meetingsRes, logsRes] = await Promise.allSettled([
          fetch('/api/tasks').then(r => r.ok ? r.json() : null),
          fetch('/api/emails').then(r => r.ok ? r.json() : null),
          fetch('/api/meetings').then(r => r.ok ? r.json() : null),
          fetch('/api/activity').then(r => r.ok ? r.json() : null),
        ]);

        if (!active) return;

        let hasDb = false;

        if (tasksRes.status === 'fulfilled' && tasksRes.value?.tasks) {
          hasDb = true;
          const remoteTasks = tasksRes.value.tasks;
          if (remoteTasks.length > 0) {
            setTasks(remoteTasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              assignee: t.assignee,
              agentId: t.agentId || 'admin',
              department: t.department,
              departmentColor: t.departmentColor || '#3b82f6',
              status: t.status,
              priority: t.priority,
              gated: t.gated,
              dueDate: t.dueDate,
              createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Today',
            })));
          }
        }

        if (emailsRes.status === 'fulfilled' && emailsRes.value?.emails) {
          hasDb = true;
          const remoteEmails = emailsRes.value.emails;
          if (remoteEmails.length > 0) {
            setEmails(remoteEmails.map((e: any) => ({
              id: e.id,
              from: e.fromName,
              fromEmail: e.fromEmail,
              subject: e.subject,
              preview: e.preview,
              body: e.body,
              timestamp: e.timestamp,
              status: e.status,
              priority: e.priority,
              labels: e.labels || [],
              hasAttachment: e.hasAttachment,
              threadCount: e.threadCount,
            })));
          }
        }

        if (meetingsRes.status === 'fulfilled' && meetingsRes.value?.meetings) {
          hasDb = true;
          const remoteM = meetingsRes.value.meetings;
          if (remoteM.length > 0) {
            setMeetings(remoteM.map((m: any) => ({
              id: m.id,
              roomId: m.roomId,
              title: m.title,
              organizer: m.organizer,
              participants: m.participants,
              status: m.status,
              startTime: m.startTime,
              endTime: m.endTime,
            })));
          }
        }

        if (logsRes.status === 'fulfilled' && logsRes.value?.logs) {
          hasDb = true;
          const remoteL = logsRes.value.logs;
          if (remoteL.length > 0) {
            setLogs(remoteL);
          }
        }

        setDbStatus(hasDb ? 'connected' : 'offline');
      } catch {
        if (active) setDbStatus('offline');
      }
    }

    syncDatabase();

    return () => {
      active = false;
    };
  }, []);

  // Task Actions
  const createTask = async (data: {
    title: string;
    assignee: string;
    department: string;
    priority: TaskPriority;
    gated: boolean;
    dueDate: string;
  }) => {
    // Find matching department color and agent
    const dept = initialDepartments.find(d => d.name === data.department) || initialDepartments[0];
    const agent = dept.agents.find(a => a.name === data.assignee) || dept.agents[0];

    const newTask: TaskWithMeta = {
      id: `task-${Date.now()}`,
      title: data.title,
      assignee: data.assignee,
      agentId: agent?.id || 'admin',
      agentName: data.assignee,
      department: data.department,
      departmentColor: dept.color,
      status: 'queued',
      priority: data.priority,
      gated: data.gated,
      dueDate: data.dueDate,
      createdAt: 'Today',
    };

    setTasks(prev => [newTask, ...prev]);
    addLog('Created', newTask.title.substring(0, 40) + '...', `Assigned to ${newTask.assignee} (${newTask.department})`);
    addToast(`Task "${newTask.title.substring(0, 30)}..." created`, 'success');

    // Async DB persist
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
    } catch {}
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    let taskTitle = '';
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          taskTitle = t.title;
          return { ...t, status: newStatus };
        }
        return t;
      })
    );

    const actionLabel =
      newStatus === 'completed'
        ? 'Completed'
        : newStatus === 'cancelled'
        ? 'Cancelled'
        : newStatus === 'running'
        ? 'Started'
        : newStatus === 'awaiting-sign-off'
        ? 'Sign-off Requested'
        : 'Paused';

    addLog(actionLabel, taskTitle ? taskTitle.substring(0, 40) + '...' : taskId, `Status changed to ${newStatus}`);
    addToast(`Task marked as ${newStatus}`, newStatus === 'completed' ? 'success' : 'info');

    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
    } catch {}
  };

  const updateTaskPriority = async (taskId: string, newPriority: TaskPriority) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, priority: newPriority } : t))
    );
    addToast(`Priority updated to ${newPriority}`, 'info');

    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, priority: newPriority }),
      });
    } catch {}
  };

  // Email Actions
  const handleEmailAction = async (emailId: string, action: 'read' | 'reply' | 'archive' | 'flag', replyBody?: string) => {
    let emailSubject = '';
    setEmails(prev =>
      prev.map(e => {
        if (e.id === emailId) {
          emailSubject = e.subject;
          const nextStatus =
            action === 'read' ? 'read' : action === 'reply' ? 'replied' : action === 'archive' ? 'archived' : e.status;
          return { ...e, status: nextStatus };
        }
        return e;
      })
    );

    const actionText = action === 'read' ? 'Read' : action === 'reply' ? 'Replied' : action === 'archive' ? 'Archived' : 'Flagged';
    addLog(actionText, emailSubject.substring(0, 40) + '...', replyBody ? `Reply: "${replyBody.substring(0, 50)}..."` : `Status: ${action}`);
    addToast(`Email marked as ${actionText.toLowerCase()}`, 'success');

    try {
      await fetch('/api/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emailId, action }),
      });
    } catch {}
  };

  const convertEmailToTask = async (email: MonitoredEmail, assignee: string = 'Mara Vance', department: string = 'Executive') => {
    const dept = initialDepartments.find(d => d.name === department) || initialDepartments[0];
    const agent = dept.agents.find(a => a.name === assignee) || dept.agents[0];

    const newTask: TaskWithMeta = {
      id: `task-from-email-${Date.now()}`,
      title: `Action: ${email.subject}`,
      assignee,
      agentId: agent.id,
      agentName: assignee,
      department,
      departmentColor: dept.color,
      status: 'running',
      priority: email.priority === 'urgent' ? 'critical' : 'high',
      gated: true,
      dueDate: 'Today',
      createdAt: 'Today',
    };

    setTasks(prev => [newTask, ...prev]);

    // Mark email as replied
    setEmails(prev =>
      prev.map(e => (e.id === email.id ? { ...e, status: 'replied' } : e))
    );

    addLog('Escalated', newTask.title.substring(0, 40) + '...', `Dispatched to ${assignee} from email`);
    addToast(`Created priority task for ${assignee}`, 'success');

    try {
      await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'convert-to-task',
          emailId: email.id,
          subject: email.subject,
          assignee,
          department,
          priority: email.priority,
        }),
      });
    } catch {}
  };

  // Meeting Booking
  const bookMeeting = async (data: {
    roomId: string;
    title: string;
    organizer: string;
    participants: string;
    startTime: string;
    endTime: string;
  }) => {
    const newMeeting: MeetingItem = {
      id: `mtg-${Date.now()}`,
      roomId: data.roomId,
      title: data.title,
      organizer: data.organizer,
      participants: data.participants,
      status: 'in-use',
      startTime: data.startTime,
      endTime: data.endTime,
    };

    setMeetings(prev => [newMeeting, ...prev]);
    addLog('Scheduled', newMeeting.title.substring(0, 40), `Booked ${data.roomId} (${data.startTime} - ${data.endTime})`, data.organizer);
    addToast(`Room reserved for "${newMeeting.title}"`, 'success');

    try {
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeeting),
      });
    } catch {}
  };

  // Chat
  const sendChatMessage = async (channel: string, content: string, sender: string, senderAvatar: string) => {
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      channel,
      sender,
      senderAvatar,
      content,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setChatList(prev => [...prev, newMsg]);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
    } catch {}
  };

  // Compute updated departments with current live tasks
  const dynamicDepartments = initialDepartments.map(dept => {
    const deptTasks = tasks.filter(t => t.department.toLowerCase() === dept.name.toLowerCase());
    const agents = dept.agents.map(agent => {
      const agentTasks = deptTasks.filter(t => t.agentId === agent.id || t.assignee.toLowerCase() === agent.name.toLowerCase());
      return {
        ...agent,
        tasks: agentTasks.map(t => ({
          id: t.id,
          title: t.title,
          assignee: t.assignee,
          dueDate: t.dueDate,
          status: t.status,
          gated: t.gated,
          priority: t.priority,
        })),
      };
    });

    return {
      ...dept,
      agents,
    };
  });

  return (
    <OperationsContext.Provider
      value={{
        tasks,
        emails,
        meetings,
        logs,
        chatMessages: chatList,
        departments: dynamicDepartments,
        toasts,
        dbStatus,
        createTask,
        updateTaskStatus,
        updateTaskPriority,
        handleEmailAction,
        convertEmailToTask,
        bookMeeting,
        sendChatMessage,
        addToast,
        removeToast,
      }}
    >
      {children}
    </OperationsContext.Provider>
  );
}

export function useOperations() {
  const ctx = useContext(OperationsContext);
  if (!ctx) throw new Error('useOperations must be used within OperationsProvider');
  return ctx;
}
