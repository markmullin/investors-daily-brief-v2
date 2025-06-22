require('dotenv').config();

async function checkMistralPackage() {
  console.log("Checking @mistralai/mistralai package...");
  
  try {
    // Try to require the package
    const mistralModule = require('@mistralai/mistralai');
    console.log("Package loaded successfully");
    console.log("Available exports:", Object.keys(mistralModule));
    
    // See if we can create a client
    if (typeof mistralModule === 'function') {
      console.log("Module is a function, trying to initialize client directly");
      const client = new mistralModule(process.env.MISTRAL_API_KEY);
      console.log("Client created successfully");
    } else if (mistralModule.MistralClient) {
      console.log("Found MistralClient class, trying to initialize");
      const client = new mistralModule.MistralClient(process.env.MISTRAL_API_KEY);
      console.log("Client created successfully");
    } else if (mistralModule.default) {
      console.log("Using default export");
      const client = new mistralModule.default(process.env.MISTRAL_API_KEY);
      console.log("Client created successfully");
    } else {
      console.log("Could not find client constructor in module");
    }
    
    return true;
  } catch (error) {
    console.error("Error with Mistral package:", error.message);
    return false;
  }
}

// Run the check
checkMistralPackage()
  .then(success => {
    if (success) {
      console.log("Mistral package check successful");
    } else {
      console.log("Mistral package check failed");
    }
  })
  .catch(err => console.error("Unexpected error:", err));
