CREATE TABLE "entries" (
	"id" text PRIMARY KEY NOT NULL,
	"food_id" text NOT NULL,
	"eaten_at" timestamp with time zone NOT NULL,
	"portion_kind" text NOT NULL,
	"grams" double precision,
	"unit_name" text,
	"unit_grams" double precision,
	"unit_count" double precision,
	"estimate_label" text,
	"estimate_grams" double precision,
	"estimate_uncertainty" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_eaten_at_idx" ON "entries" USING btree ("eaten_at");