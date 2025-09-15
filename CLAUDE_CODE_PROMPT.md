# Claude Code Prompt - Investors Daily Brief v2

## Project Overview
Building "Investors Daily Brief" - the Netflix of Financial Education. A React/Node.js financial dashboard that simplifies investing for young professionals (18-35) by providing AI-powered market analysis, portfolio management, and educational content.

## Project Location
`C:\Users\mulli\Documents\financial-software\investors-daily-brief`

## Technical Stack
### Frontend
- React 18.3.1 with Vite 5.0.8 
- TailwindCSS 3.4.1 for styling
- Recharts 2.15.0 for charts (PRIMARY charting library)
- Three.js r128 for 3D sector visualization
- React Router 7.6.2

### Backend  
- Node.js 20 LTS with Express 4.21.2
- PostgreSQL 16 + Redis 7.2 for data
- WebSocket (ws 8.18.0) for real-time updates

### AI Integration
- GPT-OSS-20B running locally via llama.cpp on RTX 5060 GPU (port 8080)
- Model: gpt-oss-20b-Q4_K_M.gguf
- Expected response time: 15-30 seconds (NOT 5+ minutes)

### APIs
- FMP API Key: 4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1
- FRED API Key: dca5bb7524d0b194a9963b449e69c655

## Current Issues to Fix

### 1. Historical Data Not Loading
- ^GSPC shows "No Historical Data Available"
- Need to map index symbols (^GSPC, ^IXIC, ^DJI, ^RUT) to ETF equivalents for FMP API
- File: backend/src/routes/market.js

### 2. Sector Performance Shows 0%
- All sectors showing 0.00% change
- XLF, XLK, XLE, etc. should show real performance
- File: backend/src/routes/market.js - sectors endpoint

### 3. Key Relationships HTTP 500 Error
- SPY vs TLT and other pairs failing to load
- File: backend/src/routes/relationshipRoutes.js

### 4. AI Market Analysis Not Working
- Should show comprehensive daily brief like old Mistral version
- Needs sections: "Economic and Policy Developments", "Individual Company Analysis"
- Currently showing generic fallback text
- Files: backend/src/routes/gptOSSDailyBrief.js, frontend/src/components/AIInsights.jsx

### 5. Chain of Thought Reasoning
- User wants to see reasoning steps during 15-30 second AI processing
- Not currently displaying progress during analysis
- File: frontend/src/components/IntelligentAnalysis.jsx

## Development Guidelines

### CRITICAL RULES:
1. **NEVER create new files** - Edit existing files only
2. **NO batch scripts** - Direct commands only
3. **NO synthetic data** - All data from FMP/FRED APIs
4. **Windows commands** - User is on Windows
5. **Direct production code** - No test/mock implementations
6. **Root cause fixes** - No workarounds

### Commands to Use:
```bash
# Backend (already running)
cd backend && npm run dev

# Frontend (already running)  
cd frontend && npm run dev

# Test endpoints
curl http://localhost:5000/api/market/history/^GSPC
curl http://localhost:8080/health  # llama.cpp GPU server
```

## File Structure
```
investors-daily-brief/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIInsights.jsx          # Comprehensive market brief
│   │   │   ├── IntelligentAnalysis.jsx # Simple AI boxes
│   │   │   ├── MarketEnvironment.jsx   # Market phase indicator
│   │   │   └── SectorPerformance.jsx   # Sector performance
│   │   ├── pages/
│   │   │   └── MarketAwareness.jsx     # Main dashboard
│   │   └── services/
│   │       └── api.js                  # All API calls
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── market.js               # Market data routes
│   │   │   ├── gptOSSDailyBrief.js    # Comprehensive AI brief
│   │   │   └── gptOSSSimple.js        # Basic GPT-OSS
│   │   ├── services/
│   │   │   └── fmpService.js          # FMP API wrapper
│   │   └── index.js                    # Main server
│   └── package.json
└── .env                                # API keys
```

## Expected Behavior

### Dashboard Should Show:
1. **AI Market Analysis** (top) - Comprehensive daily brief with typewriter effect
2. **Market Environment** (below) - BULL/NEUTRAL/BEAR indicator  
3. **Market Metrics** - Real-time S&P 500, NASDAQ charts
4. **Sector Performance** - 11 sectors with actual % changes
5. **Key Relationships** - SPY vs TLT and other correlations
6. **Macroeconomic Data** - Interest rates, GDP, inflation

### AI Analysis Format:
```
Daily market brief for [Date]
[Overview paragraph]

Economic and Policy Developments
[Fed policy, inflation, economic indicators]

Individual Company Analysis  
[3-4 major companies: NVDA, AAPL, MSFT, etc.]
[Performance, catalysts, outlook]

[Risk assessment]
```

## Common Issues & Solutions

### FMP API Returns No Data
- Check API key validity
- Verify symbol format (use SPY not ^GSPC for FMP)
- Check rate limits (500/min)

### GPT-OSS Timeout
- Ensure llama.cpp is running: `http://localhost:8080/health`
- Model takes 15-30 seconds, not 5+ minutes
- Use shorter prompts (40-80 tokens max)

### Frontend Not Updating
- Components already hot-reload with Vite
- Force refresh: `touch src/components/[ComponentName].jsx`
- Check console for errors

## Testing Checklist
- [ ] S&P 500 chart loads historical data
- [ ] Sectors show real % changes (not 0%)
- [ ] Key Relationships load without errors
- [ ] AI Analysis shows real content (not fallback)
- [ ] Chain of thought displays during processing
- [ ] All data is live from APIs (no hardcoded values)

## Notes
- User prefers seeing real-time reasoning/progress during AI processing
- Dashboard should feel like "Netflix" - beautiful, simple, intuitive
- Everything should work with real market data
- 15-30 second response times are acceptable for AI
- Focus on fixing existing code, not creating new files
