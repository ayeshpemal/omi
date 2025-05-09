import React, { createContext, useContext, useEffect, useReducer, useState } from "react";
import { Card, GameAction, GameState, PlayerId } from "../types/game";
import { gameReducer, initializeGameState } from "../utils/gameLogic";
import { AI_CARD_PLAY_DELAY, AI_THINKING_DELAY, TRICK_RESULT_DELAY } from "../utils/constants";
import { chooseCardsToExchange, selectCardToPlay, shouldDeclareFullQuote, shouldDeclareHalfQuote, chooseTrumpSuit } from "../utils/aiLogic";
import { useAudio } from "../lib/stores/useAudio";

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  isPlayerTurn: boolean;
  selectedCards: Card[];
  selectCard: (card: Card) => void;
  deselectCard: (card: Card) => void;
  declareHalfQuote: () => void;
  passHalfQuote: () => void;
  declareTrump: (suit: "hearts" | "diamonds" | "clubs" | "spades") => void;
  declareFullQuote: () => void;
  passFullQuote: () => void;
  exchangeCards: () => void;
  playCard: (card: Card) => void;
  startNewRound: () => void;
  startGame: () => void;
  isAiThinking: boolean;
  updateSettings: (settings: { botCanInitiateHalfQuote?: boolean; botCanInitiateFullQuote?: boolean }) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, null, initializeGameState);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const { playHit, playSuccess } = useAudio();
  
  // Helper to check if it's the player's turn
  const isPlayerTurn = state.playerOrder[state.currentPlayerIndex] === "player";
  
  // Helper functions to select/deselect cards
  const selectCard = (card: Card) => {
    // In card exchange, limit to 2 cards
    if (state.currentPhase === "card_exchange" && selectedCards.length >= 2) {
      return;
    }
    
    if (!selectedCards.find(c => c.id === card.id)) {
      setSelectedCards([...selectedCards, card]);
    }
  };
  
  const deselectCard = (card: Card) => {
    setSelectedCards(selectedCards.filter(c => c.id !== card.id));
  };
  
  // Game action helpers
  const declareHalfQuote = () => {
    playHit();
    dispatch({ type: "DECLARE_HALF_QUOTE", playerId: "player" });
  };
  
  const passHalfQuote = () => {
    playHit();
    dispatch({ type: "PASS_HALF_QUOTE", playerId: "player" });
  };
  
  const declareTrump = (suit: "hearts" | "diamonds" | "clubs" | "spades") => {
    playHit();
    dispatch({ type: "DECLARE_TRUMP", playerId: "player", suit });
  };
  
  const declareFullQuote = () => {
    playHit();
    dispatch({ type: "DECLARE_FULL_QUOTE", playerId: "player" });
  };
  
  const passFullQuote = () => {
    playHit();
    dispatch({ type: "PASS_FULL_QUOTE", playerId: "player" });
  };
  
  const exchangeCards = () => {
    if (selectedCards.length !== 2) return;
    
    playHit();
    
    // Find teammate
    const playerTeam = state.players.player.team;
    const teammate = Object.values(state.players).find(
      p => p.id !== "player" && p.team === playerTeam
    );
    
    if (!teammate) {
      throw new Error("Teammate not found");
    }
    
    dispatch({ 
      type: "EXCHANGE_CARDS", 
      fromPlayer: "player", 
      toPlayer: teammate.id, 
      cards: selectedCards 
    });
    
    setSelectedCards([]);
  };
  
  const playCard = (card: Card) => {
    playHit();
    dispatch({ type: "PLAY_CARD", playerId: "player", card });
  };
  
  const startNewRound = () => {
    playHit();
    dispatch({ type: "START_NEW_ROUND" });
  };
  
  const startGame = () => {
    playHit();
    dispatch({ type: "UPDATE_SETTINGS", settings: { gameStarted: true } });
    dispatch({ type: "DEAL_INITIAL_CARDS" });
  };
  
  const updateSettings = (settings: { botCanInitiateHalfQuote?: boolean; botCanInitiateFullQuote?: boolean }) => {
    playHit();
    dispatch({ type: "UPDATE_SETTINGS", settings });
  };
  
  // AI logic
  useEffect(() => {
    // Skip AI logic if game hasn't started
    if (!state.settings.gameStarted) {
      return;
    }
    
    // Handle AI turns
    const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
    
    if (currentPlayerId !== "player" && state.players[currentPlayerId] && !state.players[currentPlayerId].isHuman) {
      setIsAiThinking(true);
      
      const aiAction = setTimeout(() => {
        // Handle different phases
        switch (state.currentPhase) {
          case "half_quote_decision":
            // Check if bot is allowed to initiate half quote
            if (state.settings.botCanInitiateHalfQuote && shouldDeclareHalfQuote(state, currentPlayerId)) {
              dispatch({ type: "DECLARE_HALF_QUOTE", playerId: currentPlayerId });
              playSuccess();
            } else {
              dispatch({ type: "PASS_HALF_QUOTE", playerId: currentPlayerId });
            }
            break;
            
          case "trump_declaration":
            const trumpSuit = chooseTrumpSuit(state, currentPlayerId);
            dispatch({ type: "DECLARE_TRUMP", playerId: currentPlayerId, suit: trumpSuit });
            break;
            
          case "full_quote_decision":
            // Check if this player's team can declare full quote
            const canDeclareFullQuote = state.trumpDecider 
              ? state.players[currentPlayerId].team !== state.players[state.trumpDecider].team
              : true;
              
            // Check if bot is allowed to initiate full quote
            if (canDeclareFullQuote && state.settings.botCanInitiateFullQuote && shouldDeclareFullQuote(state, currentPlayerId)) {
              dispatch({ type: "DECLARE_FULL_QUOTE", playerId: currentPlayerId });
              playSuccess();
            } else {
              dispatch({ type: "PASS_FULL_QUOTE", playerId: currentPlayerId });
            }
            break;
            
          case "card_exchange":
            // Bot selects cards to exchange with teammate
            const exchangeCards = chooseCardsToExchange(state, currentPlayerId);
            
            // Find teammate
            const botTeam = state.players[currentPlayerId].team;
            const teammate = Object.values(state.players).find(
              p => p.id !== currentPlayerId && p.team === botTeam
            );
            
            if (teammate) {
              dispatch({ 
                type: "EXCHANGE_CARDS", 
                fromPlayer: currentPlayerId, 
                toPlayer: teammate.id, 
                cards: exchangeCards 
              });
            }
            break;
            
          case "trick_play":
            // AI selects and plays a card
            const cardToPlay = selectCardToPlay(state, currentPlayerId);
            setTimeout(() => {
              dispatch({ type: "PLAY_CARD", playerId: currentPlayerId, card: cardToPlay });
              setIsAiThinking(false);
            }, AI_CARD_PLAY_DELAY);
            return; // Early return to preserve "thinking" state during card play
            
          default:
            break;
        }
        
        setIsAiThinking(false);
      }, AI_THINKING_DELAY);
      
      return () => clearTimeout(aiAction);
    }
  }, [state.currentPhase, state.currentPlayerIndex, state.playerOrder, state.settings.gameStarted, state.settings.botCanInitiateHalfQuote, state.settings.botCanInitiateFullQuote]);
  
  // Handle trick result phase with delay
  useEffect(() => {
    if (state.currentPhase === "trick_result") {
      const trickResultTimer = setTimeout(() => {
        playSuccess();
        dispatch({ type: "COMPLETE_TRICK" });
      }, TRICK_RESULT_DELAY);
      
      return () => clearTimeout(trickResultTimer);
    }
  }, [state.currentPhase, dispatch, playSuccess]);
  
  const contextValue: GameContextType = {
    state,
    dispatch,
    isPlayerTurn,
    selectedCards,
    selectCard,
    deselectCard,
    declareHalfQuote,
    passHalfQuote,
    declareTrump,
    declareFullQuote,
    passFullQuote,
    exchangeCards,
    playCard,
    startNewRound,
    startGame,
    isAiThinking,
    updateSettings
  };
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for accessing the game context
export const useGame = () => {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  
  return context;
};
