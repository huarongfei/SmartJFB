/**
 * Debug script to check login functionality
 */

const User = require('./backend/models/User');
const bcrypt = require('bcryptjs');

async function debugLogin() {
  console.log('Debugging login functionality...');
  
  // Test finding user by credentials
  console.log('\n1. Testing findByCredentials with "admin"');
  const user = await User.findByCredentials('admin');
  console.log('User found:', user);
  
  if (user) {
    console.log('\n2. Testing password comparison');
    const isValid = await User.comparePassword('password123', user.password_hash);
    console.log('Password valid:', isValid);
    
    console.log('\n3. Testing raw password comparison');
    console.log('Input password:', 'password123');
    console.log('Stored hash:', user.password_hash);
    
    // Also test with bcrypt directly
    const directCompare = await bcrypt.compare('password123', user.password_hash);
    console.log('Direct bcrypt compare result:', directCompare);
  } else {
    console.log('\n2. User not found!');
    
    // Let's check all users in the system
    console.log('\n3. Checking all users in database...');
    const allUsers = require('./backend/config/db');
    const usersData = await allUsers.users.read();
    console.log('All users:', usersData);
  }
}

debugLogin();