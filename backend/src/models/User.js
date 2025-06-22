import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pgPool } from '../config/database.js';

export class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.username = userData.username;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.passwordHash = userData.password_hash;
    this.emailVerified = userData.email_verified;
    this.riskProfile = userData.risk_profile;
    this.investmentExperience = userData.investment_experience;
    this.createdAt = userData.created_at;
    this.lastLogin = userData.last_login;
    this.isActive = userData.is_active;
  }

  // Create database table (run once)
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        password_hash VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        risk_profile VARCHAR(50) DEFAULT 'moderate',
        investment_experience VARCHAR(50) DEFAULT 'beginner',
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        settings JSONB DEFAULT '{}',
        preferences JSONB DEFAULT '{}'
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
    `;

    try {
      await pgPool.query(query);
      console.log('✅ Users table created successfully');
    } catch (error) {
      console.error('❌ Error creating users table:', error);
      throw error;
    }
  }

  // Hash password
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }

  // Generate JWT token
  generateToken() {
    const payload = {
      userId: this.id,
      email: this.email,
      username: this.username,
      riskProfile: this.riskProfile,
      investmentExperience: this.investmentExperience
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'market-dashboard',
      audience: 'dashboard-users'
    });
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'market-dashboard',
        audience: 'dashboard-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Create new user
  static async create(userData) {
    const { email, username, password, firstName, lastName, riskProfile, investmentExperience } = userData;

    // Validate input
    if (!email || !username || !password) {
      throw new Error('Email, username, and password are required');
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    const query = `
      INSERT INTO users (email, username, password_hash, first_name, last_name, risk_profile, investment_experience)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    try {
      const result = await pgPool.query(query, [
        email.toLowerCase(),
        username,
        passwordHash,
        firstName || null,
        lastName || null,
        riskProfile || 'moderate',
        investmentExperience || 'beginner'
      ]);

      return new User(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user account');
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = TRUE';
    
    try {
      const result = await pgPool.query(query, [email.toLowerCase()]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1 AND is_active = TRUE';
    
    try {
      const result = await pgPool.query(query, [username]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = TRUE';
    
    try {
      const result = await pgPool.query(query, [id]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  // Authenticate user (login)
  static async authenticate(emailOrUsername, password) {
    // Try to find user by email first, then username
    let user = await User.findByEmail(emailOrUsername);
    if (!user) {
      user = await User.findByUsername(emailOrUsername);
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await user.updateLastLogin();

    return user;
  }

  // Update last login timestamp
  async updateLastLogin() {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
    
    try {
      await pgPool.query(query, [this.id]);
      this.lastLogin = new Date();
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Update user profile
  async updateProfile(updates) {
    const allowedFields = ['first_name', 'last_name', 'risk_profile', 'investment_experience'];
    const setClause = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(this.id);
    const query = `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    try {
      const result = await pgPool.query(query, values);
      const updatedUser = new User(result.rows[0]);
      
      // Update current instance
      Object.assign(this, updatedUser);
      
      return this;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await User.hashPassword(newPassword);

    const query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
    
    try {
      await pgPool.query(query, [newPasswordHash, this.id]);
      this.passwordHash = newPasswordHash;
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error('Failed to change password');
    }
  }

  // Deactivate user account
  async deactivate() {
    const query = 'UPDATE users SET is_active = FALSE WHERE id = $1';
    
    try {
      await pgPool.query(query, [this.id]);
      this.isActive = false;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw new Error('Failed to deactivate account');
    }
  }

  // Get user's safe data (without sensitive info)
  getSafeData() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      emailVerified: this.emailVerified,
      riskProfile: this.riskProfile,
      investmentExperience: this.investmentExperience,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin
    };
  }

  // Validate risk profile
  static validateRiskProfile(riskProfile) {
    const validProfiles = ['conservative', 'moderate', 'aggressive', 'very_aggressive'];
    return validProfiles.includes(riskProfile);
  }

  // Validate investment experience
  static validateInvestmentExperience(experience) {
    const validExperiences = ['beginner', 'intermediate', 'advanced', 'professional'];
    return validExperiences.includes(experience);
  }
}

export default User;