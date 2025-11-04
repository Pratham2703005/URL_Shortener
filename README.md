# 🔗 URL Shortener

A modern, feature-rich URL shortening service built with Next.js 16, featuring OAuth authentication, real-time analytics, and a sleek user interface.

## 📸 Project Showcase

### 🏠 Home & Authentication
<div align="center">
  <img src="public/home_login_oauth.png" alt="Home Page with OAuth Login" width="800"/>
  <p><em>Secure login with Google and GitHub OAuth providers</em></p>
</div>

### 📊 Dashboard Overview
<div align="center">
  <img src="public/dashboard.png" alt="Dashboard with URL Management" width="800"/>
  <p><em>Clean dashboard showing all your shortened URLs with click statistics</em></p>
</div>

### ✨ Create Short URL
<div align="center">
  <img src="public/filled_feilds_to_shorten_url.png" alt="Creating a Short URL" width="800"/>
  <p><em>Simple form to create shortened URLs with optional custom aliases</em></p>
</div>

### ✅ Success & Copy
<div align="center">
  <img src="public/short_url_created.png" alt="Short URL Created Successfully" width="800"/>
  <p><em>Successfully created short URL with copy-to-clipboard functionality</em></p>
</div>

### 🔄 URL Management
<div align="center">
  <img src="public/acitvate_deactivate.png" alt="Activate/Deactivate URLs" width="800"/>
  <p><em>Toggle URLs active/inactive status with one click</em></p>
</div>

### 🛡️ Smart Validations
<div align="center">
  <img src="public/cannot_have_more_than_5_url.png" alt="5 URL Limit Validation" width="800"/>
  <p><em>Enforced limit of 5 active URLs per user for fair usage</em></p>
</div>

<div align="center">
  <img src="public/same_alias_issue.png" alt="Duplicate Alias Prevention" width="800"/>
  <p><em>Prevents duplicate custom aliases to ensure data integrity</em></p>
</div>

---

## 📊 Shortened URL Click Flow

The following diagram shows the complete flow from clicking a shortened URL to being redirected to the original destination.

```mermaid
graph TB
    Start([User Clicks Shortened URL]) --> Request[Browser sends GET request]
    
    Request --> RouteHandler{Next.js Route Handler}
    
    RouteHandler --> ExtractCode[Extract shortCode from URL params]
    
    ExtractCode --> QueryDB[(Query MongoDB via Prisma)]
    
    QueryDB --> CheckExists{URL Found?}
    
    CheckExists -->|No| Return404[Return 404 Response]
    Return404 --> End404([User sees 404 page])
    
    CheckExists -->|Yes| CheckActive{Is URL Active?}
    
    CheckActive -->|No| ReturnInactive[Return 404 Response]
    ReturnInactive --> EndInactive([User sees 404 page])
    
    CheckActive -->|Yes| ParallelOps[Parallel Operations]
    
    ParallelOps --> Analytics[Create ClickAnalytics Record]
    ParallelOps --> IncrementCount[Increment clickCount]
    
    Analytics --> CaptureIP[Capture IP Address]
    CaptureIP --> CaptureUA[Capture User Agent]
    CaptureUA --> CaptureRef[Capture Referrer]
    CaptureRef --> SaveAnalytics[(Save to ClickAnalytics)]
    
    IncrementCount --> UpdateDB[(Update URL clickCount)]
    
    SaveAnalytics --> WaitBoth[Wait for both operations]
    UpdateDB --> WaitBoth
    
    WaitBoth --> Redirect[Return 302 Redirect]
    
    Redirect --> BrowserRedirect[Browser redirects automatically]
    
    BrowserRedirect --> Success([User reaches destination])
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style Success fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End404 fill:#f44336,stroke:#c62828,color:#fff
    style EndInactive fill:#f44336,stroke:#c62828,color:#fff
    style QueryDB fill:#2196F3,stroke:#1565C0,color:#fff
    style SaveAnalytics fill:#2196F3,stroke:#1565C0,color:#fff
    style UpdateDB fill:#2196F3,stroke:#1565C0,color:#fff
    style CheckExists fill:#FF9800,stroke:#E65100,color:#fff
    style CheckActive fill:#FF9800,stroke:#E65100,color:#fff
```

## 🔍 Detailed Step-by-Step Process

