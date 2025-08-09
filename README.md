# Storage Valet Portal

Customer portal for Storage Valet - a premium valet storage service that picks up, stores, and delivers your belongings on demand.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Express.js + TypeScript + Node.js
- **Database**: Airtable (11 tables with complete schema)
- **Authentication**: Email/Password authentication with persistent sessions
- **Payments**: Stripe integration with subscription management
- **File Storage**: Dropbox API with fallback placeholders
- **AI Features**: OpenAI GPT-4 integration for chat and categorization
- **Email**: Gmail API integration with fallback webhook system

## 🚀 Quick Start with GitHub Codespaces

⚠️ **Note**: Due to macOS security restrictions, local development may be blocked. GitHub Codespaces is the recommended development environment.

### Using GitHub Codespaces (Recommended)

1. Click the green "Code" button above
2. Select "Codespaces" tab  
3. Click "Create codespace on main"
4. Wait for environment to load
5. In the terminal, run:
   ```bash
   npm install
   npm run dev
   ```

### Local Development (If Accessible)

```bash
# Clone the repository
git clone https://github.com/yourusername/storage-valet-portal.git
cd storage-valet-portal

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Run development server
npm run dev
```

The application will be available at `http://localhost:3000` (or via Codespaces URL)

## 🗄️ Database Schema

This application uses **Airtable as the primary database** with 11 interconnected tables:

### Core Tables (Implemented)

- **Customers** - User accounts, billing, and profiles
- **Containers** - Stored items with photos and metadata
- **Movements** - Pickup and delivery scheduling

### Extended Tables (Schema Defined)

- **Facilities** - Storage facility management
- **Zones** - Warehouse zone organization
- **Container Types** - Container specifications
- **Promo Codes** - Marketing campaign management
- **Referrals** - Customer referral system
- **Notifications** - Multi-channel messaging
- **Properties** - Property partnership management
- **Waitlist** - Customer acquisition pipeline

> **Important**: This application does NOT use PostgreSQL, MySQL, or any SQL database. All data operations are handled through the Airtable API.

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```bash
# Airtable Configuration (Required)
AIRTABLE_API_KEY=pat_your_personal_access_token
AIRTABLE_BASE_ID=app_your_airtable_base_id

# Authentication & Sessions
SESSION_SECRET=your_long_random_string_min_32_chars

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# AI Features
OPENAI_API_KEY=sk_your_openai_api_key

# Email Service
GMAIL_CLIENT_ID=your_gmail_oauth_client_id
GMAIL_CLIENT_SECRET=your_gmail_oauth_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_oauth_refresh_token
GMAIL_USER_EMAIL=your_gmail_address

# File Storage
DROPBOX_ACCESS_TOKEN=your_dropbox_access_token

# Development
NODE_ENV=development
PORT=3000
```

## 📁 Project Structure

```
storage-valet-portal/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── contexts/      # React contexts
│   └── index.html
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Airtable integration
│   ├── enhanced-storage.ts # Advanced schema management
│   ├── email.ts          # Email service
│   ├── ai-service.ts     # OpenAI integration
│   └── stripe-service.ts # Payment processing
├── shared/               # Shared TypeScript types
│   ├── schema.ts         # Data models and validation
│   └── airtable-schema.ts # Complete Airtable schema
├── tools/                # Development tools
│   ├── schema-validator.ts # Schema synchronization
│   ├── schema-cli.ts     # CLI tools
│   └── test-schema.ts    # Schema testing
├── docs/                 # Documentation
│   ├── development-setup.md
│   ├── airtable-schema-sync-plan.md
│   └── schema-implementation-guide.md
└── package.json
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm start              # Start production server

# Code Quality
npm run check          # TypeScript type checking
npm run format         # Format all files with Prettier
npm run format:check   # Check if files are properly formatted

# Schema Management
npm run schema:test    # Test schema tools
npm run schema:validate # Validate against live Airtable
npm run schema:status  # Complete schema status report
npm run schema:changes # Detect schema changes
```

### Development Workflow

1. **Start Development**: `npm run dev`
2. **Make Changes**: Edit files in `client/src/` or `server/`
3. **Code Formatting**: Automatic via Prettier (format on save enabled)
4. **Type Check**: `npm run check`
5. **Test Schema**: `npm run schema:test`
6. **Format Check**: `npm run format:check` (optional - files auto-format)
7. **Commit Changes**: Follow conventional commits

## 🏢 Business Logic

### Customer Plans

- **Starter**: 10 items, $49/month
- **Medium**: 25 items, $99/month
- **Family**: 50 items, $179/month
- **Custom**: Unlimited items, custom pricing

### Pricing Structure

