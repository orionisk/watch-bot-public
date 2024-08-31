CREATE TABLE IF NOT EXISTS "price_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"symbol" text NOT NULL,
	"exchange" text NOT NULL,
	"prev" real NOT NULL,
	"prev_ts" timestamp(2) with time zone NOT NULL,
	"last" real NOT NULL,
	"last_ts" timestamp(2) with time zone NOT NULL,
	"period" real NOT NULL,
	"change" real NOT NULL,
	"change_percent" real NOT NULL,
	"notification_sent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pairs_prices" ALTER COLUMN "created_at" SET DATA TYPE timestamp(2) with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
