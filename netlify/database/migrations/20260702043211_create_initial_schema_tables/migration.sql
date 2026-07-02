CREATE TYPE "image_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "report_status" AS ENUM('pending', 'reviewed', 'dismissed', 'resolved');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(120) NOT NULL,
	"description" text,
	"cover_image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_not_empty_chk" CHECK (char_length(trim("comment")) > 0)
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" uuid,
	"image_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_pk" PRIMARY KEY("user_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"title" varchar(180) NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"image_size" bigint,
	"width" integer,
	"height" integer,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"visibility" "image_visibility" DEFAULT 'public'::"image_visibility" NOT NULL,
	"upload_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "images_total_views_nonnegative_chk" CHECK ("total_views" >= 0),
	CONSTRAINT "images_dimensions_positive_chk" CHECK (("width" IS NULL OR "width" > 0) AND ("height" IS NULL OR "height" > 0)),
	CONSTRAINT "images_size_nonnegative_chk" CHECK ("image_size" IS NULL OR "image_size" >= 0)
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"user_id" uuid,
	"image_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "likes_pk" PRIMARY KEY("user_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"receiver_user_id" uuid NOT NULL,
	"sender_user_id" uuid,
	"notification_type" varchar(80) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "report_status" DEFAULT 'pending'::"report_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_reason_not_empty_chk" CHECK (char_length(trim("reason")) > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"full_name" varchar(160) NOT NULL,
	"username" varchar(60) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"profile_image" text,
	"bio" text,
	"role" "user_role" DEFAULT 'user'::"user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_length_chk" CHECK (char_length("username") >= 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_unique_idx" ON "categories" (lower("name"));--> statement-breakpoint
CREATE INDEX "categories_name_search_idx" ON "categories" ("name");--> statement-breakpoint
CREATE INDEX "comments_image_id_created_at_idx" ON "comments" ("image_id","created_at");--> statement-breakpoint
CREATE INDEX "comments_user_id_idx" ON "comments" ("user_id");--> statement-breakpoint
CREATE INDEX "favorites_image_id_idx" ON "favorites" ("image_id");--> statement-breakpoint
CREATE INDEX "favorites_created_at_idx" ON "favorites" ("created_at");--> statement-breakpoint
CREATE INDEX "images_user_id_idx" ON "images" ("user_id");--> statement-breakpoint
CREATE INDEX "images_category_id_idx" ON "images" ("category_id");--> statement-breakpoint
CREATE INDEX "images_visibility_idx" ON "images" ("visibility");--> statement-breakpoint
CREATE INDEX "images_upload_date_idx" ON "images" ("upload_date");--> statement-breakpoint
CREATE INDEX "images_total_views_idx" ON "images" ("total_views");--> statement-breakpoint
CREATE INDEX "images_title_search_idx" ON "images" USING gin (to_tsvector('english', "title"));--> statement-breakpoint
CREATE INDEX "images_tags_idx" ON "images" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "likes_image_id_idx" ON "likes" ("image_id");--> statement-breakpoint
CREATE INDEX "likes_created_at_idx" ON "likes" ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_receiver_read_created_idx" ON "notifications" ("receiver_user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "notifications_sender_user_id_idx" ON "notifications" ("sender_user_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" ("notification_type");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" ("status");--> statement-breakpoint
CREATE INDEX "reports_image_id_idx" ON "reports" ("image_id");--> statement-breakpoint
CREATE INDEX "reports_user_id_idx" ON "reports" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique_idx" ON "users" (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" (lower("email"));--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" ("role");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_image_id_images_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_image_id_images_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_image_id_images_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiver_user_id_users_id_fkey" FOREIGN KEY ("receiver_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_user_id_users_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_image_id_images_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE;