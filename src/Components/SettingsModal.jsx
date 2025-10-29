import React, { useState } from "react";
import { motion } from "framer-motion";

export default function SettingsModal({ onClose }) {
  const [volume, setVolume] = useState(70);
  const [difficulty, setDifficulty] = useState("medium");

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-indigo-900/80 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10 backdrop-blur-xl"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Settings ⚙️</h2>

        {/* Volume */}
        <label className="block mb-4">
          <span className="text-sm text-gray-300">Sound Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="w-full mt-1"
          />
          <p className="text-sm text-gray-400 mt-1">{volume}%</p>
        </label>

        {/* Difficulty */}
        <label className="block mb-6">
          <span className="text-sm text-gray-300">Question Difficulty</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full bg-purple-800 text-white p-2 mt-2 rounded-lg"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-semibold"
          >
            Close
          </button>
          <button
            onClick={() => {
              alert("Settings saved!");
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-semibold"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
