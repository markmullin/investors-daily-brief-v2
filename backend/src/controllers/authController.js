import User from '../models/User.js';
import { body, validationResult } from 'express-validator';

// Validation rules
export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be 1-100 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be 1-100 characters'),
  body('riskProfile')
    .optional()
    .isIn(['conservative', 'moderate', 'aggressive', 'very_aggressive'])
    .withMessage('Invalid risk profile'),
  body('investmentExperience')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
    .withMessage('Invalid investment experience level')
];

export const loginValidation = [
  body('emailOrUsername')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const passwordChangeValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, and number')
];

// Controllers
export const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, username, password, firstName, lastName, riskProfile, investmentExperience } = req.body;

    // Create user
    const user = await User.create({
      email,
      username,
      password,
      firstName,
      lastName,
      riskProfile,
      investmentExperience
    });

    // Generate token
    const token = user.generateToken();

    // Log successful registration
    console.log(`✅ New user registered: ${user.email} (${user.username})`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: user.getSafeData(),
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists') || error.message.includes('already taken')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.'
    });
  }
};

export const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { emailOrUsername, password } = req.body;

    // Authenticate user
    const user = await User.authenticate(emailOrUsername, password);

    // Generate token
    const token = user.generateToken();

    // Log successful login
    console.log(`✅ User logged in: ${user.email} (${user.username})`);

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: user.getSafeData(),
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    // User is attached by auth middleware
    const user = req.user;

    res.json({
      success: true,
      user: user.getSafeData()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, riskProfile, investmentExperience } = req.body;
    const user = req.user;

    // Validate optional fields
    if (riskProfile && !User.validateRiskProfile(riskProfile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid risk profile'
      });
    }

    if (investmentExperience && !User.validateInvestmentExperience(investmentExperience)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid investment experience level'
      });
    }

    // Update user
    const updates = {};
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (riskProfile !== undefined) updates.risk_profile = riskProfile;
    if (investmentExperience !== undefined) updates.investment_experience = investmentExperience;

    await user.updateProfile(updates);

    console.log(`✅ Profile updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getSafeData()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Change password
    await user.changePassword(currentPassword, newPassword);

    console.log(`✅ Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

export const deactivateAccount = async (req, res) => {
  try {
    const user = req.user;

    // Deactivate account
    await user.deactivate();

    console.log(`⚠️  Account deactivated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
};

export const validateToken = async (req, res) => {
  try {
    // Token validation happens in middleware
    // If we reach here, token is valid
    const user = req.user;

    res.json({
      success: true,
      message: 'Token is valid',
      user: user.getSafeData()
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Token validation failed'
    });
  }
};

// Password reset (basic implementation - you might want to add email verification)
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const user = await User.findByEmail(email);
    
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent'
    });

    // TODO: Implement actual email sending logic here
    if (user) {
      console.log(`🔐 Password reset requested for: ${user.email}`);
      // Generate reset token and send email
    }

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
  validateToken,
  requestPasswordReset,
  registerValidation,
  loginValidation,
  passwordChangeValidation
};