import { pgTable, text, serial, timestamp, integer, jsonb, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  companyName: text('company_name'),
  brandColors: jsonb('brand_colors').$type<{ primary: string; secondary: string; accent: string }>(),
  companyWebsite: text('company_website'),
  companyDescription: text('company_description'),
  authorName: text('author_name'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  // Credits system
  credits: real('credits').default(0), // New users start with 0 credits
  totalCreditsUsed: real('total_credits_used').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Credit transactions for tracking usage
export const creditTransactions = pgTable('credit_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: real('amount').notNull(), // Positive for additions, negative for deductions
  balanceAfter: real('balance_after').notNull(),
  type: text('type').notNull(), // 'blog_generation', 'image_generation', 'image_edit', 'admin_add', 'admin_deduct'
  description: text('description'),
  metadata: jsonb('metadata').$type<{
    blogId?: number;
    blogTitle?: string;
    imageId?: number;
    imagePrompt?: string;
    adminNote?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const companyProfiles = pgTable('company_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  companyName: text('company_name').notNull(),
  companyWebsite: text('company_website'),
  brandColors: jsonb('brand_colors').$type<{ primary: string; secondary: string; accent: string }>(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Roles for employee access control
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(), // Owner who created this role
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Employees table for username/password auth
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(), // The main company owner
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // Hashed password
  fullName: text('full_name').notNull(),
  email: text('email'),
  roleId: integer('role_id').references(() => roles.id),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const blogs = pgTable('blogs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id), // Track which employee created the blog
  companyProfileId: integer('company_profile_id').references(() => companyProfiles.id),
  title: text('title').notNull(),
  content: text('content').default(''), // Allow empty content for initial blog creation
  htmlContent: text('html_content'), // Store HTML version
  metaDescription: text('meta_description'),
  slug: text('slug').notNull(),
  status: text('status').default('draft'),
  targetKeywords: text('target_keywords'),
  primaryKeyword: text('primary_keyword'), // Primary keyword
  secondaryKeywords: jsonb('secondary_keywords').$type<string[]>(), // Array of secondary keywords
  seoScore: integer('seo_score'),
  aeoScore: integer('aeo_score'), // Answer Engine Optimization score
  geoScore: integer('geo_score'), // Generative Engine Optimization score
  eeatScore: integer('eeat_score'), // E-E-A-T score
  keywordDensity: jsonb('keyword_density'), // Keyword density data
  wordCount: integer('word_count'),
  readingTime: integer('reading_time'),
  featuredImage: text('featured_image'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const blogImages = pgTable('blog_images', {
  id: serial('id').primaryKey(),
  blogId: integer('blog_id').notNull().references(() => blogs.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  // Base64 image data stored directly in DB
  imageData: text('image_data'),
  // Content type (e.g., 'image/png', 'image/jpeg')
  contentType: text('content_type').default('image/png'),
  // Optional storage key when image is persisted to S3 or external storage (deprecated)
  s3Key: text('s3_key'),
  imagePrompt: text('image_prompt'),
  altText: text('alt_text'),
  position: integer('position'),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Permissions for granular access control
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  category: text('category').notNull(), // 'dashboard', 'blogs', 'create', 'settings', 'analytics'
});

// Role permissions junction table
export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').references(() => roles.id).notNull(),
  permissionId: integer('permission_id').references(() => permissions.id).notNull(),
});

// Employee activity tracking
export const employeeActivity = pgTable('employee_activity', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  activityType: text('activity_type').notNull(), // 'blog_created', 'blog_edited', 'login', etc.
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;
export type BlogImage = typeof blogImages.$inferSelect;
export type NewBlogImage = typeof blogImages.$inferInsert;
export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type NewCompanyProfile = typeof companyProfiles.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  blogs: many(blogs),
  companyProfiles: many(companyProfiles),
  employees: many(employees),
  roles: many(roles),
  creditTransactions: many(creditTransactions),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const companyProfilesRelations = relations(companyProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [companyProfiles.userId],
    references: [users.id],
  }),
  blogs: many(blogs),
}));

export const blogsRelations = relations(blogs, ({ one, many }) => ({
  user: one(users, {
    fields: [blogs.userId],
    references: [users.id],
  }),
  employee: one(employees, {
    fields: [blogs.employeeId],
    references: [employees.id],
  }),
  companyProfile: one(companyProfiles, {
    fields: [blogs.companyProfileId],
    references: [companyProfiles.id],
  }),
  images: many(blogImages),
}));

export const blogImagesRelations = relations(blogImages, ({ one }) => ({
  blog: one(blogs, {
    fields: [blogImages.blogId],
    references: [blogs.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  role: one(roles, {
    fields: [employees.roleId],
    references: [roles.id],
  }),
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  blogs: many(blogs),
  activities: many(employeeActivity),
}));

export const rolesRelations = relations(roles, ({ many, one }) => ({
  employees: many(employees),
  rolePermissions: many(rolePermissions),
  user: one(users, {
    fields: [roles.userId],
    references: [users.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const employeeActivityRelations = relations(employeeActivity, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeActivity.employeeId],
    references: [employees.id],
  }),
}));
