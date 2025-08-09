#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title SV Snapshot
# @raycast.mode compact
# @raycast.packageName Storage Valet

# Optional parameters:
# @raycast.icon 📸
# @raycast.argument1 { "type": "text", "placeholder": "Note (optional)", "optional": true }

# Documentation:
# @raycast.description Create a Storage Valet development snapshot
# @raycast.author Storage Valet Team
# @raycast.authorURL https://mystoragevalet.com

cd ~/Documents/SV-Portal_v6

# Run snapshot
tools/svsnap

# If a note was provided, append it to the snapshot
if [ -n "$1" ]; then
    LATEST_SNAP=$(ls -t .sv/snapshot-*.md | head -1)
    echo "" >> "$LATEST_SNAP"
    echo "## Note" >> "$LATEST_SNAP"
    echo "$1" >> "$LATEST_SNAP"
    echo "Snapshot created with note: $1"
else
    echo "Snapshot created successfully"
fi