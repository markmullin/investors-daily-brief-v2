# Investors Daily Brief V2 - Financial Dashboard Platform

A comprehensive financial market dashboard with AI-powered insights, real-time data visualization, and portfolio analytics.

## 🚀 Live Demo
[https://investorsdailybrief.com](https://investorsdailybrief.com)

## 🛠 Tech Stack

### Frontend
- React 18.3.1 with Vite
- TailwindCSS for styling
- Recharts, D3.js for data visualization
- React Query for state management

### Backend
- Node.js 20 LTS with Express
- PostgreSQL for data persistence
- Redis for caching
- WebSocket for real-time updates

### AI Integration
- Mistral AI for market summaries
- Custom NLP for earnings analysis
- RAG system for intelligent insights

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Redis (optional for local development)
- PostgreSQL (optional for local development)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/markmullin/investors-daily-brief-v2.git
cd investors-daily-brief-v2
```

2. Install dependencies:
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

3. Set up environment variables:

Create `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=5000
FMP_API_KEY=your_fmp_api_key
FRED_API_KEY=your_fred_api_key
MISTRAL_API_KEY=your_mistral_api_key
EOD_HISTORICAL_API_KEY=your_eod_api_key
BRAVE_API_KEY=your_brave_api_key
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://localhost/idb_dev
```

4. Start the development servers:

```bash
# Option 1: Start both with one command (from root)
npm start

# Option 2: Start separately
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

5. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🚢 Deployment on Render

### Automatic Deployment

This project is configured for automatic deployment on Render using the `render.yaml` blueprint.

1. Connect your GitHub repository to Render
2. Create a new Blueprint instance
3. Select this repository
4. Render will automatically detect the `render.yaml` file
5. Add the required environment variables in Render Dashboard:
   - FMP_API_KEY
   - FRED_API_KEY
   - MISTRAL_API_KEY
   - EOD_HISTORICAL_API_KEY
   - BRAVE_API_KEY

### Manual Deployment

If you prefer manual setup:

1. **Backend Service:**
   - Type: Web Service
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Region: Ohio (or your preference)

2. **Frontend Service:**
   - Type: Static Site
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

3. **Add Custom Domain:**
   - Add `investorsdailybrief.com` to the frontend service
   - Configure DNS records as instructed by Render

## 📊 Features

### Command Center
- AI-powered market news summaries
- Real-time market indices tracking
- Sector performance visualization
- Market phase indicators
- Macroeconomic dashboard

### Research Hub
- Intelligent stock search
- Market themes detection
- Personalized discovery
- Comprehensive stock analysis

### Portfolio Management
- Universal CSV upload (25+ brokers supported)
- Portfolio analytics with risk metrics
- Monte Carlo simulations
- Efficient frontier optimization
- 13F institutional tracking

## 🔧 API Endpoints

### Market Data
- `GET /api/market/overview` - Market summary
- `GET /api/market/sectors` - Sector performance
- `GET /api/market/indices` - Major indices

### Stock Analysis
- `GET /api/stocks/search` - Search stocks
- `GET /api/stocks/:symbol` - Stock details
- `GET /api/stocks/:symbol/analysis` - AI analysis

### Portfolio
- `POST /api/portfolio/upload` - Upload portfolio
- `GET /api/portfolio/analytics` - Portfolio metrics
- `GET /api/portfolio/optimization` - Optimization suggestions

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ by the Investors Daily Brief Team
