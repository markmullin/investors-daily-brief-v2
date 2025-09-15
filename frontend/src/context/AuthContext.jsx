import React, { createContext, useState, useContext, useEffect } from 'react';

// Create AuthContext
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('investorsDailyBrief_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Mock login function
  const login = async (email, password) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          const mockUser = {
            id: 'user-' + Date.now(),
            email,
            name: email.split('@')[0],
            tier: 'free', // free, premium
            createdAt: new Date().toISOString(),
          };
          setUser(mockUser);
          localStorage.setItem('investorsDailyBrief_user', JSON.stringify(mockUser));
          setShowLoginModal(false);
          resolve(mockUser);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  };

  // Mock signup function
  const signup = async (email, password, name) => {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          const mockUser = {
            id: 'user-' + Date.now(),
            email,
            name: name || email.split('@')[0],
            tier: 'free',
            createdAt: new Date().toISOString(),
          };
          setUser(mockUser);
          localStorage.setItem('investorsDailyBrief_user', JSON.stringify(mockUser));
          setShowLoginModal(false);
          resolve(mockUser);
        } else {
          reject(new Error('Invalid signup data'));
        }
      }, 1000);
    });
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('investorsDailyBrief_user');
    // Optionally clear other user data
    localStorage.removeItem('portfolioData');
    localStorage.removeItem('userGoals');
  };

  // Check if user has premium tier
  const isPremium = () => {
    return user?.tier === 'premium';
  };

  // Require auth for protected actions
  const requireAuth = (callback) => {
    if (!user) {
      setShowLoginModal(true);
      return false;
    }
    if (callback) {
      callback();
    }
    return true;
  };

  // Mock token refresh (for future JWT implementation)
  const refreshToken = async () => {
    // Placeholder for future JWT refresh logic
    return Promise.resolve();
  };

  const value = {
    user,
    isLoading,
    showLoginModal,
    setShowLoginModal,
    login,
    signup,
    logout,
    isPremium,
    requireAuth,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
