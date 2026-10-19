import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { meetings, adminLogs } from "../../db/schema.js";
import { desc } from "drizzle-orm";

const INITIAL_MEETINGS = [
  {
    id: 'mtg-1',
    roomId: 'summit',
    title: 'Q4 Planning Sync & Gate Validation',
    organizer: 'Mara Vance',
    participants: 'Mara Vance, Dele Okafor, Tobias Bram',
    status: 'in-use',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
  },
  {
    id: 'mtg-2',
    roomId: 'boardroom',
    title: 'Quarterly Audit Committee',
    organizer: 'Tobias Bram',
    participants: 'Tobias Bram, Sarah Jenkins',
    status: 'reserved',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
  },
];

export default async (req: Request) => {
  try {
    if (req.method === "GET") {
      let meetingList = await db.select().from(meetings).orderBy(desc(meetings.createdAt));

      if (meetingList.length === 0) {
        await db.insert(meetings).values(INITIAL_MEETINGS);
        meetingList = await db.select().from(meetings).orderBy(desc(meetings.createdAt));
      }

      return Response.json({ success: true, meetings: meetingList });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const newMeeting = {
        id: `mtg-${Date.now()}`,
        roomId: body.roomId || 'summit',
        title: body.title || 'Ad-hoc Sync',
        organizer: body.organizer || 'Admin Controller',
        participants: body.participants || 'Mara Vance, Dele Okafor',
        status: body.status || 'in-use',
        startTime: body.startTime || 'Now',
        endTime: body.endTime || 'In 1 hour',
      };

      const [created] = await db.insert(meetings).values(newMeeting).returning();

      await db.insert(adminLogs).values({
        id: `log-${Date.now()}`,
        action: 'Scheduled',
        target: newMeeting.title.substring(0, 40),
        admin: newMeeting.organizer,
        details: `Booked ${newMeeting.roomId} for ${newMeeting.startTime} - ${newMeeting.endTime}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      });

      return Response.json({ success: true, meeting: created }, { status: 201 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/meetings",
};
