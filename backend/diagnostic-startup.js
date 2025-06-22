// Diagnostic startup script
import dotenv from 'dotenv';
dotenv.config();

console.log('\n=== STARTING DIAGNOSTIC SERVER ===');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Import and log the marketRoutes file
console.log('\nImporting marketRoutes...');
import('./src/routes/marketRoutes.js').then((module) => {
  console.log('MarketRoutes module loaded');
  console.log('Module keys:', Object.keys(module));
  
  // Import the app
  import('./src/app.js').then((appModule) => {
    console.log('\nApp module loaded');
    const app = appModule.default;
    
    // Start server
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`\nServer started on port ${port}`);
      console.log('Test the version endpoint: http://localhost:5000/api/market/version');
    });
  }).catch(err => {
    console.error('Error loading app:', err);
  });
}).catch(err => {
  console.error('Error loading marketRoutes:', err);
});
