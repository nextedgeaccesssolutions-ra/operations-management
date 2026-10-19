import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { chatMessages } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

const INITIAL_MESSAGES = [
  { id: 'm-1', channel: 'general', sender: 'Mara Vance', senderAvatar: '👩‍💼', content: 'Morning team! Let us ensure all gated sign-offs are cleared before noon.', timestamp: '09:00 AM', isSystem: false },
  { id: 'm-2', channel: 'general', sender: 'System Alert', senderAvatar: '🤖', content: 'Automated morning floor diagnostics: all 8 agent pods running green.', timestamp: '09:01 AM', isSystem: true },
  { id: 'm-3', channel: 'general', sender: 'Tobias Bram', senderAvatar: '👨‍💼', content: 'Finance desk license audit flagged 3 stale seats. Reviewing in Admin panel.', timestamp: '09:15 AM', isSystem: false },
  { id: 'm-4', channel: 'operations', sender: 'Dele Okafor', senderAvatar: '👨‍💻', content: 'Dispatch algorithms updated. Transit latency reduced by 14% on routes.', timestamp: '09:30 AM', isSystem: false },
  { id: 'm-5', channel: 'incident-response', sender: 'Kofi Mensah', senderAvatar: '🎧', content: 'Incident #882 RCA drafted. Edge failover verified.', timestamp: '10:15 AM', isSystem: false },
];

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const channel = url.searchParams.get("channel") || "general";

    if (req.method === "GET") {
      let messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.channel, channel))
        .orderBy(chatMessages.createdAt);

      if (messages.length === 0) {
        await db.insert(chatMessages).values(INITIAL_MESSAGES);
        messages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.channel, channel))
          .orderBy(chatMessages.createdAt);
      }

      return Response.json({ success: true, messages });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const newMsg = {
        id: `m-${Date.now()}`,
        channel: body.channel || 'general',
        sender: body.sender || 'Admin User',
        senderAvatar: body.senderAvatar || '👤',
        content: body.content,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        isSystem: Boolean(body.isSystem),
      };

      const [created] = await db.insert(chatMessages).values(newMsg).returning();
      return Response.json({ success: true, message: created }, { status: 201 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/chat",
};
