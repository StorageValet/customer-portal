# Deployment Strategy Update: Claude Code + Vercel

## 🎯 **New Primary Deployment Strategy**

**Primary Path:** Claude Code + Vercel

- Development: VS Code with Claude integration
- Deployment: Vercel (optimized for full-stack TypeScript)
- Database: Airtable (unchanged)
- Authentication: Traditional email/password (simplified)

**Fallback Plan:** Replit (if needed)

- Keep existing Replit config as Plan B
- Move Replit-specific files to `/deployment/replit/`
- Update documentation hierarchy

## 📋 **Cleanup Actions Required**

### **1. Update Primary Documentation**

- [ ] README.md - Change deployment priority order
- [ ] Remove Replit SSO from main auth description
- [ ] Update environment variable templates
- [ ] Add Vercel-specific setup instructions

### **2. Reorganize Deployment Files**

```
deployment/
├── vercel/                 # Primary deployment
│   ├── vercel.json
│   ├── vercel-setup.md
│   └── environment-vars.md
├── replit/                 # Fallback option
│   ├── .replit
│   ├── REPLIT_DEPLOYMENT.md
│   ├── replit-prep.sh
│   └── REPLIT_SECRETS.env
└── alternatives/           # Other options
    ├── railway.toml
    └── render.yaml
```

### **3. Authentication Simplification**

- [ ] Make traditional email/password primary
- [ ] Keep Replit SSO as optional feature
- [ ] Update auth middleware priorities
- [ ] Clear auth flow documentation

### **4. Environment Variables Cleanup**

```bash
# Primary (.env.example)
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
STRIPE_SECRET_KEY=
OPENAI_API_KEY=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
SESSION_SECRET=

# Optional Replit SSO (if enabled)
REPLIT_APP_ID=
REPLIT_APP_SECRET=
```

## 🚀 **Implementation Priority**

### **Phase 1: Documentation Updates (Immediate)**

1. Update README.md deployment section
2. Create Vercel-specific setup guide
3. Reorganize deployment files
4. Update GitHub setup guide

### **Phase 2: Code Organization (Next)**

1. Move Replit files to subdirectory
2. Create Vercel configuration
3. Update authentication priority
4. Test build with Vercel CLI

### **Phase 3: Environment Cleanup (Final)**

1. Update all .env templates
2. Remove outdated references
3. Verify all documentation consistency
4. Test full deployment flow

## ✅ **Success Criteria**

- [ ] Primary path is clearly Claude Code + Vercel
- [ ] Replit is documented as fallback only
- [ ] No conflicting deployment instructions
- [ ] Clean environment variable templates
- [ ] Vercel deployment works end-to-end
- [ ] Documentation is consistent across all files
