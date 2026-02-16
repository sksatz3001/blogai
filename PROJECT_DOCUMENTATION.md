# Blog AI - Complete Platform Documentation

## 📋 Overview

**Blog AI** is a comprehensive AI-powered blog content creation and management platform built with modern web technologies. It enables businesses and content creators to generate high-quality, SEO-optimized blog articles with AI-generated images, all through an intuitive dashboard interface.

### Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | Full-stack React framework with App Router |
| **TypeScript** | Type-safe development |
| **PostgreSQL (Neon)** | Cloud-native database |
| **Drizzle ORM** | Type-safe database queries |
| **Clerk** | Authentication & user management |
| **OpenAI GPT-4o** | Blog content generation |
| **OpenAI DALL-E 3** | AI image generation |
| **Tailwind CSS** | Styling |
| **Tiptap** | Rich text editor |
| **Fabric.js** | Image editing canvas |

---

## 🎯 Platform Features

### 1. AI-Powered Blog Generation

- **Outline-Based Writing**: Create detailed blog outlines before generating content
- **SEO Optimization**: Built-in SEO scoring and recommendations
- **Keyword Integration**: Primary and secondary keyword targeting
- **Customizable Word Count**: Set target word counts (1000-5000+ words)
- **Multiple Sections**: Support for H2/H3 heading structure
- **FAQ Generation**: Automatic FAQ section creation

### 2. AI Image Generation

- **OpenAI DALL-E 3**: High-quality 1024×1024 images
- **Smart Prompts**: Topic-specific image prompts based on section content
- **Infographic Styles**: Automatic style selection based on section type:
  - Statistics sections → Data visualization infographics
  - How-to sections → Process diagrams/flowcharts
  - Benefits sections → Icon grids
  - Challenges sections → Conceptual illustrations
  - Future sections → Futuristic visuals
  - Examples sections → Realistic photographs
- **Featured Images**: Automatic hero image generation for articles
- **Database Storage**: Images stored directly in PostgreSQL (no external S3 dependency)

### 3. Professional Image Editor

- **Text Overlays**: Add custom text with fonts, colors, and positioning
- **Adjustments**: Brightness, contrast, saturation, hue, blur, exposure, temperature, vignette
- **Filters**: Grayscale, sepia, vintage, warm, cool, dramatic, fade
- **Transform**: Rotate, flip horizontal/vertical
- **Drawing**: Freehand annotations and shapes
- **Resize**: Multiple aspect ratio presets (16:9, 4:3, 1:1, etc.)
- **Crop**: Custom cropping functionality

### 4. Rich Text Editor (Tiptap)

- **WYSIWYG Editing**: Full visual editing experience
- **Formatting**: Bold, italic, headings, lists, alignment
- **Links**: Insert and manage hyperlinks
- **Images**: Inline image insertion with click-to-edit
- **Auto-Save**: Automatic content saving
- **HTML Export**: Export content as clean HTML

### 5. Credit System

- **Usage Tracking**: Track credits for all AI operations
- **Cost Breakdown**:
  - Blog Generation: 1 credit
  - Image Generation: 0.5 credits each
- **Transaction History**: Complete audit trail of credit usage
- **Balance Management**: Real-time credit balance display

---

## 👤 User Dashboard Features

### Dashboard Home (`/dashboard`)

- **Quick Stats**: Total blogs, published, drafts, word count
- **SEO Metrics**: Average SEO score, high-scoring blogs count
- **Employee Overview**: Team size, active employees, employee-created content
- **Recent Activity**: Latest blog entries
- **Monthly Trends**: Content creation graphs

### My Blogs (`/dashboard/blogs`)

- **Blog List**: View all created blogs with status indicators
- **Quick Actions**: Edit, preview, delete blogs
- **Status Management**: Draft → Published workflow
- **Search & Filter**: Find blogs by title, status, date

### Create Blog (`/dashboard/create`)

1. **Basic Info**: Title, primary keyword, secondary keywords
2. **Outline Builder**: 
   - Add/remove sections (H2)
   - Add/remove subsections (H3)
   - Toggle image generation per section
   - AI-assisted outline generation
3. **Content Generation**: One-click full article generation
4. **Real-time Preview**: Watch content stream in as it generates

### Blog Editor (`/dashboard/blogs/[id]/edit`)

- **Full WYSIWYG Editor**: Complete content editing
- **Image Management**: Add, edit, replace images
- **SEO Calculator**: Calculate and display SEO score
- **Auto-Save**: Changes saved automatically
- **Preview Mode**: See how the blog will look
- **HTML Export**: Download as HTML file

### Credits (`/dashboard/credits`)

- **Current Balance**: Display available credits
- **Usage Stats**: Credits used by operation type
- **Daily Usage Graph**: Visual representation of usage over time
- **Transaction History**: Complete credit transaction log

