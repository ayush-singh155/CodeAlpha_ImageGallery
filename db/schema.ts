import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const imageVisibility = pgEnum("image_visibility", ["public", "private"]);
export const reportStatus = pgEnum("report_status", ["pending", "reviewed", "dismissed", "resolved"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    username: varchar("username", { length: 60 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    profileImage: text("profile_image"),
    bio: text("bio"),
    role: userRole("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_username_unique_idx").on(sql`lower(${table.username})`),
    uniqueIndex("users_email_unique_idx").on(sql`lower(${table.email})`),
    index("users_role_idx").on(table.role),
    check("users_username_length_chk", sql`char_length(${table.username}) >= 3`),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    coverImage: text("cover_image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("categories_name_unique_idx").on(sql`lower(${table.name})`),
    index("categories_name_search_idx").on(table.name),
  ],
);

export const images = pgTable(
  "images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    imageSize: bigint("image_size", { mode: "number" }),
    width: integer("width"),
    height: integer("height"),
    tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
    totalViews: integer("total_views").notNull().default(0),
    visibility: imageVisibility("visibility").notNull().default("public"),
    uploadDate: timestamp("upload_date", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("images_user_id_idx").on(table.userId),
    index("images_category_id_idx").on(table.categoryId),
    index("images_visibility_idx").on(table.visibility),
    index("images_upload_date_idx").on(table.uploadDate),
    index("images_total_views_idx").on(table.totalViews),
    index("images_title_search_idx").using("gin", sql`to_tsvector('english', ${table.title})`),
    index("images_tags_idx").using("gin", table.tags),
    check("images_total_views_nonnegative_chk", sql`${table.totalViews} >= 0`),
    check("images_dimensions_positive_chk", sql`(${table.width} IS NULL OR ${table.width} > 0) AND (${table.height} IS NULL OR ${table.height} > 0)`),
    check("images_size_nonnegative_chk", sql`${table.imageSize} IS NULL OR ${table.imageSize} >= 0`),
  ],
);

export const likes = pgTable(
  "likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.imageId], name: "likes_pk" }),
    index("likes_image_id_idx").on(table.imageId),
    index("likes_created_at_idx").on(table.createdAt),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("comments_image_id_created_at_idx").on(table.imageId, table.createdAt),
    index("comments_user_id_idx").on(table.userId),
    check("comments_not_empty_chk", sql`char_length(trim(${table.comment})) > 0`),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.imageId], name: "favorites_pk" }),
    index("favorites_image_id_idx").on(table.imageId),
    index("favorites_created_at_idx").on(table.createdAt),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: reportStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reports_status_idx").on(table.status),
    index("reports_image_id_idx").on(table.imageId),
    index("reports_user_id_idx").on(table.userId),
    check("reports_reason_not_empty_chk", sql`char_length(trim(${table.reason})) > 0`),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    receiverUserId: uuid("receiver_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "set null" }),
    type: varchar("notification_type", { length: 80 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_receiver_read_created_idx").on(table.receiverUserId, table.isRead, table.createdAt),
    index("notifications_sender_user_id_idx").on(table.senderUserId),
    index("notifications_type_idx").on(table.type),
  ],
);
