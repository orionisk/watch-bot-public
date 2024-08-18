CREATE TABLE IF NOT EXISTS "pairs_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"exchange" text NOT NULL,
	"symbol" text NOT NULL,
	"price" real NOT NULL,
	"timestamp" timestamp(2) NOT NULL,
	"created_at" timestamp(2) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"period" integer DEFAULT 120 NOT NULL,
	"change" real DEFAULT 2 NOT NULL,
	"period_big" integer DEFAULT 1200 NOT NULL,
	"change_big" real DEFAULT 10 NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
