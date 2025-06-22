import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken, logout } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', 
  authController.registerValidation,
  authController.register
);

router.post('/login', 
  authController.loginValidation,
  authController.login
);

router.post('/password-reset-request', 
  authController.requestPasswordReset
);

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', authController.getProfile);

router.put('/profile', authController.updateProfile);

router.post('/change-password', 
  authController.passwordChangeValidation,
  authController.changePassword
);

router.post('/logout', logout);

router.get('/validate-token', authController.validateToken);

router.post('/deactivate', authController.deactivateAccount);

export default router;