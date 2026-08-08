CREATE TABLE "foods" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"source_id" text,
	"name" text NOT NULL,
	"name_en" text,
	"kcal_per_100g" double precision NOT NULL,
	"protein_per_100g" double precision NOT NULL,
	"carbs_per_100g" double precision NOT NULL,
	"fat_per_100g" double precision NOT NULL,
	"fiber_per_100g" double precision,
	"sugars_per_100g" double precision,
	"sodium_per_100g" double precision,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portion_units" (
	"id" text PRIMARY KEY NOT NULL,
	"food_id" text NOT NULL,
	"name" text NOT NULL,
	"grams" double precision NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portion_units" ADD CONSTRAINT "portion_units_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "foods_source_source_id_idx" ON "foods" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX "foods_name_idx" ON "foods" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "portion_units_food_name_idx" ON "portion_units" USING btree ("food_id","name");--> statement-breakpoint
CREATE INDEX "portion_units_food_idx" ON "portion_units" USING btree ("food_id");