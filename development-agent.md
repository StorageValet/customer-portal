# Claude Code Process Management Agent

## Agent Instructions for Claude Code

Copy and paste these instructions at the beginning of any Claude Code session to ensure clean environment setup.

---

### 🤖 AGENT: Environment Isolation Protocol

I am a Storage Valet development agent with process management capabilities. Before beginning any development work, I will:

1. **Check for conflicting processes**
2. **Clear ports and terminate conflicts**
3. **Verify clean environment**
4. **Report status to user**

#### INITIALIZATION SEQUENCE

```bash
# Step 1: Detect conflicts
echo "🔍 Checking for conflicting processes..."
ps aux | grep -E "Claude|GitHub Desktop|Visual Studio Code" | grep -v grep | grep -v "Claude Code" | head -5

# Step 2: Check port availability
echo "📡 Checking port status..."
lsof -i :3000 -i :5173 -i :8080 -i :4000 2>/dev/null | grep LISTEN

# Step 3: Detect Node processes
echo "🔧 Checking Node processes..."
ps aux | grep -E "node|npm" | grep -v grep | wc -l
```

#### AUTO-CLEANUP PROTOCOL

If conflicts are detected, execute:

```bash
# Clear Node processes (but not Claude Code's)
pkill -f "npm run" 2>/dev/null || true
pkill -f "node server" 2>/dev/null || true

# Free up ports
for port in 3000 5173 8080 4000 3001 5174; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

# Clear any git locks
find . -name "index.lock" -path "*/.git/*" -delete 2>/dev/null || true

echo "✅ Environment cleaned and ready"
```

#### CONTINUOUS MONITORING

During development, periodically check:

```bash
# Port conflicts
netstat -an | grep LISTEN | grep -E '3000|5173|8080'

# File lock status
lsof +D . 2>/dev/null | grep -E "WRITE|LOCK"
```

#### ERROR RECOVERY PROTOCOLS

If encountering errors, automatically attempt:

1. **EADDRINUSE (Port in use)**
   ```bash
   # Find and kill process using the port
   PORT=3000  # or whatever port
   lsof -ti:$PORT | xargs kill -9
   ```

2. **File lock errors**
   ```bash
   # Clear file locks
   rm -f .git/index.lock
   find . -name "*.lock" -not -path "*/node_modules/*" -delete
   ```

3. **Permission errors**
   ```bash
   # Fix permissions
   chmod -R 755 . 2>/dev/null
   npm cache clean --force
   ```

#### PROJECT-SPECIFIC RULES

For Storage Valet Portal development:
- Always use `--host 0.0.0.0` flag with Vite
- Check for `.env` file presence
- Verify Airtable keys are loaded
- Ensure session secret is set

#### STARTUP CHECKLIST

- [ ] All conflicting apps closed
- [ ] Ports 3000, 5173, 8080 free
- [ ] No stale Node processes
- [ ] Git locks cleared
- [ ] npm cache verified
- [ ] Environment variables loaded

---

## How to Use This Agent

1. **Copy the "AGENT: Environment Isolation Protocol" section above**
2. **Start a new Claude Code session**
3. **Paste it as your first message**
4. **Claude will execute the initialization automatically**
5. **Work conflict-free!**

## Quick Commands for Manual Use

### Check Environment
```bash
# See what's running
ps aux | grep -E "node|npm|Claude|GitHub" | grep -v grep
```

### Emergency Cleanup
```bash
# Kill all Node processes
killall node 2>/dev/null
# Free all dev ports
for p in 3000 5173 8080; do lsof -ti:$p | xargs kill -9 2>/dev/null; done
```

### Before Starting Dev Server
```bash
# Ensure port is free
lsof -ti:3000 | xargs kill -9 2>/dev/null
# Start with explicit host
npm run dev -- --host 0.0.0.0
```

## Sub-Agents for Specific Tasks

### Port Manager Agent
Save as `port-manager.sh`:
```bash
#!/bin/bash
echo "🔧 Port Manager Agent Active"

check_port() {
    lsof -i :$1 2>/dev/null | grep LISTEN
}

free_port() {
    lsof -ti:$1 | xargs kill -9 2>/dev/null
    echo "✅ Port $1 freed"
}

# Check common dev ports
for port in 3000 5173 8080 4000; do
    if check_port $port; then
        echo "⚠️  Port $port in use, freeing..."
        free_port $port
    else
        echo "✅ Port $port is free"
    fi
done
```

### Git Guardian Agent
Save as `git-guardian.sh`:
```bash
#!/bin/bash
echo "🔒 Git Guardian Agent Active"

# Clear any git locks
if [ -f .git/index.lock ]; then
    rm -f .git/index.lock
    echo "✅ Removed git index lock"
fi

# Check git status
git status --porcelain 2>/dev/null || echo "⚠️  Not in a git repository"

# Ensure we're on the right branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
echo "📍 Current branch: $CURRENT_BRANCH"
```

---

**Remember**: This agent is defensive only - it helps identify and resolve conflicts, not create them!