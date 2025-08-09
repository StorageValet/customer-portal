# Recommended Agent Profiles for Storage Valet Development

## 1. 🔒 Security Audit Agent
**Purpose**: Regularly check for exposed secrets and vulnerabilities
```bash
# security-agent.sh
#!/bin/bash
echo "🔒 Security Audit Agent"
# Check for exposed API keys
grep -r "sk-\|pk_\|pat_\|ghp_" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null
# Check for hardcoded passwords
grep -r "password.*=.*['\"]" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null
# Verify .env files are gitignored
git check-ignore .env .env.production
```

## 2. 📊 Performance Monitor Agent
**Purpose**: Track build times and bundle sizes
```bash
# performance-agent.sh
#!/bin/bash
echo "📊 Performance Monitor Agent"
# Check bundle size
du -sh dist/ 2>/dev/null || echo "No build found"
# Monitor node_modules size
du -sh node_modules/ 2>/dev/null
# Check for large files
find . -type f -size +1M -not -path "*/node_modules/*" -not -path "*/.git/*"
```

## 3. 🧪 Test Coverage Agent
**Purpose**: Ensure tests exist and are passing
```bash
# test-agent.sh
#!/bin/bash
echo "🧪 Test Coverage Agent"
# Check for test files
find . -name "*.test.ts" -o -name "*.test.tsx" | wc -l
# Run type checking
npm run check 2>&1 | tail -10
```

## 4. 📦 Dependency Health Agent
**Purpose**: Check for outdated or vulnerable packages
```bash
# dependency-agent.sh
#!/bin/bash
echo "📦 Dependency Health Agent"
# Check for outdated packages
npm outdated || echo "All packages up to date"
# Check for vulnerabilities
npm audit --audit-level=moderate
```

## 5. 🔄 Sync State Agent
**Purpose**: Keep local and remote in sync
```bash
# sync-agent.sh
#!/bin/bash
echo "🔄 Sync State Agent"
# Check if we're behind remote
git fetch
git status -uno
# Check for uncommitted changes
git diff --stat
```

## 6. 💾 Database Schema Agent
**Purpose**: Validate Airtable schema alignment
```bash
# schema-agent.sh
#!/bin/bash
echo "💾 Database Schema Agent"
# Run schema validation
npm run schema:validate 2>&1 | tail -20
# Check for schema changes
npm run schema:changes 2>&1 | tail -20
```

## 7. 🚀 Deployment Readiness Agent
**Purpose**: Pre-deployment checklist
```bash
# deploy-agent.sh
#!/bin/bash
echo "🚀 Deployment Readiness Agent"
# Check environment variables
[ -f .env.production ] && echo "✅ Production env exists" || echo "❌ Missing .env.production"
# Test build
npm run build > /dev/null 2>&1 && echo "✅ Build successful" || echo "❌ Build failed"
# Check for console.logs
grep -r "console.log" client/src server/ --exclude-dir=node_modules | wc -l
```

## Master Agent Orchestrator

Runs all agents in sequence:
```bash
# master-agent.sh
#!/bin/bash
echo "🎭 Master Agent Orchestrator"
echo "============================"

agents=(
  "./environment-check.sh"
  "./security-agent.sh"
  "./dependency-agent.sh"
  "./sync-agent.sh"
)

for agent in "${agents[@]}"; do
  if [ -f "$agent" ]; then
    echo ""
    $agent
    echo ""
  fi
done
```

---

# MCP (Model Context Protocol) Integration

## What are MCPs?
MCPs are server-based tools that extend Claude's capabilities with external services. They're like plugins that give Claude new abilities.

## Available MCPs You Might Have:
1. **Zapier** - Automate workflows, trigger actions
2. **Todoist** - Task management integration
3. **Gmail** - Email management
4. **Slack** - Team communication
5. **Linear** - Issue tracking

## How MCPs Work in Claude Code:

### Current State:
- MCPs configured in your Claude web app do NOT automatically work in Claude Code Terminal
- Claude Code Terminal has its own tool set (file operations, bash, etc.)
- MCPs would need to be specifically enabled for Claude Code

### To Enable MCPs in Claude Code:

1. **Check Available MCPs**:
   Look for any `mcp__` prefixed tools in your Claude Code session

2. **Request MCP Access**:
   ```
   I need access to Zapier MCP for automating deployment notifications
   ```

3. **Use When Available**:
   ```python
   # If Zapier MCP is available
   mcp__zapier_create_zap(
     trigger="github_push",
     action="send_slack_message"
   )
   ```

## Practical MCP Use Cases for Storage Valet:

### 1. **Zapier MCP** (if available):
- Trigger when code is pushed to GitHub
- Send Slack notifications on deployment
- Create Airtable records for new features
- Monitor error rates and alert

### 2. **Airtable MCP** (would be perfect!):
- Direct schema management
- Data migration tools
- Real-time sync validation

### 3. **Stripe MCP** (if exists):
- Manage products and prices
- Test payment flows
- Monitor subscription status

## How to Check for MCPs:

In your Claude Code session, I can check what tools are available:
```
List all available tools and check for any starting with "mcp__"
```

## Creating MCP-like Functionality Without MCPs:

Since MCPs might not be available in Claude Code, we can create similar functionality:

### Zapier Webhook Agent:
```bash
# zapier-webhook.sh
#!/bin/bash
WEBHOOK_URL="your-zapier-webhook-url"

send_to_zapier() {
  local event=$1
  local data=$2
  
  curl -X POST $WEBHOOK_URL \
    -H "Content-Type: application/json" \
    -d "{\"event\": \"$event\", \"data\": $data}"
}

# Usage
send_to_zapier "deployment_complete" '{"version": "1.0.0", "environment": "production"}'
```

### Direct Service Integration:
```typescript
// services/automation.ts
export class AutomationService {
  async notifyDeployment(version: string) {
    // Direct Slack webhook
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚀 Storage Valet v${version} deployed!`
      })
    });
    
    // Direct Airtable update
    await updateAirtableDeployment(version);
  }
}
```

---

## Recommendation:

1. **Use Built-in Agents**: The defensive agents we created are immediately useful
2. **Check MCP Availability**: I'll check what MCPs are available in our session
3. **Create Webhook Bridges**: For services like Zapier, we can use webhooks
4. **Focus on Core Tools**: File operations, bash, and git are our primary tools

Would you like me to:
1. Create any of these additional agent profiles?
2. Check what MCPs are currently available in this session?
3. Set up webhook integrations for automation?