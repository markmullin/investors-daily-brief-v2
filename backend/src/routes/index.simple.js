import express from 'express';
import marketRoutes from './marketRoutes.js';

const router = express.Router();

// Mount only the routes we have
console.log('Loading routes...');
router.use('/market', marketRoutes);
console.log('Market routes loaded');

// Debug endpoint to list all routes
router.get('/routes', (req, res) => {
    const routes = [];
    router.stack.forEach(middleware => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json(routes);
});

export default router;
