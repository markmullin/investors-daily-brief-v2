# Market Dashboard

A real-time financial market dashboard with React frontend and Express backend.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm

### Installation

1. Install dependencies:
```cmd
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Running the Application

**Option 1: Start both services with one command**
```cmd
node start.js
```

**Option 2: Start services separately**

Terminal 1 - Backend:
```cmd
cd backend
npm start
```

Terminal 2 - Frontend:
```cmd
cd frontend
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Project Structure
```
├── backend/          # Express.js API server
│   ├── src/         # Source files
│   └── package.json
├── frontend/         # React + Vite application  
│   ├── src/         # Source files
│   └── package.json
└── start.js         # Startup script
```

## API Keys
Configured in backend environment:
- EOD API: Market data
- Brave API: News and search
- Mistral API: AI insights
