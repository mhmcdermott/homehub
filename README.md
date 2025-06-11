# 🏠 HomeHub - Intelligent Household Management System

> **A beautiful, AI-powered household management system that makes organizing your life effortless.**

HomeHub is a Next.js application that transforms how you manage household documents, contacts, and reminders. Simply forward emails with attachments, and watch as AI automatically categorizes and organizes everything for you.

![HomeHub Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC)

## ✨ Features

### 🤖 **AI-Powered Document Processing**
- **Email Integration**: Forward any email with attachments to your personal HomeHub address
- **Smart Categorization**: AI automatically categorizes documents (Insurance, Warranty, Legal, Medical, etc.)
- **Intelligent Tagging**: Extracts relevant tags and metadata from filenames and content
- **Expiry Detection**: Automatically sets renewal dates for insurance, warranties, and contracts

### 🎨 **Beautiful User Interface**
- **Animated Dashboard**: Real-time stats with smooth animations using Framer Motion
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Themes**: Modern, professional appearance
- **Intuitive Navigation**: Clean, accessible interface design

### 🔒 **Enterprise-Grade Security**
- **Authorized Senders Only**: Whitelist-based email processing
- **Automatic Deletion**: Unauthorized emails are silently deleted
- **OAuth2 Authentication**: Secure Google sign-in with email restrictions
- **Encrypted Storage**: All documents stored securely with user isolation

### 💬 **AI Assistant Chat**
- **Natural Language Queries**: "Show me all insurance documents expiring this year"
- **Context-Aware Responses**: AI has access to your document metadata
- **Smart Suggestions**: Pre-built queries for common questions
- **Copy Responses**: One-click copying of AI responses

### 📊 **Smart Dashboard**
- **Overview Cards**: Document counts, expiring items, upcoming reminders
- **Quick Search**: Instant search across all content
- **Trend Analytics**: Visual indicators of household activity
- **Quick Actions**: Fast access to common tasks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL
- Google Cloud Project (for Gmail integration)
- Anthropic API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/homehub.git
   cd homehub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` and sign in with your Google account!

## 🛠️ Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user@localhost:5432/homehub"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Anthropic AI
ANTHROPIC_API_KEY="your-anthropic-api-key"

# User Access (restrict to specific emails)
USER_EMAIL_1="your.email@gmail.com"
USER_EMAIL_2="partner.email@gmail.com"

# Gmail Integration (optional)
GMAIL_SERVICE_EMAIL="homehub@yourdomain.com"
GMAIL_SERVICE_PRIVATE_KEY="your-service-account-key"
GMAIL_PROCESSOR_API_KEY="your-secure-api-key"
```

### Gmail Setup

1. **Create Google Cloud Project**
2. **Enable Gmail API**
3. **Create Service Account** with domain-wide delegation
4. **Configure OAuth Scopes**:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`

See [GMAIL_SETUP.md](./GMAIL_SETUP.md) for detailed instructions.

## 📁 Project Structure

```
homehub/
├── components/           # React components
│   ├── DashboardEnhanced.tsx
│   ├── ChatEnhanced.tsx
│   ├── DocumentsPageSmart.tsx
│   └── Layout.tsx
├── lib/                 # Utilities and services
│   ├── auth.ts         # NextAuth configuration
│   ├── prisma.ts       # Database client
│   └── services/
│       ├── claude.ts   # AI integration
│       ├── emailProcessor.ts
│       └── gmailProcessor.ts
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   ├── index.tsx      # Dashboard
│   ├── documents.tsx  # Document management
│   ├── chat.tsx       # AI assistant
│   └── ...
├── prisma/            # Database schema
└── styles/            # Global styles
```

## 🎯 Usage Examples

### Email Document Processing

Forward any email with attachments to your HomeHub address:

```
To: homehub@yourdomain.com
Subject: Car Insurance Renewal
Attachments: car_insurance_policy_2024.pdf
```

**Result**: Document automatically categorized as "Insurance", tagged with "car, insurance, 2024", and expiry set to one year from now.

### AI Assistant Queries

- "What documents expire this month?"
- "Show me all warranty information"
- "When is my car MOT due?"
- "List all emergency contacts"

### Document Categories

HomeHub automatically recognizes:
- **Insurance** (policies, renewals)
- **Warranty** (receipts, guarantees)
- **Legal** (contracts, agreements)
- **Medical** (test results, prescriptions)
- **Financial** (statements, invoices)
- **Automotive** (MOT, service records)
- **Property** (deeds, surveys)
- **Travel** (passports, visas)
- **Household** (utilities, appliances)

## 🔧 Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Database Management

```bash
npx prisma studio    # Open database browser
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma db pull   # Pull schema from database
```

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect GitHub repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** automatically on push to main branch

### Docker

```bash
docker build -t homehub .
docker run -p 3000:3000 homehub
```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up production database**
3. **Configure environment variables**
4. **Start the application**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** for the amazing React framework
- **Tailwind CSS** for beautiful styling
- **Framer Motion** for smooth animations
- **Anthropic Claude** for AI capabilities
- **Prisma** for database management
- **NextAuth.js** for authentication

## 🆘 Support

- 📖 [Documentation](./docs/)
- 🐛 [Report Bug](https://github.com/yourusername/homehub/issues)
- 💡 [Request Feature](https://github.com/yourusername/homehub/issues)
- 💬 [Discussions](https://github.com/yourusername/homehub/discussions)

---

**Built with ❤️ for modern households**