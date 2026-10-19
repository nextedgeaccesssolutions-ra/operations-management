CREATE TABLE "admin_logs" (
	"id" text PRIMARY KEY,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"admin" text DEFAULT 'Admin Controller' NOT NULL,
	"details" text,
	"timestamp" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY,
	"channel" text NOT NULL,
	"sender" text NOT NULL,
	"sender_avatar" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" text NOT NULL,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" text PRIMARY KEY,
	"room_id" text NOT NULL,
	"title" text NOT NULL,
	"organizer" text NOT NULL,
	"participants" text NOT NULL,
	"status" text DEFAULT 'in-use' NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monitored_emails" (
	"id" text PRIMARY KEY,
	"from_name" text NOT NULL,
	"from_email" text NOT NULL,
	"subject" text NOT NULL,
	"preview" text NOT NULL,
	"body" text NOT NULL,
	"timestamp" text NOT NULL,
	"status" text DEFAULT 'unread' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"labels" text[],
	"has_attachment" boolean DEFAULT false,
	"thread_count" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"assignee" text NOT NULL,
	"agent_id" text,
	"department" text NOT NULL,
	"department_color" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"gated" boolean DEFAULT false NOT NULL,
	"due_date" text DEFAULT 'Today' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
