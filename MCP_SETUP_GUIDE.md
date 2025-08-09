# Airtable MCP Server Setup Guide

## Status: ✅ CONFIGURED

The Airtable MCP (Model Context Protocol) server has been successfully configured for this project.

## Configuration Details

### MCP Server Package
- **Package**: `@felores/airtable-mcp-server`
- **Installation**: Via npx (no local installation needed)
- **Location**: Configured in Claude Desktop settings

### Environment Variables
- **API Key**: Already configured using existing `AIRTABLE_API_KEY` from `.env`
- **Base ID**: `appSampziZuFLMveE` (from `.env`)

## How to Use

### Restart Claude Desktop
**IMPORTANT**: You must restart Claude Desktop for the MCP server to be available.

1. Quit Claude Desktop completely (Cmd+Q on Mac)
2. Reopen Claude Desktop
3. The Airtable MCP server will be available in your chat

### Available MCP Commands

Once activated, you can use these commands in Claude:

#### List Bases
```
List all Airtable bases
```

#### Get Base Schema
```
Get schema for base: appSampziZuFLMveE
```

#### List Tables
```
List tables in base: appSampziZuFLMveE
```

#### Get Records
```
Get records from [table_name] in base appSampziZuFLMveE
```

#### Create Record
```
Create record in [table_name] with data: {field: value}
```

#### Update Record
```
Update record [record_id] in [table_name] with data: {field: value}
```

#### Search Records
```
Search for [query] in [table_name]
```

## Project Integration

### Current Tables
- **Customers**: User accounts and profiles
- **Containers**: Storage items and inventory
- **Movements**: Pickup/delivery scheduling

### Use Cases

1. **Profile Updates**: Update customer information directly through chat
2. **Inventory Management**: Query and update container status
3. **Schedule Management**: Create and modify movement records
4. **Data Validation**: Check record consistency across tables

## Troubleshooting

### MCP Server Not Available
1. Verify Claude Desktop is fully restarted
2. Check configuration file: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Ensure API key is valid and has proper permissions

### Permission Errors
Required Airtable scopes:
- `schema.bases:read`
- `data.records:read`
- `data.records:write`
- `schema.bases:write` (optional)

### Connection Issues
1. Test API key directly:
```bash
curl https://api.airtable.com/v0/appSampziZuFLMveE/Customers \
  -H "Authorization: Bearer YOUR_API_KEY"
```

2. Check network connectivity
3. Verify base ID is correct

## Security Notes

- API key is stored in Claude Desktop config (user-level)
- Never commit API keys to version control
- Rotate keys regularly for production use

## Next Steps

1. Test basic read operations on Customers table
2. Implement profile update workflow through MCP
3. Create automated data validation routines
4. Set up change tracking for audit logs