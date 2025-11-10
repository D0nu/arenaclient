import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useSocketListeners } from "../hooks/useSocketListeners.js"; 

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useSocketListeners();

  const currentBalance = user?.coinBalance || 0;

  // small visual flash when balance updates
  const [balanceFlash, setBalanceFlash] = useState(false);
  const prevBalanceRef = useRef(currentBalance);

  useEffect(() => {
    const prev = prevBalanceRef.current;
    const curr = user?.coinBalance ?? 0;
    if (prev !== undefined && prev !== null && curr !== prev) {
      // trigger flash
      setBalanceFlash(true);
      const t = setTimeout(() => setBalanceFlash(false), 900);
      return () => clearTimeout(t);
    }
    prevBalanceRef.current = curr;
  }, [user?.coinBalance]);

      useEffect(() => {
    console.log("🔄 Navbar user updated:", { 
          name: user?.name, 
          coinBalance: user?.coinBalance,
          hasUser: !!user 
        });
      }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <nav className="flex justify-between items-center bg-gradient-to-r from-purple-900 to-indigo-900 p-4 rounded-xl shadow-lg border border-purple-500">
        <Link to="/" className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
          Brain Brawl 🧠
        </Link>
        <div className="flex items-center">
          <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex justify-between items-center bg-gradient-to-r from-purple-900 to-indigo-900 p-4 rounded-xl shadow-lg border border-purple-500">
      {/* Logo/Brand */}
      <Link 
        to="/" 
        className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent hover:scale-105 transition-transform"
      >
        Brain Brawl 🧠
      </Link>

      {/* Navigation Items */}
      <div className="flex items-center space-x-6">
        {!user ? (
          // Show when NOT logged in
          <div className="flex items-center space-x-4">
            <Link 
              to="/login" 
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-2 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Sign Up
            </Link>
          </div>
        ) : (
          // Show when logged in - User dropdown
          <div className="relative" ref={dropdownRef}>
            {/* User Avatar/Profile Button */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition-all duration-200 border border-purple-500 hover:border-purple-300"
            >
              {/* Profile Photo/Initials */}
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              
              {/* User Name */}
              <div className="text-left">
                <p className="text-white font-semibold text-sm">
                  {user.name || 'User'}
                </p>
                <p className="text-xs font-semibold">
                  <span className={`inline-block text-yellow-400 transition-all duration-300 ${balanceFlash ? 'bg-green-400/30 ring-1 ring-green-300 rounded px-2' : ''}`} aria-live="polite">
                    {currentBalance.toLocaleString()} coins
                  </span>
                </p>
              </div>
              
              {/* Dropdown Arrow */}
              <svg 
                className={`w-4 h-4 text-purple-300 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-purple-500 rounded-xl shadow-2xl backdrop-blur-sm z-50 overflow-hidden">
                {/* User Info Section */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{user.name || 'User'}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                      <p className="text-yellow-400 text-sm font-semibold">
                        ⭐ <span className={`inline-block transition-all duration-300 ${balanceFlash ? 'bg-green-400/30 ring-1 ring-green-300 rounded px-1' : ''}`}>{currentBalance.toLocaleString()} coins</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dropdown Items */}
                <div className="py-2">
                  <button
                    onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                    className="w-full text-left px-4 py-3 text-gray-300 hover:bg-purple-600 hover:text-white transition-all flex items-center space-x-3"
                  >
                    <span className="text-lg">👤</span>
                    <span>User Profile</span>
                  </button>

                  <button
                    onClick={() => { setDropdownOpen(false); navigate("/character-creator"); }}
                    className="w-full text-left px-4 py-3 text-gray-300 hover:bg-purple-600 hover:text-white transition-all flex items-center space-x-3"
                  >
                    <span className="text-lg">🎨</span>
                    <span>Create Character</span>
                  </button>

                  {/* Game Store Button */}
                  <button
                    onClick={() => { setDropdownOpen(false); navigate("/store"); }}
                    className="w-full text-left px-4 py-3 text-gray-300 hover:bg-purple-600 hover:text-white transition-all flex items-center space-x-3"
                  >
                    <span className="text-lg">🛒</span>
                    <span>Game Store</span>
                  </button>

                  <button
                    onClick={() => { setDropdownOpen(false); navigate("/settings"); }}
                    className="w-full text-left px-4 py-3 text-gray-300 hover:bg-purple-600 hover:text-white transition-all flex items-center space-x-3"
                  >
                    <span className="text-lg">⚙️</span>
                    <span>Settings</span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-gray-700 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center space-x-3"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}