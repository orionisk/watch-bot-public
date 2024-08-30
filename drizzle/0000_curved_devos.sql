CREATE TABLE IF NOT EXISTS "exchanges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "exchanges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pairs_prices" (
	"exchange" text NOT NULL,
	"symbol" text NOT NULL,
	"price" real NOT NULL,
	"timestamp" timestamp(2) with time zone NOT NULL,
	"created_at" timestamp(2) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_period_changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"period" integer NOT NULL,
	"change" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_exchanges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"exchange_name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_period_changes" ADD CONSTRAINT "user_period_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_exchanges" ADD CONSTRAINT "user_exchanges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_exchanges" ADD CONSTRAINT "user_exchanges_exchange_name_exchanges_name_fk" FOREIGN KEY ("exchange_name") REFERENCES "public"."exchanges"("name") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pairs_prices_exchange_symbol_timestamp" ON "pairs_prices" USING btree ("exchange","symbol","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_period_changes" ON "user_period_changes" USING btree ("user_id","period","change");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pk_user_exchanges" ON "user_exchanges" USING btree ("user_id","exchange_name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_exchange" ON "user_exchanges" USING btree ("user_id","exchange_name");