require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');

// Get API key from environment variables
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || 'BSAFHHikdsv2YXSYODQSPES2tTMILHI';

// Base URL for Brave Search API
const BRAVE_BASE_URL = 'https://api.search.brave.com/res/v1';

/**
 * Test connection to Brave Search API
 */
async function testBraveApi() {
  console.log(chalk.blue('\n=== Testing Brave Search API ==='));
  
  // Check if API key is provided
  if (!BRAVE_API_KEY) {
    console.log(chalk.red('❌ Error: BRAVE_API_KEY not found in environment variables'));
    console.log(chalk.yellow('ℹ️ Make sure to set BRAVE_API_KEY in your .env file'));
    return false;
  }
  
  console.log(chalk.gray(`ℹ️ Using Brave API key: ${BRAVE_API_KEY.slice(0, 6)}...${BRAVE_API_KEY.slice(-4)}`));
  
  try {
    // Create axios instance for Brave API
    const braveClient = axios.create({
      baseURL: BRAVE_BASE_URL,
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Test search endpoint
    console.log(chalk.blue('\nTesting search endpoint...'));
    const searchResponse = await braveClient.get('/search', {
      params: {
        q: 'stock market',
        count: 5
      }
    });
    
    if (searchResponse.status === 200 && searchResponse.data.results) {
      console.log(chalk.green('✅ Search endpoint test passed!'));
      console.log(chalk.gray(`ℹ️ Found ${searchResponse.data.results.length} search results`));
    } else {
      console.log(chalk.red('❌ Search endpoint test failed!'));
      console.log(chalk.gray('Response structure:'), searchResponse.data);
    }
    
    // Test news endpoint
    console.log(chalk.blue('\nTesting news endpoint...'));
    const newsResponse = await braveClient.get('/news/search', {
      params: {
        q: 'stock market news today',
        count: 10,
        search_lang: 'en',
        freshness: 'pd' // Past day
      }
    });
    
    if (newsResponse.status === 200 && newsResponse.data.results) {
      console.log(chalk.green('✅ News endpoint test passed!'));
      console.log(chalk.gray(`ℹ️ Found ${newsResponse.data.results.length} news articles`));
      
      // Print sample news article
      if (newsResponse.data.results.length > 0) {
        const article = newsResponse.data.results[0];
        console.log(chalk.blue('\nSample news article:'));
        console.log(chalk.yellow('Title:'), article.title);
        console.log(chalk.yellow('Source:'), article.source);
        console.log(chalk.yellow('URL:'), article.url);
        console.log(chalk.yellow('Age:'), article.age);
      }
    } else {
      console.log(chalk.red('❌ News endpoint test failed!'));
      console.log(chalk.gray('Response structure:'), newsResponse.data);
    }
    
    console.log(chalk.green('\n✅ Brave API connection successful!'));
    return true;
  } catch (error) {
    console.log(chalk.red('\n❌ Brave API connection failed!'));
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.log(chalk.red(`Error ${error.response.status}: ${error.response.statusText}`));
      console.log(chalk.gray('Error details:'), error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(chalk.red('No response received from Brave API'));
      console.log(chalk.gray('Error details:'), error.request);
    } else {
      // Something happened in setting up the request
      console.log(chalk.red(`Error: ${error.message}`));
    }
    
    // Check for common issues
    if (error.message.includes('401')) {
      console.log(chalk.yellow('\nℹ️ Possible issue: Invalid API key'));
      console.log(chalk.yellow('Make sure your BRAVE_API_KEY is correct and active'));
    } else if (error.message.includes('429')) {
      console.log(chalk.yellow('\nℹ️ Possible issue: Rate limit exceeded'));
      console.log(chalk.yellow('You have made too many requests to the Brave API. Try again later.'));
    } else if (error.message.includes('timeout')) {
      console.log(chalk.yellow('\nℹ️ Possible issue: Connection timeout'));
      console.log(chalk.yellow('The request to Brave API timed out. Check your internet connection.'));
    }
    
    return false;
  }
}

// Run the test
testBraveApi()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });