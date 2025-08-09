const Airtable = require('airtable');

// Load environment variables
require('dotenv').config();

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log('Testing Airtable connection...');
console.log('API Key exists:', !!apiKey);
console.log('Base ID:', baseId);

if (!apiKey || !baseId) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  process.exit(1);
}

// Initialize Airtable
const base = new Airtable({ apiKey }).base(baseId);

async function listTables() {
  try {
    // Get metadata for the base (this will show us the table structure)
    const metadata = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!metadata.ok) {
      throw new Error(`HTTP ${metadata.status}: ${metadata.statusText}`);
    }
    
    const data = await metadata.json();
    
    console.log('\n=== AIRTABLE BASE TABLES ===');
    console.log(`Base ID: ${baseId}`);
    console.log(`Total tables: ${data.tables?.length || 0}\n`);
    
    if (data.tables) {
      data.tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.name} (${table.id})`);
        console.log(`   Description: ${table.description || 'No description'}`);
        console.log(`   Fields: ${table.fields?.length || 0} fields`);
        
        // Show field names
        if (table.fields && table.fields.length > 0) {
          console.log('   Field names:');
          table.fields.forEach(field => {
            console.log(`     - ${field.name} (${field.type})`);
          });
        }
        console.log('');
      });
      
      // Check specifically for Leads table
      const leadsTable = data.tables.find(table => 
        table.name.toLowerCase() === 'leads' || 
        table.name.toLowerCase().includes('lead')
      );
      
      if (leadsTable) {
        console.log('✅ LEADS TABLE FOUND!');
        console.log(`   Table Name: ${leadsTable.name}`);
        console.log(`   Table ID: ${leadsTable.id}`);
      } else {
        console.log('❌ LEADS TABLE NOT FOUND');
        console.log('Available tables:', data.tables.map(t => t.name).join(', '));
      }
    }
    
  } catch (error) {
    console.error('Error fetching table metadata:', error.message);
    
    // Fallback: Try to access some known tables to see what works
    console.log('\n=== FALLBACK: Testing known table access ===');
    const knownTables = ['Customers', 'Containers', 'Movements', 'Leads'];
    
    for (const tableName of knownTables) {
      try {
        const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
        console.log(`✅ ${tableName}: Accessible (${records.length} records checked)`);
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
  }
}

listTables().catch(console.error);