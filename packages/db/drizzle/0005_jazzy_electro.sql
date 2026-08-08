CREATE TABLE "dish_components" (
	"id" text PRIMARY KEY NOT NULL,
	"dish_id" text NOT NULL,
	"food_id" text NOT NULL,
	"portion_kind" text NOT NULL,
	"grams" double precision,
	"unit_name" text,
	"unit_grams" double precision,
	"unit_count" double precision,
	"estimate_label" text,
	"estimate_grams" double precision,
	"estimate_uncertainty" double precision,
	"rank" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "food_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "portion_kind" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "dish_id" text;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "dish_scale" double precision;--> statement-breakpoint
ALTER TABLE "dish_components" ADD CONSTRAINT "dish_components_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dish_components" ADD CONSTRAINT "dish_components_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dish_components_dish_idx" ON "dish_components" USING btree ("dish_id");--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;