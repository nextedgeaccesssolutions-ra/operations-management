import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { adminLogs } from "../../db/schema.js";
import { desc } from "drizzle-orm";

const INITIAL_LOGS = [
  { id: 'l-1', action: 'Approved', target: 'Access badge batch #4400-4412', admin: 'Admin Controller', details: 'Automated verification check passed', timestamp: '11:42 AM' },
  { id: 'l-2', action: 'Escalated', target: 'Incident #882 EU-West latency', admin: 'Mara Vance', details: 'Routed to Kofi Mensah for root-cause analysis', timestamp: '10:55 AM' },
  { id: 'l-3', action: 'Completed', target: 'Server failover drill', admin: 'Kofi Mensah', details: 'All secondary zones responded within 80ms', timestamp: '10:18 AM' },
  { id: 'l-4', action: 'Connected', target: 'info.nextedgeaccesssolutions@gmail.com', admin: 'System', details: 'IMAP connection active', timestamp: '09:00 AM' },
  { id: 'l-5', action: 'Sign-Off', target: 'Supplier contract renegotiation notice', admin: 'Priya Sharma', details: 'Awaiting human sign-off from Procurement', timestamp: '08:45 AM' },
];

export default async (req: Request) => {
  try {
    if (req.method === "GET") {
      let logList = await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt));

      if (logList.length === 0) {
        await db.insert(adminLogs).values(INITIAL_LOGS);
        logList = await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt));
      }

      return Response.json({ success: true, logs: logList });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const newLog = {
        id: `l-${Date.now()}`,
        action: body.action || 'Updated',
        target: body.target || 'System',
        admin: body.admin || 'Admin Controller',
        details: body.details || '',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };

      const [created] = await db.insert(adminLogs).values(newLog).returning();
      return Response.json({ success: true, log: created }, { status: 201 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/activity",
};
