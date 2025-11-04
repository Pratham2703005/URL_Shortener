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