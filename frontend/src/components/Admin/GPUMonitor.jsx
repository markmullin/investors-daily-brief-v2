import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './GPUMonitor.css';

const GPUMonitor = ({ className = '' }) => {
  const [gpuStats, setGpuStats] = useState({
    available: false,
    temperature: 0,
    memoryUsed: 0,
    memoryTotal: 24000,
    utilizationPercent: 0
  });
  
  const [modelStatus, setModelStatus] = useState({
    qwen: { status: 'unknown', ready: false },
    gptoss: { status: 'unknown', ready: false }
  });
  
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let eventSource = null;
    let statusInterval = null;

    const connectToGPUMonitor = () => {
      try {
        // Connect to GPU stats stream (if available)
        eventSource = new EventSource('/api/education/gpu-stream');
        
        eventSource.onopen = () => {
          setIsConnected(true);
          console.log('🎮 Connected to GPU monitor stream');
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'gpu_stats') {
              setGpuStats(data.stats);
              setLastUpdate(new Date());
              
              // Add to performance history
              setPerformanceHistory(prev => {
                const newPoint = {
                  timestamp: Date.now(),
                  temperature: data.stats.temperature,
                  memory: (data.stats.memoryUsed / data.stats.memoryTotal) * 100,
                  utilization: data.stats.utilizationPercent
                };
                
                return [...prev.slice(-29), newPoint]; // Keep last 30 points
              });
              
              // Check for alerts
              if (data.stats.temperature > 80) {
                addAlert('warning', `High GPU temperature: ${data.stats.temperature}°C`);
              }
              
              if ((data.stats.memoryUsed / data.stats.memoryTotal) > 0.9) {
                addAlert('error', `GPU memory critical: ${Math.round((data.stats.memoryUsed / data.stats.memoryTotal) * 100)}%`);
              }
            }
            
            if (data.type === 'model_status') {
              setModelStatus(data.models);
            }
            
          } catch (error) {
            console.error('Failed to parse GPU monitor data:', error);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          console.warn('🎮 GPU monitor stream disconnected');
        };

      } catch (error) {
        console.error('Failed to connect to GPU monitor:', error);
      }
    };

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/education/status');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setGpuStats(data.gpu.hardware);
            setModelStatus(data.gpu.models);
            setLastUpdate(new Date());
          }
        }
      } catch (error) {
        console.error('Failed to fetch GPU status:', error);
      }
    };

    // Try to connect to stream, fallback to polling
    connectToGPUMonitor();
    statusInterval = setInterval(fetchStatus, 5000); // Fallback polling every 5s

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, []);

  const addAlert = (type, message) => {
    const alert = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };
    
    setAlerts(prev => [...prev.slice(-4), alert]); // Keep last 5 alerts
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 10000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'text-green-500';
      case 'loading': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'available': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return '✅';
      case 'loading': return '⏳';
      case 'error': return '❌';
      case 'available': return '💤';
      default: return '❓';
    }
  };

  const formatTime = (date) => {
    return date ? date.toLocaleTimeString([], { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }) : 'Never';
  };

  const formatMemory = (mb) => {
    if (mb > 1000) {
      return `${(mb / 1000).toFixed(1)}GB`;
    }
    return `${mb}MB`;
  };

  return (
    <div className={`gpu-monitor ${className}`}>
      <div className="gpu-monitor-header">
        <div className="monitor-title">
          <span className="gpu-icon">🎮</span>
          <h2>GPU AI Monitor</h2>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'} {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        <div className="last-update">
          Last Update: {formatTime(lastUpdate)}
        </div>
      </div>

      <div className="gpu-stats-grid">
        {/* GPU Hardware Status */}
        <div className="stat-card">
          <h3>🔥 Temperature</h3>
          <div className="stat-value">
            <span className={`stat-number ${gpuStats.temperature > 80 ? 'text-red-500' : gpuStats.temperature > 70 ? 'text-yellow-500' : 'text-green-500'}`}>
              {gpuStats.temperature}°C
            </span>
            <div className="stat-bar">
              <div 
                className={`stat-fill ${gpuStats.temperature > 80 ? 'bg-red-500' : gpuStats.temperature > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min((gpuStats.temperature / 90) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="stat-card">
          <h3>💾 Memory</h3>
          <div className="stat-value">
            <span className="stat-number">
              {formatMemory(gpuStats.memoryUsed)} / {formatMemory(gpuStats.memoryTotal)}
            </span>
            <div className="stat-bar">
              <div 
                className={`stat-fill ${(gpuStats.memoryUsed / gpuStats.memoryTotal) > 0.9 ? 'bg-red-500' : (gpuStats.memoryUsed / gpuStats.memoryTotal) > 0.7 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${(gpuStats.memoryUsed / gpuStats.memoryTotal) * 100}%` }}
              ></div>
            </div>
            <div className="stat-percentage">
              {Math.round((gpuStats.memoryUsed / gpuStats.memoryTotal) * 100)}%
            </div>
          </div>
        </div>

        {/* Utilization */}
        <div className="stat-card">
          <h3>⚡ Utilization</h3>
          <div className="stat-value">
            <span className="stat-number">{gpuStats.utilizationPercent}%</span>
            <div className="stat-bar">
              <div 
                className="stat-fill bg-purple-500"
                style={{ width: `${gpuStats.utilizationPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Status */}
      <div className="models-section">
        <h3>🤖 AI Models</h3>
        <div className="models-grid">
          <div className="model-card">
            <div className="model-header">
              <span className="model-icon">{getStatusIcon(modelStatus.qwen?.status)}</span>
              <div>
                <div className="model-name">Qwen 3 8B</div>
                <div className="model-purpose">Fast Education</div>
              </div>
            </div>
            <div className={`model-status ${getStatusColor(modelStatus.qwen?.status)}`}>
              {modelStatus.qwen?.status || 'unknown'}
            </div>
            <div className="model-details">
              Always Loaded • 8-15s response
            </div>
          </div>

          <div className="model-card">
            <div className="model-header">
              <span className="model-icon">{getStatusIcon(modelStatus.gptoss?.status)}</span>
              <div>
                <div className="model-name">GPT-OSS</div>
                <div className="model-purpose">Comprehensive Analysis</div>
              </div>
            </div>
            <div className={`model-status ${getStatusColor(modelStatus.gptoss?.status)}`}>
              {modelStatus.gptoss?.status || 'unknown'}
            </div>
            <div className="model-details">
              On Demand • 10-15s response
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      {performanceHistory.length > 0 && (
        <div className="performance-chart">
          <h3>📊 Performance History</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(ts) => `Time: ${new Date(ts).toLocaleTimeString()}`}
                  formatter={(value, name) => {
                    if (name === 'temperature') return [`${value}°C`, 'Temperature'];
                    if (name === 'memory') return [`${value.toFixed(1)}%`, 'Memory'];
                    if (name === 'utilization') return [`${value}%`, 'Utilization'];
                    return [value, name];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>⚠️ Alerts</h3>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert alert-${alert.type}`}>
                <span className="alert-time">
                  {alert.timestamp.toLocaleTimeString([], { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </span>
                <span className="alert-message">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GPUMonitor;