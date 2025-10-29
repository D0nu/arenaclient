import React, { createContext, useContext, useReducer } from 'react';

const GameContext = createContext();

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'UPDATE_SCORE':
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.payload.playerId
            ? { ...player, score: action.payload.score }
            : player
        )
      };
    case 'SET_TIMER':
      return { ...state, timer: action.payload };
    case 'SET_VIEWER_COUNT':
      return { ...state, viewerCount: action.payload };
    case 'ADD_INTERACTION':
      return {
        ...state,
        viewerInteractions: [...state.viewerInteractions, action.payload]
      };
    default:
      return state;
  }
};

const initialState = {
  players: [],
  gameState: 'waiting', // waiting, playing, finished
  timer: 180,
  viewerCount: 0,
  viewerInteractions: [],
  currentMode: null,
  currentTopic: null,
  currentMiniGame: null
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};