### Settings (`/dashboard/settings`)

- **Profile Settings**: Author name, company name
- **Company Profiles**: Create multiple company profiles for different brands
- **Website URL**: Set company website
- **Profile Management**: Edit/delete company profiles

### Team Management (`/dashboard/team`)

- **Employee List**: View all team members
- **Add Employees**: Create new employee accounts with:
  - Username/password
  - Full name, email
  - Role assignment
- **Status Control**: Activate/deactivate employees
- **Edit Employees**: Update employee details

### Roles & Permissions (`/dashboard/roles`)

- **Role Creation**: Create custom roles
- **Permission Assignment**: Assign granular permissions:
  - `blogs:create` - Create new blogs
  - `blogs:edit` - Edit existing blogs
  - `blogs:delete` - Delete blogs
  - `blogs:publish` - Publish blogs
  - `blogs:view_all` - View all blogs (not just own)
  - `images:generate` - Generate AI images
  - `images:edit` - Edit images
- **Role Management**: Edit, delete roles

### Research (`/dashboard/research`)

- **News Fetching**: Get relevant industry news
- **Content Ideas**: AI-powered topic suggestions
- **Competitor Analysis**: Research tools for content strategy

### Image Features (`/dashboard/image-features`)

- **Feature Documentation**: Overview of image capabilities
- **Usage Guide**: How to generate and edit images
- **Technical Details**: Implementation information

---

## 🔧 Admin Panel (SuperAdmin)

Access: `/superadmin` (requires superadmin credentials)

### SuperAdmin Dashboard (`/superadmin`)

**Platform Overview:**
- Total users count
- Total employees across all accounts
- Total blogs created
- Published vs draft ratio
- Active employees count

**Credit Statistics:**
- Total credits available across platform
- Total credits used
- Usage breakdown by operation type
- Low-credit user alerts

**System Metrics:**
- Blog performance metrics
- SEO score distribution
- Recent platform activity

### User Management (`/superadmin/users`)

- **User List**: All registered users with details
- **User Details**: Email, company, credits, join date
- **Blog Count**: Number of blogs per user
- **Status**: Account status indicators
- **Actions**: View user details, manage accounts

### Employee Management (`/superadmin/employees`)

- **Cross-Account View**: See all employees across all user accounts
- **Employee Details**: Username, email, role, status
- **Parent Account**: Which user account the employee belongs to
- **Activity Tracking**: Employee activity logs
- **Status Management**: Activate/deactivate employees

### Blog Management (`/superadmin/blogs`)

- **All Blogs**: View every blog on the platform
- **Author Info**: Who created each blog (user or employee)
- **Status Overview**: Draft/published status
- **SEO Scores**: Quality indicators
- **Delete Capability**: Remove inappropriate content

### Credit Management (`/superadmin/credits`)

**User Overview:**
- List all users with credit balances
- Sort by credits, usage, join date
- Identify low-credit users

**Credit Operations:**
- **Add Credits**: Grant credits to any user
- **Deduct Credits**: Remove credits if needed
- **Notes**: Add admin notes to transactions
- **Bulk Operations**: Manage multiple users

**Transaction History:**
- View all transactions for any user
- Filter by type, date, amount
- Audit trail for compliance

---

## 👥 Employee Portal

Access: `/employee/login`

### Employee Dashboard (`/employee/dashboard`)

- **Personal Stats**: Blogs created, published, drafts
- **Quick Actions**: Create new blog, view blogs
- **Activity Feed**: Recent activity

### Employee Blogs (`/employee/blogs`)

- **My Blogs**: List of employee's own blogs
- **Create Blog**: Generate new content (if permitted)
- **Edit Blog**: Modify existing content (if permitted)
- **View Blog**: Read-only blog preview

### Employee Blog Editor (`/employee/blogs/[id]/edit`)

- Same rich editing features as main dashboard
- Permission-based feature access
- Image generation (if permitted)

### Employee Settings (`/employee/settings`)

- **Profile**: Update personal information
- **Password**: Change password
- **Preferences**: Notification settings

---

## 🔐 Authentication & Security

### User Authentication (Clerk)

- Email/password login
- Social login options
- Session management
- Secure token handling

### Employee Authentication

- Separate employee login system
- Username/password based
- JWT token sessions
- Cookie-based authentication

### SuperAdmin Authentication

- Dedicated superadmin login
- Environment-based credentials
- Secure cookie sessions

### Permissions System

- Role-based access control (RBAC)
- Granular permission checks
- API-level authorization
- UI permission hiding

---

## 📊 Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Main user accounts (Clerk-linked) |
| `blogs` | Blog content and metadata |
| `blog_images` | Image storage with base64 data |
| `employees` | Employee accounts per user |
| `roles` | Custom roles per user |
| `role_permissions` | Permission assignments |
| `permissions` | Permission definitions |
| `employee_activity` | Activity logging |
| `credit_transactions` | Credit usage history |
| `company_profiles` | Multiple company brands |

