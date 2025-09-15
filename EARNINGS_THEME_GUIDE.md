# 🎯 Earnings Theme Extraction System - Complete Guide

## Overview
The Earnings Theme Extraction System transforms earnings call transcripts into actionable investment intelligence. It extracts themes like "robotics", "AI", "GLP-1 drugs" from earnings calls, enabling you to discover stocks based on investment themes.

## ✅ What's Been Fixed
1. **Quarter Display Issue** - No more "Q3 2025" duplicates. Quarters now show correctly (Q4 2024, Q3 2024, etc.)
2. **Real Transcript Analysis** - AI now analyzes actual transcript content, not mock data
3. **Theme Extraction** - Automatically identifies investment themes from earnings calls
4. **Stock Discovery** - Find stocks discussing similar themes (e.g., all companies mentioning "robotics")
5. **Sentiment Tracking** - Track management sentiment over time

## 🚀 Quick Start

### Step 1: Setup Database Tables
```bash
cd backend
node setup-earnings-themes.js
```

### Step 2: Restart Backend
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Test the System
1. Open dashboard: http://localhost:5173
2. Navigate to any stock (e.g., AAPL, MSFT, GOOGL)
3. Click on "Earnings" tab
4. You'll see:
   - Correctly formatted quarters (Q4 2024, Q3 2024, etc.)
   - Investment themes extracted from calls
   - "Analyze with AI" buttons for unanalyzed transcripts
   - Discovery tags for finding similar stocks

## 📊 Features in Detail

### 1. Theme Extraction
The system analyzes earnings transcripts to extract:
- **Investment Themes**: Key topics discussed (AI, robotics, supply chain, etc.)
- **Sentiment**: Whether management is positive/negative about each theme
- **Importance**: How much emphasis was placed on each theme
- **Context**: Actual quotes from the transcript
- **Discovery Tags**: Keywords for finding similar companies

### 2. Theme Categories
Themes are automatically categorized:
- **Technology**: AI, robotics, cloud computing, cybersecurity
- **Healthcare**: GLP-1 drugs, gene therapy, telehealth
- **Sustainability**: EVs, renewable energy, carbon capture
- **Consumer**: E-commerce, streaming, gaming
- **Financial**: Fintech, crypto, digital payments
- **Industrial**: Supply chain, automation, 3D printing

### 3. Discovery Engine
Click on any theme to:
- Find all stocks discussing that theme
- See which companies are most focused on it
- Track sentiment across companies
- Identify emerging trends

### 4. Sentiment Analysis
For each transcript:
- Management tone (confident/cautious/concerned)
- Sentiment score (0-100)
- Key quotes highlighting sentiment
- Quarter-over-quarter trends

## 🔧 API Endpoints

### Earnings Analysis
```javascript
// Get full earnings analysis with themes
GET /api/themes/earnings/:symbol/analyze

// Analyze specific transcript on-demand
POST /api/themes/earnings/:symbol/analyze-transcript
Body: { quarter: "Q3 2024", date: "2024-09-15" }
```

### Theme Discovery
```javascript
// Discover stocks by theme
GET /api/themes/discover/:theme
Query params: ?category=technology&sentiment=positive&limit=20

// Get trending themes across all stocks
GET /api/themes/trending
Query params: ?days=90&limit=20

// Get themes for specific company
GET /api/themes/company/:symbol
```

## 💡 Use Cases

### For Individual Investors
1. **Thematic Investing**: Find all companies working on robotics, AI, or any theme
2. **Sentiment Tracking**: See how management confidence changes over time
3. **Early Trend Detection**: Spot emerging themes before they become mainstream
4. **Portfolio Alignment**: Ensure your holdings match your investment themes

### For Professional Traders
1. **Sector Rotation**: Track theme momentum across sectors
2. **Earnings Plays**: Identify sentiment shifts before the market
3. **Pair Trading**: Find companies with opposing views on themes
4. **Risk Management**: Monitor negative sentiment on key themes

## 🎨 Frontend Components

### EarningsTab Component
Located at: `frontend/src/components/stock/EarningsTab.jsx`

Features:
- Displays transcripts with correct quarters
- Shows extracted themes with discovery potential
- Sentiment visualization
- Interactive theme cards
- On-demand analysis buttons

### Theme Discovery (Coming Soon)
A dedicated discovery page where users can:
- Search themes across all stocks
- Filter by category, sentiment, importance
- Build theme-based portfolios
- Track theme trends over time

## 🐛 Troubleshooting

### Issue: Quarters still showing incorrectly
**Solution**: Clear Redis cache
```bash
cd backend
node -e "const Redis = require('ioredis'); const r = new Redis(); r.keys('earnings_*').then(k => k.length && r.del(...k)).then(() => process.exit())"
```

### Issue: No themes appearing
**Solution**: Check if GPT-OSS/AI service is running
```bash
# Check if AI service is accessible
curl http://localhost:11434/api/generate -d '{"model":"qwen:latest","prompt":"test"}'
```

### Issue: Database tables not created
**Solution**: Run migration manually
```bash
cd backend
psql -U postgres -d market_dashboard < migrations/create_theme_tables.sql
```

## 📈 Performance Optimization

### Caching Strategy
- Transcripts: 1 hour cache
- Themes: 24 hour cache
- Discovery results: 15 minute cache

### Batch Processing
For S&P 500 theme extraction:
```javascript
// Run weekly batch job (Sunday nights)
node backend/scripts/batch-extract-themes.js
```

## 🔮 Future Enhancements

### Phase 2 (Next Week)
- [ ] Theme trend charts over time
- [ ] Cross-company theme comparison
- [ ] AI-powered theme predictions
- [ ] Custom theme alerts

### Phase 3 (Next Month)
- [ ] Theme-based portfolio builder
- [ ] Backtesting theme strategies
- [ ] Theme correlation analysis
- [ ] Social sentiment integration

## 📚 Technical Architecture

```
User Request → Frontend (React) → Backend (Express)
                                      ↓
                            Theme Extraction Service
                                      ↓
                        ┌──────────────────────────┐
                        │                          │
                  FMP API ← → AI Analysis (GPT-OSS)
                        │                          │
                        └──────────────────────────┘
                                      ↓
                            PostgreSQL + Redis
                                      ↓
                            Response to Frontend
```

## 🤝 Contributing

To add new theme categories:
1. Edit `earningsThemeExtractionService.js`
2. Add to `themeCategories` object
3. Update discovery tags logic
4. Test with sample transcripts

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend logs for errors
3. Ensure all services are running (PostgreSQL, Redis, Node)
4. Verify API keys are set in `.env`

---

**Remember**: The key innovation here is turning unstructured earnings calls into structured, searchable investment themes. This enables discovery like "show me all companies investing in robotics" - a game-changer for thematic investing!
