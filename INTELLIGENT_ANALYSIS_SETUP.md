# 📊 Intelligent Analysis Pipeline Setup Guide

## Complete Data Flow Architecture

```
FMP/FRED APIs → Python (8000) → Backend (5000) → GPT-OSS (8080) → Frontend (5173)
                    ↓                ↓                ↓
              Calculations      Coordination     AI Insights
```

## 🚀 Quick Start

### Option 1: One-Click Start (Recommended)
```bash
# From project root directory:
START_DASHBOARD.bat
```

This will automatically start all 4 services and open your browser.

### Option 2: Manual Start (For Development)

#### Terminal 1: Python Analysis Service
```bash
cd backend
pip install -r requirements.txt  # First time only
python analysis_service.py
```
Wait for: "Python Analysis Engine starting on port 8000..."

#### Terminal 2: GPT-OSS AI Server
```bash
cd backend
start-gpt-oss.bat
```
Wait for: Model loaded message

#### Terminal 3: Backend API
```bash
cd backend
npm run dev
```
Wait for: "Intelligent Analysis routes loaded successfully"

#### Terminal 4: Frontend
```bash
cd frontend
npm run dev
```
Browser opens automatically

## 📋 Service Health Check

Run this to verify all services are working:
```bash
cd backend
test-services.bat
```

## 🔧 Configuration

### Required Environment Variables
Add these to `backend/.env`:
```env
FMP_API_KEY=4qzhwAFGwKXQRDNT8pUZyjV1cOmD2fm1
FRED_API_KEY=dca5bb7524d0b194a9963b449e69c655
NODE_ENV=development
```

### Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

## 🎨 Analysis Display Components

### In Your React Components

```jsx
import IntelligentAnalysis from './components/IntelligentAnalysis';

// Market Phase Analysis (Top of Command Center)
<IntelligentAnalysis 
  analysisType="marketPhase"
  title="Market Environment"
/>

// Individual Index Analysis
<IntelligentAnalysis 
  analysisType="marketIndex"
  data={{ symbol: '^GSPC' }}
  title="S&P 500 Analysis"
/>

// Sector Rotation Analysis
<IntelligentAnalysis 
  analysisType="sectors"
  title="Sector Rotation Analysis"
/>

// Market Correlations
<IntelligentAnalysis 
  analysisType="correlations"
  data={{ pair: 'stocks-bonds' }}
  title="Key Relationships"
/>

// Macroeconomic Analysis
<IntelligentAnalysis 
  analysisType="macro"
  title="Economic Environment"
/>
```

## 📊 Analysis Types & Outputs

### Market Phase
- **Input**: Real-time market data
- **Calculations**: Phase score, trend, breadth, volatility
- **Output**: 3-5 sentence market assessment with actionable insights

### Market Indices
- **Input**: Index symbol (^GSPC, ^IXIC, etc.)
- **Calculations**: RSI, volume analysis, 52-week position, P/E
- **Output**: Movement drivers and what to watch

### Sector Rotation
- **Input**: Sector ETF performance
- **Calculations**: Top/bottom performers, rotation signals
- **Output**: Sentiment analysis and positioning advice

### Correlations
- **Input**: Asset pairs (SPY/TLT, QQQ/IWM, etc.)
- **Calculations**: 30-day correlation, divergence from historical
- **Output**: Market dynamics and portfolio implications

### Macroeconomic
- **Input**: Treasury yields, Fed data
- **Calculations**: Yield curve, rate changes
- **Output**: Positioning advice based on rate environment

## 🎯 Key Features

1. **Consistent Analysis**: Every chart gets 3-5 sentences of valuable insight
2. **Beautiful Display**: Gradient backgrounds, subtle animations, clean typography
3. **Smart Fallbacks**: If services fail, provides generic but useful analysis
4. **Real-time Updates**: Analysis refreshes with data updates
5. **Performance Optimized**: Caching prevents unnecessary API calls

## 🐛 Troubleshooting

### "Analysis unavailable" errors
1. Check all services are running: `test-services.bat`
2. Verify Python has all dependencies: `pip install -r requirements.txt`
3. Ensure GPT-OSS model is loaded (check terminal for errors)

### Slow analysis generation
- Normal: GPT-OSS takes 10-20 seconds for first response
- After warmup: 3-5 seconds per analysis
- Consider reducing max_tokens in intelligentAnalysisService.js

### Services won't start
1. Check ports aren't in use:
   - Python: 8000
   - GPT-OSS: 8080
   - Backend: 5000
   - Frontend: 5173
2. Kill any hanging processes in Task Manager
3. Restart with START_DASHBOARD.bat

## 📈 Performance Metrics

- **Python Calculations**: <500ms
- **GPT-OSS Generation**: 3-5 seconds
- **Total Pipeline**: 4-6 seconds per analysis
- **Cache TTL**: 5 minutes for most analyses

## 🎨 Styling Customization

The analysis boxes use a dark theme with blue accents. To customize:

1. Edit `IntelligentAnalysis.jsx` CSS-in-JS styles
2. Key colors:
   - Background: `#1a1a2e` to `#16161f` gradient
   - Border: `rgba(59, 130, 246, 0.1)`
   - Text: `rgba(255, 255, 255, 0.9)`
   - Accent: Blue `#3b82f6`

## 📱 Responsive Design

The analysis component automatically adjusts for:
- Desktop: Full width with all metadata
- Tablet: Slightly condensed, maintains readability
- Mobile: Stacked layout, hidden timestamps

## 🚀 Production Deployment

For production:
1. Set `NODE_ENV=production` in .env
2. Use PM2 for process management
3. Consider GPU server for GPT-OSS
4. Implement Redis caching for analysis results
5. Add rate limiting to prevent abuse

---

With this setup, your dashboard will provide consistent, valuable AI analysis across all sections!