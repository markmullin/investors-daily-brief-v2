# Environment Variables Template for Render

Copy these to your Render Dashboard → Service Settings → Environment

## Required API Keys

```
FMP_API_KEY=4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1
FRED_API_KEY=dca5bb7524d0b194a9963b449e69c655
```

## Optional API Keys (Add if you have them)

```
MISTRAL_API_KEY=your_mistral_api_key_here
EOD_HISTORICAL_API_KEY=your_eod_api_key_here
BRAVE_API_KEY=your_brave_api_key_here
```

## System Configuration

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://investorsdailybrief.com
JWT_SECRET=generate_a_secure_random_string_here
```

## Database & Cache (Use existing services)

```
DATABASE_URL=postgresql://[from_existing_postgres_service]
REDIS_URL=redis://[from_existing_redis_service]
```

## Optional Features

```
# Enable/disable features
ENABLE_AI_ANALYSIS=true
ENABLE_PORTFOLIO_UPLOAD=true
ENABLE_REAL_TIME_UPDATES=true

# Cache configuration
CACHE_TTL_QUOTES=60
CACHE_TTL_FUNDAMENTALS=900
CACHE_TTL_NEWS=300

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
```

## Security Settings

```
# CORS (if needed)
CORS_ORIGIN=https://investorsdailybrief.com

# Session
SESSION_SECRET=another_secure_random_string
SESSION_MAX_AGE=86400000
```

## Notes:
- Generate secure random strings for JWT_SECRET and SESSION_SECRET
- Get DATABASE_URL and REDIS_URL from your existing Render services
- API keys should be kept secure and never committed to Git
- Some features may not work without their respective API keys
