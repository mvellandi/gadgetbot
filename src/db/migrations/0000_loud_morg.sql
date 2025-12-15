CREATE TABLE "gadgetbots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"description" text NOT NULL,
	"battery_life" real NOT NULL,
	"max_load_capacity" real NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
