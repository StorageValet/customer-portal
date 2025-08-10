const bcrypt = require('bcrypt');

// Change this to your desired password
const password = 'Test123456';  // CHANGE THIS TO YOUR PASSWORD

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n✅ Password hashed successfully!\n');
  console.log('Original password:', password);
  console.log('\n📋 Copy this hash and paste it into the "Password Hash" field in Airtable:');
  console.log('\n' + hash + '\n');
  console.log('Then you can log in with:');
  console.log('Email: [your email in Airtable]');
  console.log('Password:', password);
});