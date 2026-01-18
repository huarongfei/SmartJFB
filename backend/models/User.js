/**
 * User Model
 */

const { users } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  // Create a new user
  static async create(userData) {
    const { username, email, password, role } = userData;
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create a new user object with a unique ID
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password_hash: passwordHash,
      role: role || 'operator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store the user
    await users.insert(newUser);
    
    // Return user data without password hash
    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at
    };
  }

  // Find user by ID
  static async findById(id) {
    const user = await users.findById(id);
    
    if (!user) {
      return null;
    }
    
    // Return user data without password hash
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    };
  }

  // Find user by username or email
  static async findByCredentials(usernameOrEmail) {
    const allUsers = await users.read();
    
    // Look for user by either username or email
    const user = allUsers.find(u => 
      u.username === usernameOrEmail || u.email === usernameOrEmail
    );
    
    if (!user) {
      return null;
    }
    
    // Return user data with password hash for comparison
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      created_at: user.created_at
    };
  }

  // Find all users
  static async findAll() {
    const allUsers = await users.read();
    
    // Return users data without password hashes
    return allUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }));
  }

  // Update user
  static async update(id, updateData) {
    const { email, role, password } = updateData;
    
    // Prepare update data
    const updateFields = {};
    
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;
    
    // If password is being updated, hash it
    if (password) {
      updateFields.password_hash = await bcrypt.hash(password, 10);
    }
    
    if (Object.keys(updateFields).length === 0) {
      return await this.findById(id);
    }
    
    updateFields.updated_at = new Date().toISOString();
    
    const updatedUser = await users.updateById(id, updateFields);
    
    if (!updatedUser) {
      return null;
    }
    
    // Return updated user data without password hash
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      created_at: updatedUser.created_at
    };
  }

  // Delete user
  static async delete(id) {
    const deletedUser = await users.deleteById(id);
    
    if (!deletedUser) {
      return null;
    }
    
    // Return deleted user data without password hash
    return {
      id: deletedUser.id,
      username: deletedUser.username,
      email: deletedUser.email,
      role: deletedUser.role,
      created_at: deletedUser.created_at
    };
  }

  // Compare password
  static async comparePassword(inputPassword, storedHash) {
    return await bcrypt.compare(inputPassword, storedHash);
  }
}

module.exports = User;