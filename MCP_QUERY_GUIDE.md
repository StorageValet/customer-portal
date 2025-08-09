# MCP Query Optimization Guide

## Avoiding Context Window Issues

### Problem
Full table schemas can exceed context limits when returned by MCP.

### Solution: Targeted Queries

## Recommended Query Patterns

### 1. Specific Field Queries
Instead of: "Show all fields from Customers"
Use: "Show Email, First Name, Last Name from first 10 Customers"

### 2. Filtered Searches
Instead of: "Get all Customers"
Use: "Search for customer with email 'user@example.com'"

### 3. Count Operations
Instead of: "List all records"
Use: "Count records in Customers table"

### 4. Schema Summaries
Instead of: "Get full schema"
Use: "List table names only"

## Example Efficient Queries

```
# Get specific customer
Search Customers for email "zach@example.com"

# Update single field
Update record rec123 in Customers set Phone: "555-1234"

# Get recent records
Get 5 most recent Customers sorted by Account Created Date

# Check specific fields
Show Customer ID, Email, Account Status from Customers where Account Status = "Active"
```

## Portal-Specific Queries

### Profile Updates
```
Update record [id] in Customers with {
  "First Name": "John",
  "Last Name": "Doe",
  "Phone": "555-1234"
}
```

### Session Validation
```
Search Customers where Email = "user@email.com" 
Return: Customer ID, Password, Account Status
```

### Container Inventory
```
Get Containers where Customer = "rec123"
Return: QR Code, Item Name/Label, Current Status
```

## Best Practices

1. **Always specify fields**: Don't request all fields unless necessary
2. **Use limits**: Add "limit 10" or similar to queries
3. **Filter early**: Use where clauses to reduce data
4. **Batch carefully**: Multiple small queries > one huge query
5. **Cache results**: Store frequently accessed data locally

## Security Implementation

✅ **PASSWORD FIELD**: Properly encrypted using bcrypt
- Cost factor: 10 rounds (secure)
- Format: `$2b$10$[salt][hash]`
- Never display hashed passwords in queries
- Always use bcrypt.compare() for verification
- Session management handles auth after login