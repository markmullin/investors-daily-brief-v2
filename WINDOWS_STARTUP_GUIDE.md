# 🚀 Market Risk Positioning System - Windows Startup Guide

## **STEP 1: SETUP & INSTALLATION**

### **Backend Setup**
```cmd
# Navigate to backend directory
cd c:\users\win10user\documents\financial-software\investors-daily-brief\backend

# Install new dependencies
npm install

# Install Python dependencies
npm run python:install

# Setup databases and run migrations
npm run setup
```

### **Frontend Setup**
```cmd
# Navigate to frontend directory  
cd c:\users\win10user\documents\financial-software\investors-daily-brief\frontend

# Install new dependencies (includes framer-motion for animations)
npm install
```

---

## **STEP 2: START THE SYSTEM**

### **Option A: Start Full Development Environment (Recommended)**
```cmd
# Navigate to backend directory
cd c:\users\win10user\documents\financial-software\investors-daily-brief\backend

# Start both backend (port 5000) and Python service (port 8000)
npm run dev
```

### **Option B: Start Services Separately**
```cmd
# Terminal 1 - Backend Server
cd c:\users\win10user\documents\financial-software\investors-daily-brief\backend
npm run dev:backend

# Terminal 2 - Python Service  
cd c:\users\win10user\documents\financial-software\investors-daily-brief\backend
npm run dev:python

# Terminal 3 - Frontend
cd c:\users\win10user\documents\financial-software\investors-daily-brief\frontend
npm run dev
```

---

## **STEP 3: TEST THE SYSTEM**

### **Backend API Tests**
```cmd
# Test the complete Risk Positioning System
cd c:\users\win10user\documents\financial-software\investors-daily-brief\backend
npm run test:risk-positioning

# Test authentication and infrastructure
npm run test:integration

# Check system health
npm run health
```

### **Manual API Testing**
```cmd
# Test risk score API
curl http://localhost:5000/api/risk-positioning/current

# Test with specific mode
curl "http://localhost:5000/api/risk-positioning/current?mode=advanced"

# Test score simulation
curl http://localhost:5000/api/risk-positioning/simulate/75

# Test component breakdown
curl http://localhost:5000/api/risk-positioning/components
```

---

## **STEP 4: ACCESS THE DASHBOARD**

### **Frontend Dashboard**
- **URL**: http://localhost:5173
- **Look for**: **"🎯 Market Risk Positioning"** section at the top
- **Features to test**:
  - Drag the interactive gauge to explore risk levels
  - Switch between Beginner/Advanced modes
  - View historical trends and component breakdowns
  - Try educational tooltips and help content

### **Backend API Documentation**
- **URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **API Endpoints**: http://localhost:5000/api

---

## **STEP 5: INTERACTIVE TESTING**

### **🎛️ Test the Interactive Gauge**
1. **Drag Interaction**: Click and drag the gauge pointer to explore different risk levels
2. **Mode Switching**: Click "Advanced Mode" / "Beginner Mode" to toggle analysis depth
3. **Educational Content**: Click the info icon (ℹ️) for explanations
4. **Real-time Updates**: Wait 5 minutes to see automatic score updates

### **📊 Test Analytics Features**
1. **Historical Trends**: View past risk score changes in the chart
2. **Component Breakdown**: Click "Details" to see the 4 risk components
3. **Quick Actions**: Try the action buttons for alerts and education
4. **Responsive Design**: Test on different screen sizes

### **🔐 Test Authentication (Optional)**
```cmd
# Create a test user account
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"username\":\"testuser\",\"password\":\"TestPassword123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}"

# Login with the account
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"emailOrUsername\":\"test@example.com\",\"password\":\"TestPassword123!\"}"
```

---

## **STEP 6: TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **Backend Won't Start**
```cmd
# Check if ports are in use
netstat -an | findstr :5000
netstat -an | findstr :8000

# Kill processes using the ports
taskkill /f /im node.exe
taskkill /f /im python.exe

# Restart the system
npm run dev
```

#### **Database Connection Issues**
```cmd
# Reset databases
npm run db:setup

# Clear cache
npm run cache:clear

# Check PostgreSQL is running
pg_isready -h localhost -p 5432
```

#### **Python Service Issues**
```cmd
# Reinstall Python dependencies
cd python
pip install -r requirements.txt

# Check Python version (requires 3.8+)
python --version

# Start Python service manually
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### **Frontend Build Issues**
```cmd
# Clear node modules and reinstall
cd frontend
rmdir /s node_modules
del package-lock.json
npm install

# Start development server
npm run dev
```

### **Performance Issues**
```cmd
# Check memory usage
curl http://localhost:5000/health

# Monitor logs
npm run logs

# Clear all caches
npm run cache:clear
```

---

## **🎯 SUCCESS INDICATORS**

### **✅ Backend is Working**
- Health check returns status "healthy"
- Risk positioning API returns score 0-100
- All tests pass in `npm run test:risk-positioning`
- Python service responds at http://localhost:8000

### **✅ Frontend is Working**  
- Dashboard loads at http://localhost:5173
- Market Risk Positioning section displays at the top
- Interactive gauge shows current score with animations
- Mode switching works between Beginner/Advanced

### **✅ Full System Integration**
- Gauge updates every 5 minutes automatically
- Drag interactions work smoothly
- Historical charts display data
- Educational content loads properly

---

## **🎉 READY FOR PRODUCTION!**

When everything is working correctly, you should see:

1. **🎯 Interactive Risk Gauge** - Smooth 0-100 scoring with drag exploration
2. **🔄 Dual-Mode Analysis** - Seamless switching between beginner/advanced views  
3. **📊 Real-time Updates** - Automatic score refreshes every 5 minutes
4. **📈 Historical Analytics** - Trend charts and component breakdowns
5. **🎓 Educational Content** - Help system and learning tooltips
6. **📱 Responsive Design** - Works perfectly on all devices

**Congratulations! Your Market Risk Positioning System is now LIVE!** 🚀

---

## **🚀 NEXT PHASE: CORE FEATURES**

With the Risk Positioning System complete, you're ready for the next major features:

- **🤖 Mistral AI Integration** - AI financial advisor "Warren"
- **📊 Individual Stock Analysis** - DCF models and peer comparison  
- **💼 Portfolio Analytics Core** - Advanced portfolio tracking
- **📈 Enhanced Market Features** - Advanced charting and analysis

**The foundation is rock-solid - time to build amazing features!** 💪