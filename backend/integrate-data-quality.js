// INTEGRATION SCRIPT - Add data quality routes to your Express server
// Run this to integrate data quality monitoring into your existing backend

import fs from 'fs/promises';
import path from 'path';

async function integrateDataQualityRoutes() {
  console.log('🔧 INTEGRATING DATA QUALITY ROUTES');
  console.log('═══════════════════════════════════════════════════════════════');
  
  try {
    // Find the main server file (app.js or server.js)
    const serverFiles = ['src/app.js', 'src/server.js', 'server.js', 'app.js'];
    let serverFilePath = null;
    
    for (const file of serverFiles) {
      const fullPath = path.join(process.cwd(), file);
      try {
        await fs.access(fullPath);
        serverFilePath = fullPath;
        console.log(`✅ Found server file: ${file}`);
        break;
      } catch (e) {
        // File doesn't exist, continue
      }
    }
    
    if (!serverFilePath) {
      console.log('❌ Could not find main server file. Please manually add the routes.');
      console.log('📋 Add this to your Express app:');
      console.log('');
      console.log("import dataQualityRoutes from './routes/dataQualityRoutes.js';");
      console.log("app.use('/api/data-quality', dataQualityRoutes);");
      return;
    }
    
    // Read the server file
    const serverContent = await fs.readFile(serverFilePath, 'utf-8');
    
    // Check if data quality routes are already integrated
    if (serverContent.includes('dataQualityRoutes') || serverContent.includes('/api/data-quality')) {
      console.log('✅ Data quality routes already integrated!');
      return;
    }
    
    // Add import at the top of the file
    const importLine = "import dataQualityRoutes from './routes/dataQualityRoutes.js';";
    const routeLine = "app.use('/api/data-quality', dataQualityRoutes);";
    
    let updatedContent = serverContent;
    
    // Add import after other imports
    const lastImportMatch = updatedContent.match(/import .* from .*['"];?$/gm);
    if (lastImportMatch) {
      const lastImportLine = lastImportMatch[lastImportMatch.length - 1];
      updatedContent = updatedContent.replace(lastImportLine, lastImportLine + '\n' + importLine);
    } else {
      // Add at the beginning
      updatedContent = importLine + '\n\n' + updatedContent;
    }
    
    // Add route after other routes (look for app.use patterns)
    const routeMatches = updatedContent.match(/app\.use\(['"][^'"]*['"], [^)]+\);/g);
    if (routeMatches && routeMatches.length > 0) {
      const lastRoute = routeMatches[routeMatches.length - 1];
      updatedContent = updatedContent.replace(lastRoute, lastRoute + '\n' + routeLine);
    } else {
      // Look for app.listen and add before it
      const listenMatch = updatedContent.match(/app\.listen\(/);
      if (listenMatch) {
        updatedContent = updatedContent.replace('app.listen(', routeLine + '\n\napp.listen(');
      } else {
        console.log('⚠️ Could not automatically add routes. Please manually add:');
        console.log(routeLine);
        return;
      }
    }
    
    // Write back the updated file
    await fs.writeFile(serverFilePath, updatedContent);
    console.log(`✅ Data quality routes integrated into ${path.basename(serverFilePath)}`);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    console.log('✅ Data directory created for quality reports');
    
    console.log('');
    console.log('🚀 INTEGRATION COMPLETE!');
    console.log('');
    console.log('📊 Available API endpoints:');
    console.log('  GET  /api/data-quality/portfolio          - Portfolio overview');
    console.log('  GET  /api/data-quality/stock/:ticker      - Individual stock quality');
    console.log('  POST /api/data-quality/validate           - Run comprehensive validation');
    console.log('  GET  /api/data-quality/freshness/:ticker  - Check data freshness');
    console.log('  GET  /api/data-quality/dashboard          - Dashboard data for frontend');
    console.log('');
    console.log('💡 Next steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Run: node validate-portfolio-quality.js');
    console.log('  3. Test API: http://localhost:5000/api/data-quality/portfolio');
    
  } catch (error) {
    console.error('❌ Integration failed:', error.message);
    console.log('');
    console.log('📝 Manual integration required:');
    console.log('1. Add this import to your main server file:');
    console.log("   import dataQualityRoutes from './routes/dataQualityRoutes.js';");
    console.log('');
    console.log('2. Add this route:');
    console.log("   app.use('/api/data-quality', dataQualityRoutes);");
  }
}

integrateDataQualityRoutes().catch(console.error);