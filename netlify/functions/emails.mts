import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { monitoredEmails, adminLogs, tasks } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

const INITIAL_EMAILS = [
  {
    id: 'em-1',
    fromName: 'Sarah Jenkins',
    fromEmail: 's.jenkins@apexlogistics.com',
    subject: 'URGENT: Warehouse Access Pass Revocation Request',
    preview: 'Please revoke access badges for former contractor team effective immediately...',
    body: 'Hi Admin,\n\nWe need to immediately revoke badge access for 3 contractors who completed their assignment yesterday at Facility B. Badge IDs: #4401, #4402, #4409.\n\nPlease confirm once actioned in the gate controller.\n\nThanks,\nSarah Jenkins\nOperations Manager, Apex Logistics',
    timestamp: '10:42 AM',
    status: 'unread',
    priority: 'urgent',
    labels: ['Access Control', 'Urgent', 'Facility B'],
    hasAttachment: false,
    threadCount: 3,
  },
  {
    id: 'em-2',
    fromName: 'Kofi Mensah',
    fromEmail: 'k.mensah@neas.co',
    subject: 'Client SLA Escalation #882 — Root Cause Analysis',
    preview: 'Attached is the initial RCA for this morning\'s edge node latency spike in EU-West...',
    body: 'Admin,\n\nI have drafted the root cause analysis document for SLA incident #882. Latency spiked to 240ms between 08:15 and 08:35 UTC before failover triggered.\n\nAll metrics have normalized. Pending executive sign-off before sending to client.\n\nKofi Mensah\nCustomer Operations Lead',
    timestamp: '10:15 AM',
    status: 'unread',
    priority: 'urgent',
    labels: ['Incident', 'Customer Ops', 'SLA'],
    hasAttachment: true,
    threadCount: 5,
  },
  {
    id: 'em-3',
    fromName: 'AWS Billing Alerts',
    fromEmail: 'no-reply@amazon.com',
    subject: 'Budget Alert: Monthly spend threshold reached 85%',
    preview: 'Your AWS account 8492-****-3310 has exceeded 85% of monthly forecasted budget...',
    body: 'Alert: NEAS Production environment cloud spend has reached $12,450 (85% of monthly budget).\n\nTop contributing services:\n1. EC2 Compute Clusters ($6,200)\n2. RDS Database Instances ($3,100)\n3. CloudFront CDN Egress ($1,850)\n\nPlease review capacity reservations with Tobias Bram in Finance.',
    timestamp: '09:30 AM',
    status: 'unread',
    priority: 'normal',
    labels: ['Finance', 'Infrastructure', 'Automated'],
    hasAttachment: false,
    threadCount: 1,
  },
  {
    id: 'em-4',
    fromName: 'Mara Vance',
    fromEmail: 'm.vance@neas.co',
    subject: 'Executive Board Deck — Final Review Sign-off',
    preview: 'Please review slide 14 (Operational Efficiency metrics) before tomorrow morning...',
    body: 'Team,\n\nThe Q4 board deck is ready for final sign-off. Pay special attention to Slide 14 covering our new automated task dispatch and gate validation numbers.\n\nNeed approvals by end of day.\n\nMara Vance\nChief Operating Officer',
    timestamp: '08:55 AM',
    status: 'read',
    priority: 'normal',
    labels: ['Executive', 'Sign-Off'],
    hasAttachment: true,
    threadCount: 7,
  },
  {
    id: 'em-5',
    fromName: 'Vendor Compliance Portal',
    fromEmail: 'compliance@verifield.io',
    subject: 'Annual SOC2 Type II Audit Renewal Checklist',
    preview: 'Reminder: 4 policy acknowledgements remain pending for the 2026 audit window...',
    body: 'Your compliance window closes in 14 days. Outstanding items:\n1. Access Control Policy re-verification\n2. Incident Response plan annual tabletop drill\n3. Employee cybersecurity training certs\n4. Disaster recovery failover proof logs',
    timestamp: 'Yesterday',
    status: 'read',
    priority: 'normal',
    labels: ['Compliance', 'Audit'],
    hasAttachment: false,
    threadCount: 2,
  },
];

export default async (req: Request) => {
  try {
    if (req.method === "GET") {
      let emailList = await db.select().from(monitoredEmails).orderBy(desc(monitoredEmails.createdAt));

      if (emailList.length === 0) {
        await db.insert(monitoredEmails).values(INITIAL_EMAILS);
        emailList = await db.select().from(monitoredEmails).orderBy(desc(monitoredEmails.createdAt));
      }

      return Response.json({ success: true, emails: emailList });
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const { id, action } = body;
      if (!id) return Response.json({ error: "Missing email ID" }, { status: 400 });

      const newStatus = action === 'read' ? 'read' : action === 'reply' ? 'replied' : action === 'archive' ? 'archived' : 'read';

      const [updated] = await db
        .update(monitoredEmails)
        .set({ status: newStatus })
        .where(eq(monitoredEmails.id, id))
        .returning();

      await db.insert(adminLogs).values({
        id: `log-${Date.now()}`,
        action: action === 'reply' ? 'Replied' : action === 'archive' ? 'Archived' : 'Read',
        target: updated?.subject ? updated.subject.substring(0, 40) : id,
        admin: 'Admin Controller',
        details: `Updated email status to ${newStatus}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      });

      return Response.json({ success: true, email: updated });
    }

    // Convert email to task or compose new email
    if (req.method === "POST") {
      const body = await req.json();

      if (body.type === 'convert-to-task') {
        const newTask = {
          id: `task-${Date.now()}`,
          title: `Action: ${body.subject || 'Inbound Email Request'}`,
          assignee: body.assignee || 'Mara Vance',
          agentId: body.agentId || 'mara',
          department: body.department || 'Executive',
          departmentColor: '#8b5cf6',
          status: 'running',
          priority: body.priority === 'urgent' ? 'critical' : 'high',
          gated: true,
          dueDate: 'Today',
        };

        const [createdTask] = await db.insert(tasks).values(newTask).returning();

        // Mark email as replied/actioned
        if (body.emailId) {
          await db
            .update(monitoredEmails)
            .set({ status: 'replied' })
            .where(eq(monitoredEmails.id, body.emailId));
        }

        await db.insert(adminLogs).values({
          id: `log-${Date.now()}`,
          action: 'Escalated',
          target: newTask.title.substring(0, 40),
          admin: 'Admin Controller',
          details: `Dispatched email to ${newTask.assignee} as priority task`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        });

        return Response.json({ success: true, task: createdTask });
      }

      // Default compose new email
      const newEmail = {
        id: `em-${Date.now()}`,
        fromName: body.fromName || 'Admin Controller',
        fromEmail: 'info.nextedgeaccesssolutions@gmail.com',
        subject: body.subject || 'Operational Notification',
        preview: (body.body || '').substring(0, 80) + '...',
        body: body.body || '',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        status: 'read',
        priority: body.priority || 'normal',
        labels: body.labels || ['Outbound', 'Admin'],
        hasAttachment: false,
        threadCount: 1,
      };

      const [createdEmail] = await db.insert(monitoredEmails).values(newEmail).returning();
      return Response.json({ success: true, email: createdEmail }, { status: 201 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/emails",
};
