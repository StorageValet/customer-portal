# Storage Valet Customer Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Airtable](https://img.shields.io/badge/Airtable-18BFFF?style=flat&logo=airtable&logoColor=white)](https://airtable.com/)

A modern, full-stack customer portal for Storage Valet's concierge storage service. Built with React, TypeScript, Express, and Airtable.

## 🚀 Quick Start for Developers

```bash
git clone https://github.com/yourusername/storage-valet-portal.git
cd storage-valet-portal
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

## 🏗️ Architecture Overview

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: Airtable (11 tables, no SQL needed)
- **Auth**: Hybrid SSO + Email/Password
- **Payments**: Stripe with subscription management
- **AI**: OpenAI GPT-4 integration
- **File Storage**: Dropbox API

## 📚 Key Documentation

- **[Complete Setup Guide](docs/development-setup.md)** - Detailed installation instructions
- **[Schema Management](docs/airtable-schema-sync-plan.md)** - Database synchronization tools
- **[Implementation Guide](docs/schema-implementation-guide.md)** - Step-by-step development guide

## 🛠️ Schema Management Tools

This project includes advanced tools for maintaining perfect synchronization between Airtable and your code:

```bash
npm run schema:test      # Test schema tools
npm run schema:validate  # Validate against live Airtable
npm run schema:status    # Complete status report
```

## 🗄️ Database Tables

### Implemented (3/11)

- ✅ **Customers** - User accounts and billing
- ✅ **Containers** - Item inventory with photos
- ✅ **Movements** - Pickup/delivery scheduling

### Schema Defined (8/11)

- 🔧 Facilities, Zones, Container Types
- 🔧 Promo Codes, Referrals, Notifications
- 🔧 Properties, Waitlist

## 🚀 Deployment Ready

Multiple deployment options with pre-configured files:

- **Replit** (`.replit` file included)
- **Vercel** (`vercel.json` included)
- **Railway** (`railway.toml` included)
- **Render** (`render.yaml` included)

## 🔐 Environment Setup

Required environment variables:

```bash
AIRTABLE_API_KEY=pat_your_token
AIRTABLE_BASE_ID=app_your_base_id
STRIPE_SECRET_KEY=sk_your_key
SESSION_SECRET=your_secret
# ... (see .env.example for complete list)
```

## 🎯 Perfect for AI Development Tools

This repository is optimized for use with:

- ✅ **OpenAI Codex** - Clear structure, comprehensive docs
- ✅ **Claude by Anthropic** - Detailed context in every file
- ✅ **VS Code** - Full TypeScript support, debugging configs
- ✅ **GitHub Copilot** - Consistent patterns, good comments

## 📊 Project Stats

- **Language**: TypeScript 95%+
- **Test Coverage**: Schema validation suite included
- **Documentation**: Comprehensive guides in `/docs`
- **Type Safety**: Full end-to-end TypeScript
- **API Endpoints**: 25+ RESTful routes

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm run schema:test`
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Ready for production deployment with enterprise-grade schema management** 🚀
