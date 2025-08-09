# Prettier Code Formatting Guide

## Overview

Prettier is configured in this project to automatically format code for consistency across the entire codebase. This document covers setup, usage, and integration with VS Code.

## Setup Complete ✅

### 1. Extension Installed

- **Prettier - Code formatter** (`esbenp.prettier-vscode`) is installed in VS Code

### 2. Package Configuration

- Prettier is added to `package.json` as a dev dependency
- NPM scripts are available for formatting:
  - `npm run format` - Format all files
  - `npm run format:check` - Check if files are formatted correctly

### 3. VS Code Settings

The `.vscode/settings.json` file configures:

- Prettier as the default formatter for all supported file types
- Format on save enabled
- Format on paste enabled
- Integration with ESLint

### 4. Prettier Configuration

- `.prettierrc` - Main configuration file with project-specific rules
- `.prettierignore` - Files and directories to exclude from formatting

## How to Use Prettier

### Automatic Formatting (Recommended)

With the current setup, Prettier will automatically format your files:

- **On Save**: Files are formatted when you save them (Cmd+S / Ctrl+S)
- **On Paste**: Pasted code is automatically formatted

### Manual Formatting

- **Format Current File**: `Shift+Alt+F` (Windows/Linux) or `Shift+Option+F` (Mac)
- **Format Selection**: Select code and use `Cmd+K Cmd+F` (Mac) or `Ctrl+K Ctrl+F` (Windows/Linux)

### Command Line

```bash
# Format all files
npm run format

# Check if files need formatting (useful for CI/CD)
npm run format:check

# Format specific files
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
```

## Supported File Types

Prettier is configured for:

- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- JSON (`.json`, `.jsonc`)
- HTML (`.html`)
- CSS/SCSS (`.css`, `.scss`)
- Markdown (`.md`)

## Configuration Details

### Current Prettier Rules (`.prettierrc`)

- **Semi-colons**: Required
- **Quotes**: Double quotes for strings
- **Print Width**: 100 characters
- **Tab Width**: 2 spaces
- **Trailing Commas**: ES5 compatible
- **Bracket Spacing**: Enabled
- **Arrow Parens**: Always include parentheses

### Files Ignored (`.prettierignore`)

- `node_modules/`
- `dist/` and `build/` directories
- Generated files
- Log files
- Environment files

## Troubleshooting

### If Prettier Isn't Working:

1. **Check Extension**: Ensure "Prettier - Code formatter" extension is installed and enabled
2. **Check Default Formatter**: Go to VS Code Settings > search "default formatter" > ensure it's set to Prettier
3. **Check File Type**: Ensure the file extension is supported by Prettier
4. **Reload VS Code**: Sometimes a restart helps after configuration changes

### If Formatting Conflicts with ESLint:

- The current setup integrates Prettier with ESLint
- ESLint fixes are applied on save alongside Prettier formatting
- If conflicts occur, ESLint rules may need adjustment to work with Prettier

### Format Specific Directories:

```bash
# Format only client code
npx prettier --write "client/src/**/*.{ts,tsx,js,jsx,json,css}"

# Format only server code
npx prettier --write "server/**/*.{ts,js,json}"

# Format only documentation
npx prettier --write "docs/**/*.md"
```

## Integration with Git Hooks (Optional)

To ensure all committed code is formatted, you can add a pre-commit hook:

```bash
# Install husky and lint-staged (optional)
npm install --save-dev husky lint-staged

# Add to package.json
"lint-staged": {
  "*.{ts,tsx,js,jsx,json,css,md}": [
    "prettier --write",
    "git add"
  ]
}
```

## Team Workflow

1. **All developers** should have the Prettier VS Code extension installed
2. **Format on save** ensures consistent formatting without thinking about it
3. **Pre-deployment**: Run `npm run format:check` to verify all files are formatted
4. **Code reviews**: Focus on logic rather than formatting style

## Benefits

- **Consistency**: All code follows the same formatting rules
- **Time Saving**: No debates about code style in reviews
- **Readability**: Consistent formatting improves code readability
- **Git Diffs**: Cleaner diffs without formatting noise
- **Team Productivity**: Developers focus on logic, not formatting

---

**Next Steps**: Your Prettier setup is complete! All files will now be automatically formatted according to the project standards.
