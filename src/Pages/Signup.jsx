import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [vorldLoading, setVorldLoading] = useState(false);
  const navigate = useNavigate();
  
  // ✅ Destructure vorldLoaded and vorldError from useAuth
  const { signup, loginWithVorld, vorldLoaded, vorldError } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVorldSignup = async () => {
    setVorldLoading(true);
    try {
      await loginWithVorld();
      navigate("/");
    } catch (err) {
      alert(err.message || "Vorld signup failed");
    } finally {
      setVorldLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 bg-opacity-50 rounded-3xl p-8 w-full max-w-md border-2 border-purple-500 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Join Brain Brawl</h2>
          <p className="text-gray-300 mt-2">Create your account and start playing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="name"
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              required
            />
          </div>

          <div>
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              required
            />
          </div>

          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all duration-300"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Vorld Auth Button */}
        <div className="mt-4">
          <button
            onClick={handleVorldSignup}
            disabled={vorldLoading || !vorldLoaded}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
          >
            {vorldLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                Connecting to Vorld...
              </div>
            ) : !vorldLoaded ? (
              "Loading Vorld..."
            ) : (
              "🔗 Sign up with Vorld"
            )}
          </button>
        </div>

        {/* Vorld Status Indicator */}
        <div className="mt-2 text-center">
          {!vorldLoaded && !vorldError && (
            <p className="text-yellow-400 text-sm">🔄 Loading Vorld authentication...</p>
          )}
          {vorldError && (
            <p className="text-red-400 text-sm">❌ Vorld: {vorldError}</p>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-6 p-3 bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            🔒 Your data is securely encrypted and protected
          </p>
        </div>
      </div>
    </div>
  );
}