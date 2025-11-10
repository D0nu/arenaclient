// hooks/useSocketListeners.js - ENHANCED DEBUGGING VERSION
import { useEffect, useCallback } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';

export const useSocketListeners = () => {
  const { socket } = useSocket();
  const { user, refreshUser, updateUserBalance } = useAuth();

  const handleBalanceUpdate = useCallback((data) => {
    console.log("💰 REAL-TIME BALANCE UPDATE RECEIVED:", data);

    // Normalize identifiers to strings for safe comparison
    const currentUserId = user ? String(user._id || user.id || '') : '';
    const targetUserIdRaw = data?.userId || data?.user?._id || data?._id || data?.id;
    const targetUserId = targetUserIdRaw ? String(targetUserIdRaw) : '';

    console.log("👤 Current user ID:", currentUserId, "| event targetUserId:", targetUserId);

    // Accept multiple possible balance fields
    const newBalance = (data?.newBalance !== undefined) ? data.newBalance : (data?.balance !== undefined ? data.balance : data?.coinBalance);

    // If the payload explicitly targets a different user, ignore it
    if (targetUserId && currentUserId && targetUserId !== currentUserId) {
      console.log("❌ Balance update is for a different user (ignored)", { targetUserId, payload: data });
      return;
    }

    // If we have a balance value, update immediately. It's safe because
    // this listener runs on the connected socket — when the server emits
    // to this socket it's intended for the connected user even if the
    // payload lacks an explicit userId field.
    if (newBalance !== undefined) {
      console.log("🔄 Applying balance update (no strict id mismatch):", newBalance);
      updateUserBalance(newBalance);
    } else {
      console.log("❌ No explicit balance field in payload, attempting a refreshUser()");
      try {
        // Try to refresh user's full profile as a fallback
        refreshUser().catch(err => console.warn('refreshUser failed as fallback:', err));
      } catch (err) {
        console.warn('refreshUser threw:', err);
      }
    }

    // Build a friendly message (use provided amount/newBalance when available)
    let message = '';
    let messageType = 'info';
    const amount = data?.amount;

    switch (data?.type) {
      case 'wager_win':
        message = `🎊 You won ${amount ?? newBalance ?? ''} coins! Total: ${newBalance ?? ''}`;
        messageType = 'success';
        break;
      case 'draw_refund':
        message = `🤝 Draw! Refunded ${amount ?? ''} coins. Total: ${newBalance ?? ''}`;
        messageType = 'info';
        break;
      case 'wager_loss':
        message = `💸 Lost wager: -${amount ?? ''} coins. Total: ${newBalance ?? ''}`;
        messageType = 'warning';
        break;
      case 'wager_deduction':
        message = `💰 Wager deducted: ${amount ?? ''} coins. Total: ${newBalance ?? ''}`;
        messageType = 'info';
        break;
      default:
        message = `💰 Balance updated: ${newBalance ?? 'updated'}`;
    }

    console.log('💬 Showing message:', message, { messageType });
    if (window.showGameMessage) window.showGameMessage(message, messageType);
  }, [user, updateUserBalance, refreshUser]);

  const handleOpponentQuit = useCallback((data) => {
    console.log("🚨 OPPONENT QUIT EVENT:", data);
    
    // Normalize user IDs for comparison
    const currentUserId = user ? String(user._id || user.id) : '';
    
    // Check if current user is the winner
    const isWinner = data.winners?.some(winner => {
      const winnerId = String(winner.id || winner._id);
      return winnerId === currentUserId;
    });
    
    // Check if current user is the quitter
    const isQuitter = data.quittingPlayer?.id === currentUserId || 
                     data.reason === 'you_quit' || 
                     data.type === 'player_quit';
    
    if (isWinner) {
      // You're the winner (opponent quit)
      console.log("🎊 You won because opponent quit!", {
        wagerAmount: data.wagerAmount,
        winnings: data.winnings
      });
      
      const message = data.messages?.winner || "Opponent forfeited! You win! 🎉";
      const wagerInfo = data.hasWager ? 
        `You won ${data.winnings || data.wagerAmount * 2} coins!` : '';
      
      if (window.showGameMessage) {
        window.showGameMessage(
          wagerInfo ? `${message} ${wagerInfo}` : message, 
          'success'
        );
      }
    } else if (isQuitter) {
      // You're the one who quit
      console.log("� You quit the match", {
        wagerAmount: data.wagerAmount,
        type: data.type
      });
      
      const message = data.messages?.quitter || 
                     "You forfeited the match.";
      const wagerInfo = data.hasWager ? 
        `Lost ${data.wagerAmount} coins.` : '';
      
      if (window.showGameMessage) {
        window.showGameMessage(
          wagerInfo ? `${message} ${wagerInfo}` : message, 
          'warning'
        );
      }
    }
    
    // Handle balance changes through the balance update events
    // (server should emit those separately)
  }, [user]);

  useEffect(() => {
    if (socket && user) {
      console.log("🔌 Setting up REAL-TIME socket listeners for user:", user._id);

      // Balance updates
      socket.on('user-balance-updated', handleBalanceUpdate);
      socket.on('wager-deducted', handleBalanceUpdate);
      socket.on('winnings-distributed', handleBalanceUpdate);
      
      // Game events
      socket.on('opponent-quit', handleOpponentQuit);
      socket.on('player-quit-continue', (data) => {
        console.log("🔄 Player quit, game continues:", data);
        if (window.showGameMessage) {
          window.showGameMessage(data.message || "A player quit. Game continues.", 'info');
        }
      });

      // Debug: Test if socket is connected
      console.log("✅ Socket listeners registered successfully");

      return () => {
        console.log("🔌 Cleaning up socket listeners");
        socket.off('user-balance-updated', handleBalanceUpdate);
        socket.off('wager-deducted', handleBalanceUpdate);
        socket.off('winnings-distributed', handleBalanceUpdate);
        socket.off('opponent-quit', handleOpponentQuit);
        socket.off('player-quit-continue');
      };
    } else {
      console.log("❌ Cannot setup socket listeners - missing socket or user:", {
        hasSocket: !!socket,
        hasUser: !!user
      });
    }
  }, [socket, user, handleBalanceUpdate, handleOpponentQuit]);

  
  useEffect(() => {
    console.log("🔄 useSocketListeners hook rendered", {
      hasSocket: !!socket,
      hasUser: !!user,
      userId: user?._id
    });
  });
};