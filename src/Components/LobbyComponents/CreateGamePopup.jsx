import React from 'react';
import './CreateGamePopup.css'; // Optional: create separate CSS file

const CreateGamePopup = ({ coinBalance, wager, check, setWager, isCreating, onCreateGame, onClosePopup }) => {
  const legit = wager === 0 || (wager >= 100 && wager % 100 === 0 && wager <= coinBalance);

  if (!check) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        {/* Header */}
        <div className="popup-header">
          <h2 className="popup-title">Create Game Room</h2>
          <div className="balance-display">
            <span className="balance-label">Your Balance:</span>
            <span className="balance-amount">{coinBalance} coins</span>
          </div>
        </div>

        {/* Wager Selection */}
        <div className="wager-section">
          <h3 className="section-title">Choose Wager Type</h3>
          
          <div className="wager-options">
            <button 
              className={`wager-option ${wager === 0 ? 'active' : ''}`}
              onClick={() => setWager(0)}
            >
              <span className="option-icon">🎮</span>
              <span className="option-text">Free Play</span>
              <span className="option-subtext">No coins required</span>
            </button>

            <button 
              className={`wager-option ${wager > 0 ? 'active' : ''}`}
              onClick={() => wager < 100 && setWager(100)}
            >
              <span className="option-icon">💰</span>
              <span className="option-text">Wager Mode</span>
              <span className="option-subtext">Bet coins to win more</span>
            </button>
          </div>

          {/* Wager Input */}
          {wager > 0 && (
            <div className="wager-input-container">
              <label className="input-label">Wager Amount:</label>
              <div className="input-wrapper">
                <input 
                  type="number" 
                  className="wager-input"
                  value={wager} 
                  min={100}
                  step={100}
                  onChange={(e) => setWager(Number(e.target.value))}
                />
                <span className="input-suffix">coins</span>
              </div>
              <div className="wager-hints">
                <span className="hint">Min: 100 coins</span>
                <span className="hint">Must be multiple of 100</span>
              </div>
              
              {/* Validation Message */}
              {!legit && wager > 0 && (
                <div className="validation-message error">
                  {wager < 100 ? 'Minimum wager is 100 coins' :
                   wager % 100 !== 0 ? 'Wager must be multiple of 100' :
                   wager > coinBalance ? 'Insufficient balance' : 'Invalid wager amount'}
                </div>
              )}
              
              {legit && wager > 0 && (
                <div className="validation-message success">
                  ✅ Valid wager - Potential win: {wager * 2} coins
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="popup-actions">
          <button 
            className="btn-secondary"
            onClick={onClosePopup}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button 
            className={`btn-primary ${!legit ? 'disabled' : ''}`}
            onClick={() => legit && onCreateGame()}
            disabled={isCreating || !legit}
          >
            {isCreating ? (
              <>
                <div className="loading-spinner"></div>
                Creating Game...
              </>
            ) : (
              'Create Game Room'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGamePopup;