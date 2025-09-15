import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Crown, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserProfile from '../UserProfile';

const UserProfileMenu = () => {
  const { user, logout, isPremium, setShowLoginModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => setShowLoginModal(true)}
        className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
      >
        <User className="w-4 h-4 mr-2" />
        <span className="text-sm font-medium">Sign In</span>
      </button>
    );
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          isPremium() 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
            : 'bg-gray-700 text-gray-300'
        }`}>
          {user.name ? getInitials(user.name) : <User className="w-4 h-4" />}
        </div>
        {isPremium() && (
          <Crown className="w-4 h-4 text-yellow-500" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-xl border border-gray-800 overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-gray-800">
            <p className="text-sm font-semibold text-white">{user.name || 'User'}</p>
            <p className="text-xs text-gray-400 mt-1">{user.email}</p>
            {isPremium() && (
              <div className="mt-2 inline-flex items-center px-2 py-1 bg-yellow-500/20 rounded text-xs text-yellow-500">
                <Crown className="w-3 h-3 mr-1" />
                Premium Member
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowProfile(true);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center"
            >
              <DollarSign className="w-4 h-4 mr-3 text-gray-500" />
              Financial Profile
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to settings
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-500" />
              Settings
            </button>

            {!isPremium() && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to upgrade page
                }}
                className="w-full px-4 py-2 text-left text-sm text-yellow-500 hover:bg-yellow-500/10 transition-colors flex items-center"
              >
                <Crown className="w-4 h-4 mr-3" />
                Upgrade to Premium
              </button>
            )}

            <div className="border-t border-gray-800 mt-2 pt-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-3 text-gray-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
      />
    </div>
  );
};

export default UserProfileMenu;
