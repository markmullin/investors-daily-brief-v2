import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Calendar, Briefcase } from 'lucide-react';

const NavigationSystem = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      path: '/research',
      label: 'Research Hub',
      icon: Search,
      description: 'Deep Analysis & Screening'
    },
    {
      path: '/',
      label: 'Daily Market Brief',
      icon: Calendar,
      description: 'Market Command Center'
    },
    {
      path: '/portfolio',
      label: 'Portfolio Management',
      icon: Briefcase,
      description: 'Track & Optimize'
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex w-full">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  relative flex-1 flex flex-col items-center py-3 px-4
                  transition-all duration-200
                  ${active 
                    ? 'text-blue-600 bg-blue-50/50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : ''}`} />
                  <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </div>
                <span className={`text-xs ${active ? 'text-blue-500' : 'text-gray-500'}`}>
                  {item.description}
                </span>
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavigationSystem;