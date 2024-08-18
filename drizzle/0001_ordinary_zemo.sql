CREATE TABLE IF NOT EXISTS "exchanges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "exchanges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_period_changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"period" integer NOT NULL,
	"change" real NOT NULL
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
CREATE INDEX IF NOT EXISTS "pk_user_exchanges" ON "user_exchanges" USING btree ("user_id","exchange_name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_exchange" ON "user_exchanges" USING btree ("user_id","exchange_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pairs_prices_timestamp_symbol_exchange" ON "pairs_prices" USING btree ("timestamp","symbol","exchange");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "period";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "change";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "period_big";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "change_big";