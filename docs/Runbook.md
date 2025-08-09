# Storage Valet — Developer Runbook

This runbook documents the small operational helpers we use during development, what they do, and how to run them.

## Tools Overview
- **tools/svlog** — Start/stop a live terminal recorder that appends to `.sv/term.log`. Use per session so we can generate summaries/snapshots.
- **tools/svsnap** — Create a point-in-time snapshot (git status, listening ports, node processes, last log lines). Outputs `.sv/snapshot-YYYY-mm-dd_HH-MM-SS.md`.
- **tools/svsum** — Append a concise running status to `.sv/ai-status.md` and update `.sv/ai-status-latest.md`.

## Typical Workflow

### 1. Start logging when you begin work:
```bash
npm run sv:log:start
# or directly: tools/svlog start
```

### 2. Check logging status anytime:
```bash
npm run sv:log:status
# Output: svlog: RUNNING → .sv/term.log
```

### 3. Create a snapshot when things are interesting:
```bash
npm run sv:snap
# Output: Snapshot saved: .sv/snapshot-2024-01-09_14-30-45.md
```

### 4. Update AI status summary:
```bash
npm run sv:sum
# Output: Status updated: [2024-01-09 14:30:45] Branch: main | Changes: 5 | Node procs: 2 | Port 3000: UP
```

### 5. Stop logging when done:
```bash
npm run sv:log:stop
# Output: svlog: stopped
```

## Individual Tool Usage

### svlog - Terminal Logger
Records all terminal output to `.sv/term.log` for the session.

```bash
# Start recording
tools/svlog start

# Check if running
tools/svlog status

# Watch live output
tools/svlog tail

# Stop recording
tools/svlog stop
```

### svsnap - Snapshot Tool
Creates a timestamped markdown file with current system state.

```bash
# Create snapshot
tools/svsnap

# View latest snapshot
ls -la .sv/snapshot-*.md | tail -1

# Read snapshot
cat .sv/snapshot-2024-01-09_14-30-45.md
```

Captures:
- Git status (modified files)
- Listening ports (node services)
- Running node processes
- Last 20 lines of terminal log

### svsum - Status Summary
Updates running status log and creates a latest status report.

```bash
# Update status
tools/svsum

# View latest status
cat .sv/ai-status-latest.md

# View status history
cat .sv/ai-status.md
```

## Best Practices

1. **Start logging at session beginning** - Run `npm run sv:log:start` when you open a new terminal for development work.

2. **Snapshot before major changes** - Before refactoring or deploying, run `npm run sv:snap` to capture the current state.

3. **Regular status updates** - Run `npm run sv:sum` periodically to maintain a history of the development session.

4. **Stop logging when done** - Clean shutdown with `npm run sv:log:stop` to ensure logs are properly saved.

## File Locations

All tools write to the `.sv/` directory (gitignored):

```
.sv/
├── term.log                    # Current terminal session log
├── ai-status.md                # Running status history
├── ai-status-latest.md         # Latest detailed status
└── snapshot-*.md               # Timestamped snapshots
```

## Troubleshooting

### svlog won't start
```bash
# Check if already running
pgrep -f "script -q -f .sv/term.log"

# Force stop if needed
pkill -f "script -q -f .sv/term.log"

# Restart
npm run sv:log:start
```

### No output in snapshots
```bash
# Ensure dev server is running
npm run dev

# Check if logging is active
npm run sv:log:status

# Verify git repo
git status
```

### Permission errors
```bash
# Make tools executable
chmod +x tools/sv*

# Check permissions
ls -la tools/
```

## Integration with AI Tools

These utilities are designed to help AI assistants understand the current development state:

1. **Before asking for help**: Run `npm run sv:snap` to capture current state
2. **Share context**: Copy contents of `.sv/ai-status-latest.md` to provide context
3. **Debug issues**: Share relevant portions of `.sv/term.log` for error analysis

## Quick Reference Card

```bash
# Essential commands
npm run sv:log:start    # Begin session logging
npm run sv:log:status   # Check if logging
npm run sv:snap         # Create snapshot
npm run sv:sum          # Update status
npm run sv:log:stop     # End session logging

# Direct tool access
tools/svlog {start|stop|status|tail}
tools/svsnap
tools/svsum

# View outputs
cat .sv/ai-status-latest.md    # Current status
tail -f .sv/term.log            # Live terminal output
ls -la .sv/snapshot-*.md        # All snapshots
```

## Raycast Script Command (Optional)

For macOS users with Raycast, create a script command for one-click snapshots:

1. Open Raycast → Create Script Command
2. Set:
   - Title: "SV Snapshot"
   - Script: `cd ~/Documents/SV-Portal_v6 && tools/svsnap`
   - Package Name: "Storage Valet"
3. Assign hotkey (e.g., ⌘⇧S)

Now you can create snapshots instantly without switching to terminal.