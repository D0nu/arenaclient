import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import ThemeToggle from "../Components/ThemeToggle";
import { motion } from "framer-motion";

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, loading, logout, refreshUser } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // ✅ Use axios like your AuthContext does
      await axios.delete("/users/delete", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await logout();
      navigate("/signup");
    } catch (err) {
      console.error("❌ Account deletion failed:", err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[80vh] text-lg animate-pulse">
        Loading profile...
      </div>
    );

  if (!user)
    return (
      <div className="flex justify-center items-center min-h-[80vh] text-lg">
        Redirecting to login...
      </div>
    );

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-gradient-to-br from-indigo-900/60 via-purple-900/60 to-indigo-800/60 p-8 rounded-3xl shadow-2xl backdrop-blur-xl w-full max-w-lg text-center border border-white/10"
      >
        {/* Avatar */}
        <div className="mb-4 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-4xl font-bold shadow-md">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-1">{user.name}</h2>
        <p className="text-sm text-gray-300 mb-6">{user.email}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm text-gray-200">
          <div>
            <p className="font-semibold text-xl text-white">{user.gamesPlayed || 0}</p>
            <p>Games</p>
          </div>
          <div>
            <p className="font-semibold text-xl text-green-400">{user.gamesWon || 0}</p>
            <p>Wins</p>
          </div>
          <div>
            <p className="font-semibold text-xl text-yellow-400">{user.coinBalance || 0}</p>
            <p>Coins</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/settings")}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            ⚙️ Settings
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-gradient-to-r from-indigo-700 to-purple-700 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            🎮 Back to Game
          </button>

          <button
            onClick={logout}
            className="w-full bg-red-600 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            🚪 Sign Out
          </button>

          <button
            onClick={handleDeleteAccount}
            className="text-red-400 hover:text-red-500 text-sm underline mt-2"
          >
            Delete Account
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="mt-6">
          <ThemeToggle />
        </div>
      </motion.div>

    
      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              {/* Warning Icon */}
              <div className="text-6xl mb-4">⚠️</div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                Delete Account?
              </h3>
              
              <p className="text-gray-300 mb-6">
                This action cannot be undone. All your data, including game progress, coins, and profile information will be permanently deleted.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <button
                  onClick={confirmDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>

              {isDeleting && (
                <p className="text-gray-400 text-sm mt-4">
                  Please wait while we delete your account...
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}