- Setup fee: $100 (waivable with promo codes)
- Insurance: Included up to plan limits
- Additional services: À la carte pricing

### Key Features

- QR code item tracking
- Photo-based inventory management
- Scheduled pickup/delivery
- Real-time item location tracking
- AI-powered item categorization
- Multi-channel notifications
- Referral rewards system
- Property partnership integration

## 🔒 Security

- Session-based authentication with Airtable persistence
- Hybrid SSO + traditional auth support
- Stripe-compliant payment processing
- Input validation with Zod schemas
- Environment-based configuration
- Secure file upload handling

## 🚀 Deployment

### Supported Platforms

- **Vercel** (Primary) - Optimized for TypeScript full-stack apps
- **Claude Code + VS Code** (Development) - AI-assisted development environment
- **Railway** - Alternative full-stack deployment
- **Render** - Production-ready alternative

### Pre-deployment Checklist

1. ✅ Set all environment variables
2. ✅ Verify Airtable connection
3. ✅ Test Stripe integration
4. ✅ Validate schema synchronization
5. ✅ Run type checking: `npm run check`
6. ✅ Test build: `npm run build`

## 🧪 Testing

### Schema Testing

```bash
npm run schema:test     # Test schema tools without API calls
npm run schema:validate # Validate against live Airtable (requires credentials)
```

### Manual Testing Routes

- **Authentication**: `/login`, `/signup`, `/reset-password`
- **Dashboard**: `/dashboard`, `/items`, `/movements`
- **Admin**: `/admin` (restricted access)
- **Email Testing**: `/test-email` (development only)

## 🤖 AI Integration

### OpenAI Features

- **Item Categorization**: Automatic category assignment
- **Customer Chat**: AI-powered support assistant
- **Content Generation**: Dynamic email templates

### Usage

```typescript
// Categorize items
const category = await aiService.categorizeItem(itemName, description);

// Chat assistance
const response = await aiService.chatCompletion(userMessage, context);
```

## 📊 Schema Synchronization

This project includes advanced schema synchronization tools to maintain perfect alignment between the Airtable database and application code.

### Key Features

- **Live Schema Validation**: Compare implementation with Airtable
- **Change Detection**: Automatic schema change monitoring
- **Field Mapping**: Type-safe transformations between app and Airtable
- **Data Validation**: Prevent invalid data from reaching database

### Usage

```bash
npm run schema:status   # Get complete synchronization status
npm run schema:changes  # Detect any schema changes
```

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/user` - Get current user

### Customer Management

- `GET /api/customers` - List customers (admin)
- `PUT /api/customers/:id` - Update customer
- `POST /api/customers/:id/subscription` - Manage subscription

### Item Management

- `GET /api/items` - Get user items
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/photos` - Upload photos

### Movement Management

- `GET /api/movements` - Get user movements
- `POST /api/movements` - Schedule movement
- `PUT /api/movements/:id` - Update movement

## 🎨 UI Components

Built with **Radix UI** and **Tailwind CSS** for a modern, accessible interface:

- **Form Components**: Input, Select, Checkbox, Radio
- **Navigation**: Sidebar, Breadcrumbs, Pagination
- **Feedback**: Toast notifications, Loading states, Error boundaries
- **Data Display**: Tables, Cards, Modals, Tooltips
- **Interactive**: Drag & drop, File upload, Image carousel

## 🌟 Key Differentiators

1. **Airtable-First Architecture**: No SQL database overhead
2. **Hybrid Authentication**: Flexible auth options for different environments
3. **Schema Synchronization**: Automated database consistency
4. **AI-Enhanced UX**: Smart categorization and chat assistance
5. **Multi-Platform Ready**: Deploy anywhere with minimal configuration

## 📚 Documentation

- **Setup Guide**: [`docs/development-setup.md`](docs/development-setup.md)
- **Code Formatting**: [`docs/prettier-setup.md`](docs/prettier-setup.md)
- **Schema Management**: [`docs/airtable-schema-sync-plan.md`](docs/airtable-schema-sync-plan.md)
- **Implementation Guide**: [`docs/schema-implementation-guide.md`](docs/schema-implementation-guide.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run schema:test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Schema Issues**: Run `npm run schema:status`
- **Type Errors**: Run `npm run check`
- **General Issues**: Check existing issues or create a new one

## 🔮 Roadmap

### Phase 1: Core Functionality ✅

- Basic CRUD operations
- Authentication system
- Payment integration

### Phase 2: Enhanced Features 🚧

- Complete schema implementation
- Advanced AI features
- Real-time notifications

### Phase 3: Scale & Optimize 📋

- Performance optimization
- Advanced analytics
- Mobile app integration

---

**Built with ❤️ for Storage Valet customers**
