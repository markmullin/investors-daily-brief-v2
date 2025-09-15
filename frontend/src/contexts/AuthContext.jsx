import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the Auth Context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  signup: () => {},
  updateUser: () => {},
  checkAuth: () => {}
});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status
  const checkAuth = () => {
    try {
      const storedAuth = localStorage.getItem('investorsDailyBriefAuth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        // In a real app, we'd validate the token here
        if (authData.user && authData.token) {
          setUser(authData.user);
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock login function
  const login = async (email, password) => {
    try {
      // In production, this would make an API call
      // For now, we'll mock the authentication
      if (email && password) {
        const mockUser = {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email: email,
          name: email.split('@')[0],
          tier: 'free', // 'free' or 'premium'
          createdAt: new Date().toISOString()
        };

        const mockToken = 'mock_jwt_' + Math.random().toString(36).substr(2, 20);

        // Save to localStorage
        localStorage.setItem('investorsDailyBriefAuth', JSON.stringify({
          user: mockUser,
          token: mockToken
        }));

        setUser(mockUser);
        return { success: true, user: mockUser };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Mock signup function
  const signup = async (email, password, name) => {
    try {
      // In production, this would make an API call
      if (email && password && name) {
        const mockUser = {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email: email,
          name: name,
          tier: 'free',
          createdAt: new Date().toISOString()
        };

        const mockToken = 'mock_jwt_' + Math.random().toString(36).substr(2, 20);

        // Save to localStorage
        localStorage.setItem('investorsDailyBriefAuth', JSON.stringify({
          user: mockUser,
          token: mockToken
        }));

        setUser(mockUser);
        return { success: true, user: mockUser };
      } else {
        throw new Error('All fields are required');
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('investorsDailyBriefAuth');
    setUser(null);
  };

  // Update user data
  const updateUser = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update localStorage
      const storedAuth = localStorage.getItem('investorsDailyBriefAuth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        authData.user = updatedUser;
        localStorage.setItem('investorsDailyBriefAuth', JSON.stringify(authData));
      }
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;