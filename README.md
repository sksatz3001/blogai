# Contendo - AI-Powered Blog Creation Platform

A modern, full-stack SaaS platform for creating SEO-optimized blogs with AI assistance. Built with Next.js 15, TypeScript, Tailwind CSS, and cutting-edge AI technologies.

## ✨ Features Implemented

### ✅ Core Infrastructure
- **Next.js 15** with App Router and Server Components
- **TypeScript** for type safety
- **Tailwind CSS** with custom glassmorphism design
- **shadcn/ui** components with beautiful animations
- **Dark/Light Mode** with next-themes
- **Clerk Authentication** for secure user management
- **Neon PostgreSQL** with Drizzle ORM

### ✅ User Experience
- **Beautiful Landing Page** with gradient designs
- **Multi-Step Onboarding** with brand customization:
  - Company name and website
  - Author information
  - Brand colors (primary, secondary, accent) with color picker
- **Modern Dashboard** with:
  - Left sidebar navigation
  - Stats cards (total blogs, published, drafts)
  - Recent blogs list
  - Glass-morphism effects

### ✅ Blog Creation
- **Modern Input Form** with:
  - Blog title
  - Primary keyword
  - Secondary keywords (comma-separated)
  - Target word count
- **Real-time AI Generation**:
  - OpenAI GPT-4 integration
  - Streaming text generation (line-by-line animation)
  - Auto-saves to database
- **Rich Text Editor** (Tiptap):
  - Bold, Italic formatting
  - Headings (H2, H3)
  - Lists (bullet, ordered)
  - Text alignment
  - Link insertion
  - Image insertion
  - Full toolbar controls

### ✅ Blog Management
- **Edit Page** with:
  - Real-time streaming generation
  - Magic wand animation on completion
  - Auto-scroll during generation
  - Save functionality
  - Content persistence

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Already configured in `.env.local`:
- Clerk authentication
- Neon PostgreSQL database
- OpenAI API
- Gemini API (for future image generation)

### 3. Database Setup
```bash
npm run db:push
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
/app
  ├── api/              # API routes
  │   ├── onboarding/   # User onboarding
  │   └── blogs/        # Blog CRUD & generation
  ├── dashboard/        # Protected dashboard routes
  │   ├── create/       # Blog creation page
  │   └── blogs/        # Blog management
  ├── onboarding/       # User setup flow
  └── layout.tsx        # Root layout with providers

/components
  ├── ui/               # shadcn/ui components
  ├── dashboard-sidebar.tsx
  ├── onboarding-form.tsx
  ├── tiptap-editor.tsx
  └── theme-toggle.tsx

/db
  ├── schema.ts         # Drizzle ORM schema
  └── index.ts          # Database connection

/lib
  └── utils.ts          # Utility functions
```

## 🗄️ Database Schema

### Users Table
- Clerk ID, email
- Company info (name, website)
- Brand colors (primary, secondary, accent)
- Author name
- Onboarding status

### Blogs Table
- User relationship
- Title, content, HTML content
- Keywords (primary & secondary array)
- Word count & target word count
- Status (draft/published/archived)
- SEO metrics (placeholders for future)
- Timestamps

### Blog Images Table
- Blog relationship
- Image URL, prompt, alt text
- Position, dimensions
- Timestamps

## 🎨 Design Features

- **Glassmorphism**: Translucent backgrounds with backdrop blur
- **Gradient Backgrounds**: Dynamic color transitions
- **Smooth Animations**: Framer Motion for page transitions
- **Responsive Design**: Mobile-first approach
- **Modern Cards**: Stylish borders and shadows
- **Color Pickers**: React-colorful for brand customization

## 🔐 Authentication Flow

1. User signs up via Clerk
2. Redirected to onboarding
3. Completes company & brand setup
4. Database entry created
5. Redirected to dashboard

## 📝 Blog Creation Flow

1. User enters blog details (title, keywords, word count)
2. Clicks "Generate Blog with AI"
3. Blog entry created in database
4. Redirected to editor
5. OpenAI streams content in real-time
6. User sees line-by-line generation
7. Magic wand animation on completion
8. Content auto-saved to database
9. User can edit with rich text editor

## 🛠️ Technologies Used

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Authentication**: Clerk
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle
- **AI**: OpenAI GPT-4, Google Gemini (upcoming)
- **Editor**: Tiptap
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner
- **State**: React Hooks

## 📦 Next Steps (To Be Implemented)

### Image Generation
- Gemini AI integration for contextual images
- Automatic image placement in blog
- Magic wand animation for image generation

### Image Editor
- Advanced editing tools (crop, rotate, resize)
- Filters and presets
- Prompt-based editing (image-to-image)
- Click-to-edit functionality

### SEO Metrics
- On-page SEO score calculation
- Keyword density analysis
- AEO (Answer Engine Optimization) score
- GEO (Generative Engine Optimization) score
- E-E-A-T score evaluation
- Real-time metrics display

### Export Features
- Export as DOCX
- Export as PDF
- Copy HTML code
- Download blog functionality

### Blog Management
- List all blogs page
- Filter by status (draft/published)
- Delete blogs
- View detailed metrics
- Search functionality

## 🎯 Key Features Highlights

1. **Streaming AI Generation**: Watch your blog being written in real-time
2. **Beautiful UI**: Modern glassmorphism with smooth animations
3. **Rich Editor**: Full-featured Tiptap editor with toolbar
4. **Brand Customization**: Personalize with company colors
5. **Dark Mode**: Seamless light/dark theme switching
6. **Type-Safe**: Full TypeScript implementation
7. **Responsive**: Works perfectly on all devices

## 🔥 Performance

- Server Components for optimal performance
- Streaming responses for instant feedback
- Optimistic UI updates
- Efficient database queries with Drizzle
- Image optimization with Next.js

## 📄 License

This project is proprietary software for Contendo platform.

---

Built with ❤️ using Next.js, TypeScript, and AI
