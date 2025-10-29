import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";

export default function GameStore() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState(0);
  const [solAmount, setSolAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false); // ✅ Track copy status

  // Fetch wallet + balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        if (!user?.wallet?.publicKey) return;
        setWallet(user.wallet.publicKey);
        const { data } = await axios.get(
          `/wallet/balance/${user.wallet.publicKey}`
        );
        setBalance(data.balance);
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    };
    fetchWallet();
  }, [user]);

  // Copy wallet to clipboard
  const handleCopyWallet = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  const handleBuyCoins = async () => {
    if (!solAmount) return alert("Enter amount of SOL to spend!");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/store/buy-coins", {
        userId: user._id,
        solAmount: parseFloat(solAmount),
      });
      alert(`✅ Purchase successful! You now have ${data.newBalance} coins.`);
    } catch (err) {
      alert(err.response?.data?.error || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
        🛒 Game Store
      </h1>

      <div className="bg-gray-800 p-6 rounded-2xl border border-purple-600 max-w-xl w-full">
        <h2 className="text-2xl font-semibold mb-4">Wallet Information</h2>
        
        <p><strong>Public Key:</strong></p>
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-gray-700 p-3 rounded-lg font-mono break-all flex-1">
            {wallet || "No wallet yet"}
          </div>
          <button
            onClick={handleCopyWallet}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            {copied ? "Copied ✅" : "Copy"}
          </button>
        </div>

        <p className="text-lg">
          💰 <strong>Balance:</strong> {balance.toFixed(3)} SOL
        </p>
        <p className="text-lg">
          ⭐ <strong>Game Coins:</strong> {user?.coinBalance || 0}
        </p>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Buy Game Coins</h3>
          <p className="text-sm text-gray-400 mb-3">
            Conversion rate: <strong>0.01 SOL = 1,000 Coins</strong>
          </p>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter SOL amount"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
            className="w-full bg-gray-700 p-3 rounded-lg text-white mb-4 border border-purple-500"
          />
          <button
            disabled={loading}
            onClick={handleBuyCoins}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
          >
            {loading ? "Processing..." : "Buy Coins 💳"}
          </button>
        </div>
      </div>
    </div>
  );
}
