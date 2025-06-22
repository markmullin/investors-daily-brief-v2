/**
 * Connectivity Routes
 * Endpoints for testing connectivity and API functionality
 */
import express from 'express';
import connectivityTest from '../utils/connectivityTest.js';

const router = express.Router();

// Register connectivity test routes
router.use('/', connectivityTest);

export default router;