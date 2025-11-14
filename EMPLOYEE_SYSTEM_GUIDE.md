# Employee Management System - Setup Guide

## ✅ What's Been Implemented

### 1. Database Schema
- **employees** table - stores employee accounts with username/password
- **roles** table - defines roles (e.g., Writer, Editor, Manager)
- **permissions** table - granular permissions (view_dashboard, create_blog, etc.)
- **rolePermissions** table - junction table linking roles to permissions
- **employeeActivity** table - tracks employee actions
- Added `employeeId` to blogs table to track who created each blog

### 2. Authentication System
- Separate employee login system using JWT tokens (not Clerk)
- Employee login page: `/employee/login`
- Session management with HTTP-only cookies
- Password hashing with bcryptjs

### 3. Admin Features
- Team management page at `/dashboard/team`
- Create, edit, delete employees
- Assign roles to employees
- Change employee passwords
- Toggle employee active/inactive status

### 3. Employee Dashboard
- Employee dashboard at `/employee/dashboard`
- Shows assigned permissions
- Navigation cards for allowed features
- Locked features display when permission missing

### 4. Employee Blog System (Full Feature Parity with Admin)
- **Blog Creation**: `/employee/create`
  - Advanced form with primary keyword, secondary keywords, target word count
  - Creates blog entry and redirects to editor
  
- **Blog Editor**: `/employee/blogs/[id]/edit`
  - Real-time streaming AI generation with Claude 3.5 Sonnet
  - Full WYSIWYG editor using TiptapEditor
  - **Image upload and editing**: 
    * Click the image icon to generate AI images from text prompts
    * Click any inserted image to edit it (resize, adjust, replace)
    * Image generation uses same AI service as admin
  - Auto image generation from placeholders in content
  - SEO metrics calculation (SEO Score, AEO, GEO, E-E-A-T, Keyword Density)
  - Export to HTML functionality
  - Save and regenerate options
  - Live preview during generation
  - Auto-scroll and magic wand animations
  
- **Blog Management**: `/employee/blogs`
  - List all employee's blogs
  - View, edit, and manage blog posts
  - Status indicators (draft, published)
  - Quick access to edit and preview

- **Admin Visibility**: Employee-created blogs appear in admin dashboard at `/dashboard/blogs` with creator badge showing employee name

### 5. API Endpoints Created

#### Authentication & Session
- `POST /api/employee/login` - Employee authentication
- `POST /api/employee/logout` - Clear session
- `GET /api/employee/verify` - Check session and get permissions

#### Admin Employee Management
- `GET /api/admin/employees` - List all employees
- `POST /api/admin/employees` - Create new employee
- `PATCH /api/admin/employees/[id]` - Update employee
- `DELETE /api/admin/employees/[id]` - Delete employee

#### Role & Permission Management
- `GET /api/admin/roles` - List roles
- `POST /api/admin/roles` - Create role
- `GET /api/admin/permissions` - List permissions
- `POST /api/admin/permissions` - Seed default permissions

#### Employee Blog Management
- `GET /api/employee/blogs` - List employee's blogs
- `POST /api/employee/blogs/create` - Create new blog entry
- `POST /api/employee/blogs/generate` - Stream AI-generated content
- `GET /api/employee/blogs/[id]` - Fetch single blog
- `PATCH /api/employee/blogs/[id]` - Update blog (content, title, status)
- `POST /api/employee/blogs/[id]/generate-images` - Generate images from placeholders
- `POST /api/employee/blogs/[id]/calculate-seo` - Calculate SEO metrics (SEO, AEO, GEO, E-E-A-T scores)

## 🔧 Setup Steps

### 1. Add Environment Variable
Add this to your `.env.local` file:
```bash
EMPLOYEE_JWT_SECRET=your-super-secure-random-string-here
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Seed Default Permissions
Run this command once to initialize permissions:
```bash
curl -X POST http://localhost:3000/api/admin/permissions
```

Or visit the endpoint in your browser after starting the dev server.

### 3. Create Your First Role
1. Go to `/dashboard/team`
2. You'll need to create roles programmatically first, or I can create a Roles UI

## 📋 What Still Needs To Be Done

### High Priority:
1. **Image Upload UI Integration** - Add file upload button to TiptapEditor for direct image uploads (currently uses placeholders)
2. **Real AI Image Generation** - Integrate DALL-E or Imagen API to replace placeholder image service
3. **Employee Blog Publishing Workflow** - Add publish/unpublish actions with permission checks
4. **Blog Analytics** - Show individual blog performance metrics (views, engagement)

### Medium Priority:
5. **Admin Analytics Dashboard** - Show employee stats, blog creation metrics
6. **Activity Tracking** - Log employee actions (blog created, edited, deleted)
7. **Bulk Employee Import** - CSV upload for adding multiple employees
8. **Blog Templates** - Pre-defined blog structures (How-to, Listicle, Review, etc.)

### Low Priority:
9. **Employee Profile Page** - Let employees update their own info
10. **Password Reset Flow** - Admin can send password reset links
11. **Role Templates** - Pre-defined role templates (Writer, Editor, etc.)
12. **Collaborative Editing** - Multiple employees can edit same blog
13. **Blog Version History** - Track changes and allow rollback

## 🚀 How to Use

### For Admin (Company Owner):
1. Login with your Clerk account at `/sign-in`
2. Go to "Team" in the sidebar (`/dashboard/team`)
3. Click "Add Employee" to create employee accounts
4. Assign roles and set passwords
5. Give the employee their username and password

### For Employees:
1. Go to `/employee/login`
2. Enter username and password provided by admin
3. Access features based on assigned permissions:
   - **Create Blog**: Full-featured editor with AI generation, image support, SEO tools
   - **View Blogs**: See all your created blogs
   - **Edit Blogs**: Real-time streaming AI generation, WYSIWYG editor
   - **Calculate SEO**: Get comprehensive SEO metrics (SEO, AEO, GEO, E-E-A-T scores)
   - **Generate Images**: Auto-generate images from content placeholders
   - **Export**: Download blog as HTML file

### For Admin:
- All employee-created blogs are visible in `/dashboard/blogs` with a badge showing the creator's name
- Edit and manage employee blogs just like your own
- Track which employees are creating content

## 🔐 Permission System

### Available Permissions:
- `view_dashboard` - View dashboard and metrics
- `view_blogs` - View all blogs
- `create_blog` - Create new blogs
- `edit_blog` - Edit existing blogs
- `delete_blog` - Delete blogs
- `view_analytics` - View analytics and reports
- `manage_settings` - Manage account settings
- `manage_employees` - Manage other employees (admin only)

### How It Works:
1. Admin creates a Role (e.g., "Content Writer")
2. Admin assigns permissions to that role (e.g., create_blog, edit_blog, view_dashboard)
3. Admin assigns employees to that role
4. Employees can only access features they have permissions for

## 📞 Next Steps

Run these commands to test:
```bash
# 1. Start dev server
npm run dev

# 2. Seed permissions (in another terminal)
curl -X POST http://localhost:3000/api/admin/permissions

# 3. Visit the team page
# Go to: http://localhost:3000/dashboard/team

# 4. Create an employee and test login
# Go to: http://localhost:3000/employee/login
```

## 🐛 Troubleshooting

**Issue**: Employee can't login
- Check if employee is marked as "Active" in team management
- Verify username/password are correct
- Check if role is assigned

**Issue**: Employee sees "No Permissions"
- Admin needs to assign a role to the employee
- Role needs to have permissions assigned to it

**Issue**: Database errors
- Make sure migrations ran successfully
- Check all tables exist: employees, roles, permissions, rolePermissions