### Key Fields

**blogs:**
- `id`, `title`, `slug`, `content`, `htmlContent`
- `status` (draft/published)
- `seoScore`, `wordCount`
- `userId`, `employeeId`
- `primaryKeyword`, `secondaryKeywords`

**blog_images:**
- `id`, `blogId`, `imageUrl`
- `imageData` (base64 stored in DB)
- `contentType`, `imagePrompt`
- `altText`, `position`

**users:**
- `id`, `clerkId`, `email`
- `credits`, `totalCreditsUsed`
- `companyName`, `authorName`

---

## 🚀 API Endpoints

### Blog APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/blogs/create` | POST | Create new blog |
| `/api/blogs/generate` | POST | Generate blog content |
| `/api/blogs/generate-outline` | POST | Generate blog outline |
| `/api/blogs/generate-from-outline` | POST | Generate full blog from outline |
| `/api/blogs/[id]` | GET/PUT | Get/update blog |
| `/api/blogs/[id]/save` | POST | Save blog content |
| `/api/blogs/[id]/status` | PUT | Update blog status |
| `/api/blogs/[id]/calculate-seo` | POST | Calculate SEO score |
| `/api/blogs/[id]/generate-images` | POST | Generate images for blog |
| `/api/blogs/[id]/delete` | DELETE | Delete blog |
| `/api/blogs/list` | GET | List user's blogs |

### Image APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/images/generate` | POST | Generate AI image |
| `/api/images/upload` | POST | Upload/save edited image |
| `/api/images/serve/[id]` | GET | Serve image from DB |
| `/api/images/suggestions` | POST | Get image prompt suggestions |

### Admin APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/employees` | GET/POST | List/create employees |
| `/api/admin/employees/[id]` | PUT/DELETE | Update/delete employee |
| `/api/admin/roles` | GET/POST | List/create roles |
| `/api/admin/roles/[id]` | PUT/DELETE | Update/delete role |
| `/api/admin/role-permissions` | GET/POST | Manage permissions |

### SuperAdmin APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/superadmin/users` | GET | List all users |
| `/api/superadmin/users/[id]` | GET/PUT | User details/update |
| `/api/superadmin/blogs` | GET | List all blogs |
| `/api/superadmin/employees` | GET | List all employees |
| `/api/superadmin/credits` | GET/POST | Credit management |

### Employee APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/employee/login` | POST | Employee login |
| `/api/employee/logout` | POST | Employee logout |
| `/api/employee/verify` | GET | Verify employee session |
| `/api/employee/blogs` | GET/POST | List/create blogs |
| `/api/employee/blogs/[id]` | GET/PUT | Blog operations |

---

## ⚙️ Environment Configuration

```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://...

# OpenAI (Required for blog & image generation)
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-...

# Gemini AI (Optional - for prompt enhancement)
GEMINI_API_KEY=AIza...
GEMINI_IMAGE_MODEL=gemini-2.5-flash

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SuperAdmin Credentials (set in env)
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=secure_password
```

---

## 🎨 UI/UX Features

- **Dark/Light Mode**: Theme toggle support
- **Responsive Design**: Works on desktop, tablet, mobile
- **Glass Morphism**: Modern frosted glass effects
- **Gradient Accents**: Beautiful color gradients
- **Loading States**: Skeleton loaders and spinners
- **Toast Notifications**: Success/error feedback
- **Modal Dialogs**: Confirmation and input modals
- **Sidebar Navigation**: Collapsible dashboard sidebar

---

## 📈 Business Model Support

The platform supports a credit-based monetization model:

1. **Credit Purchases**: Users buy credits
2. **Usage Deduction**: Credits deducted per operation
3. **Transaction Logging**: Complete audit trail
4. **Admin Control**: SuperAdmin can grant/revoke credits
5. **Balance Tracking**: Real-time balance updates

---

## 🔄 Workflow Summary

### Content Creation Flow

```
1. User logs in via Clerk
2. Creates new blog with title/keywords
3. Generates or manually creates outline
4. Clicks "Generate" to create full article
5. AI generates content + images
6. User edits in rich text editor
7. Calculates SEO score
8. Publishes when ready
```

### Employee Workflow

```
1. Admin creates employee account with role
2. Employee logs in via employee portal
3. Creates/edits blogs based on permissions
4. Content attributed to employee
5. Admin can review all employee content
```

### SuperAdmin Workflow

```
1. Login to superadmin panel
2. Monitor platform metrics
3. Manage user credits
4. Review all content
5. Manage employees across accounts
```

---

## 📝 License

This project is proprietary software. All rights reserved.

---

*Documentation last updated: February 8, 2026*