### 1. **User Clicks Shortened URL**
   - Example: `http://localhost:3000/s/abc123`
   - Browser sends GET request to the server

### 2. **Route Handler Receives Request**
   - Next.js App Router matches the dynamic route: `app/s/[shortCode]/route.ts`
   - Extracts `shortCode` from URL parameters (e.g., "abc123")

### 3. **Database Query**
   - Prisma queries MongoDB to find URL record matching the shortCode
   - Query: `prisma.url.findUnique({ where: { shortCode: 'abc123' } })`

### 4. **URL Validation**
   - **Check if URL exists**: If not found, return 404 error
   - **Check if URL is active**: If `isActive = false`, return 404 error

### 5. **Parallel Operations** (for better performance)
   
   **Operation A - Analytics Tracking:**
   - Capture visitor data:
     - IP Address (from request headers)
     - User Agent (browser/device info)
     - Referrer (where user came from)
   - Create new record in `ClickAnalytics` collection
   
   **Operation B - Click Count Update:**
   - Increment the `clickCount` field by 1
   - Updates the `Url` record in database

### 6. **Redirect Response**
   - Server returns HTTP 302 (Temporary Redirect)
   - Response header: `Location: <original-long-url>`
   - Browser automatically follows the redirect

### 7. **User Reaches Destination**
   - Browser navigates to the original URL
   - User sees the intended website

## 📈 Analytics Data Captured

For each click, the following information is stored:

| Field | Description | Example |
|-------|-------------|---------|
| `urlId` | Reference to the URL record | ObjectId(...) |
| `ipAddress` | Visitor's IP address | "192.168.1.1" |
| `userAgent` | Browser and device info | "Mozilla/5.0..." |
| `referer` | Source of the click | "https://twitter.com" |
| `clickedAt` | Timestamp of click | 2025-11-04T10:30:00Z |

---

## ✨ Features

- 🔐 **OAuth Authentication** - Sign in with Google or GitHub
- 🎯 **Custom Aliases** - Create personalized short URLs
- 📊 **Click Analytics** - Track clicks, referrers, and geographic data
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- ⚡ **Optimistic Updates** - Instant UI feedback
- 🛡️ **Rate Limiting** - Maximum 5 active URLs per user
- 🔔 **Toast Notifications** - Real-time feedback
- 📱 **Mobile Responsive** - Works on all devices

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Authentication:** NextAuth.js v4
- **Database:** MongoDB with Prisma ORM
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript 5
- **UI Icons:** Lucide React
- **Notifications:** Sonner

## 📋 Prerequisites

- Node.js 18 or higher
- MongoDB database (MongoDB Atlas recommended)
- Google OAuth credentials ([Get here](https://console.cloud.google.com/))
- GitHub OAuth credentials ([Get here](https://github.com/settings/developers))

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd url_shortener
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/url_shortener"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Generate Prisma Client**

```bash
npm run prisma:generate
```

5. **Push database schema**

```bash
npm run prisma:push
```

6. **Run the development server**

```bash
npm run dev
```

7. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema to database
npm run prisma:studio    # Open Prisma Studio
```

## 🎯 Usage

1. **Sign In** - Click "Sign in with Google" or "Sign in with GitHub"
2. **Create Short URL** - Enter your long URL and optionally add a custom alias
3. **Copy & Share** - Click the copy button to get your shortened link
4. **Track Analytics** - View click counts and analytics for each URL
5. **Manage URLs** - Activate/deactivate or delete URLs as needed

## 🗄️ Database Schema

### User
- Stores user information from OAuth providers
- Links to accounts, sessions, and URLs

### Account
- OAuth provider connections (Google, GitHub)
- Stores access tokens and refresh tokens

### Session
- Database-backed session management
- 30-day session expiry

### Url
- Shortened URLs with original URL mapping
- Auto-generated short codes or custom aliases
- Click count tracking
- Active/inactive status

### ClickAnalytics
- Detailed click tracking per URL
- IP address, user agent, referrer
- Geographic data (country, city)
- Timestamp for each click

## 🔒 Security Features

- Database-backed sessions with 30-day expiry
- Protected API routes with server-side authentication
- Email account linking for multiple OAuth providers
- Input validation for custom aliases
- Rate limiting (5 active URLs per user)


**Made by Pratham**