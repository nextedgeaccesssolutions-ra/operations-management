import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { tasks, adminLogs } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

const INITIAL_TASKS = [
  { id: '1', title: 'Review vendor access security compliance', assignee: 'Mara Vance', agentId: 'mara', department: 'Executive', departmentColor: '#8b5cf6', status: 'running', priority: 'high', gated: true, dueDate: 'Today' },
  { id: '2', title: 'Optimize dispatch routing algorithms', assignee: 'Dele Okafor', agentId: 'dele', department: 'Operations', departmentColor: '#3b82f6', status: 'running', priority: 'medium', gated: false, dueDate: 'Tomorrow' },
  { id: '3', title: 'Audit monthly recurring SaaS licenses', assignee: 'Tobias Bram', agentId: 'tobias', department: 'Finance', departmentColor: '#10b981', status: 'blocked', priority: 'critical', gated: true, dueDate: 'Today' },
  { id: '4', title: 'Enterprise sales pipeline review with VP', assignee: 'Sora Chen', agentId: 'sora', department: 'Sales', departmentColor: '#f59e0b', status: 'running', priority: 'medium', gated: false, dueDate: 'Tomorrow' },
  { id: '5', title: 'Supplier contract renegotiation notice', assignee: 'Priya Sharma', agentId: 'priya', department: 'Procurement', departmentColor: '#06b6d4', status: 'awaiting-sign-off', priority: 'high', gated: true, dueDate: 'Today' },
  { id: '6', title: 'Quarterly facility safety protocol audit', assignee: 'Marcus Vance', agentId: 'marcus', department: 'Safety', departmentColor: '#ef4444', status: 'queued', priority: 'medium', gated: false, dueDate: 'Oct 24' },
  { id: '7', title: 'Onboard 4 new field operations leads', assignee: 'Elena Rostova', agentId: 'elena', department: 'People', departmentColor: '#ec4899', status: 'running', priority: 'high', gated: false, dueDate: 'Today' },
  { id: '8', title: 'Resolve client SLA tier escalation #882', assignee: 'Kofi Mensah', agentId: 'kofi', department: 'Customer', departmentColor: '#f97316', status: 'running', priority: 'critical', gated: false, dueDate: 'Today' },
  { id: '9', title: 'Server infrastructure failover drill', assignee: 'Kofi Mensah', agentId: 'kofi', department: 'Customer', departmentColor: '#f97316', status: 'completed', priority: 'high', gated: false, dueDate: 'Yesterday' },
];

export default async (req: Request) => {
  try {
    if (req.method === "GET") {
      let taskList = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      
      // Auto-seed initial tasks if table is empty
      if (taskList.length === 0) {
        await db.insert(tasks).values(INITIAL_TASKS);
        taskList = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
      }
      
      return Response.json({ success: true, tasks: taskList });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const newTask = {
        id: body.id || `task-${Date.now()}`,
        title: body.title,
        assignee: body.assignee || 'Unassigned',
        agentId: body.agentId || 'admin',
        department: body.department || 'Operations',
        departmentColor: body.departmentColor || '#3b82f6',
        status: body.status || 'queued',
        priority: body.priority || 'medium',
        gated: Boolean(body.gated),
        dueDate: body.dueDate || 'Today',
      };

      const [inserted] = await db.insert(tasks).values(newTask).returning();
      
      // Log task creation
      await db.insert(adminLogs).values({
        id: `log-${Date.now()}`,
        action: 'Created',
        target: newTask.title.substring(0, 40),
        admin: body.admin || 'Admin Controller',
        details: `Assigned to ${newTask.assignee} (${newTask.department})`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      });

      return Response.json({ success: true, task: inserted }, { status: 201 });
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const { id, status, priority } = body;
      if (!id) return Response.json({ error: "Missing task ID" }, { status: 400 });

      const updates: Record<string, any> = {};
      if (status !== undefined) {
        updates.status = status;
        if (status === 'completed') {
          updates.completedAt = new Date();
        }
      }
      if (priority !== undefined) updates.priority = priority;

      const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();

      if (status) {
        await db.insert(adminLogs).values({
          id: `log-${Date.now()}`,
          action: status === 'completed' ? 'Completed' : status === 'running' ? 'Started' : status === 'awaiting-sign-off' ? 'Sign-Off Requested' : 'Updated',
          target: updated?.title ? updated.title.substring(0, 40) : id,
          admin: body.admin || 'Admin Controller',
          details: `Status set to ${status}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        });
      }

      return Response.json({ success: true, task: updated });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/tasks",
};
