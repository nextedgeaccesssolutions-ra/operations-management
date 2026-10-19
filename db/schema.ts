import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  assignee: text("assignee").notNull(),
  agentId: text("agent_id"),
  department: text("department").notNull(),
  departmentColor: text("department_color"),
  status: text("status").notNull().default("queued"),
  priority: text("priority").notNull().default("medium"),
  gated: boolean("gated").notNull().default(false),
  dueDate: text("due_date").notNull().default("Today"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const monitoredEmails = pgTable("monitored_emails", {
  id: text("id").primaryKey(),
  fromName: text("from_name").notNull(),
  fromEmail: text("from_email").notNull(),
  subject: text("subject").notNull(),
  preview: text("preview").notNull(),
  body: text("body").notNull(),
  timestamp: text("timestamp").notNull(),
  status: text("status").notNull().default("unread"),
  priority: text("priority").notNull().default("normal"),
  labels: text("labels").array(),
  hasAttachment: boolean("has_attachment").default(false),
  threadCount: integer("thread_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminLogs = pgTable("admin_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  admin: text("admin").notNull().default("Admin Controller"),
  details: text("details"),
  timestamp: text("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  title: text("title").notNull(),
  organizer: text("organizer").notNull(),
  participants: text("participants").notNull(),
  status: text("status").notNull().default("in-use"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  channel: text("channel").notNull(),
  sender: text("sender").notNull(),
  senderAvatar: text("sender_avatar").notNull(),
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
