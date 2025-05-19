import { FC, useMemo } from "react";
import { Card, CardList } from "./Card";
import { useGame } from "../../context/GameContext";
import { Card as CardType } from "../../types/game";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { motion } from "framer-motion";

interface PlayerHandProps {
  className?: string;
}

export const PlayerHand: FC<PlayerHandProps> = ({ className }) => {
  const { 
    state, 
    isPlayerTurn, 
    selectedCards, 
    selectCard, 
    deselectCard,
    playCard 
  } = useGame();
  
  const playerHand = state.players.player.hand;
  const isMobile = useIsMobile();
  
  const handleCardClick = (card: CardType) => {
    // Different behavior based on game phase
    
    if (state.currentPhase === "trick_play") {
      // In trick play, clicking a card plays it
      if (isPlayerTurn && canPlayCard(card)) {
        playCard(card);
      }
    } else if (state.currentPhase === "card_exchange") {
      // In card exchange, clicking selects/deselects card
      const isSelected = selectedCards.find(c => c.id === card.id);
      if (isSelected) {
        deselectCard(card);
      } else if (selectedCards.length < 2) {
        selectCard(card);
      }
    }
  };
  
  // Determine which cards can be played in the current trick
  const playableCards = useMemo(() => {
    if (state.currentPhase !== "trick_play" || !isPlayerTurn) {
      return [];
    }
    
    const leadSuit = state.currentTrick.leadSuit;
    
    // If player is first to play, any card is playable
    if (!leadSuit) {
      return playerHand.map(card => card.id);
    }
    
    // Check if player has any cards of lead suit
    const hasSuitCards = playerHand.some(card => card.suit === leadSuit);
    
    // If player has lead suit, only those cards are playable
    if (hasSuitCards) {
      return playerHand
        .filter(card => card.suit === leadSuit)
        .map(card => card.id);
    }
    
    // If player has no lead suit, any card is playable
    return playerHand.map(card => card.id);
  }, [state.currentPhase, state.currentTrick.leadSuit, isPlayerTurn, playerHand]);
  
  const canPlayCard = (card: CardType) => {
    return playableCards.includes(card.id);
  };
  
  // Calculate card size and overlap based on screen size and number of cards
  const cardSize = isMobile ? "xs" : playerHand.length > 7 ? "sm" : "md";
  
  // Calculate container styles for the card list
  const cardListStyles = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative" as const,
    minHeight: isMobile ? "90px" : "120px",
    maxHeight: isMobile ? "100px" : "140px",
    overflow: "visible"
  };
  
  // Calculate overlap based on number of cards and available space
  const cardOverlap = useMemo(() => {
    // More overlap with more cards (values represent % of card width)
    if (playerHand.length > 10) {
      return 0.8; // 80% overlap
    } else if (playerHand.length > 7) {
      return 0.7; // 70% overlap
    } else if (playerHand.length > 5) {
      return 0.6; // 60% overlap
    } else {
      return 0.5; // 50% overlap
    }
  }, [playerHand.length]);
  
  return (
    <div className={`player-hand p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md ${className || ""}`}>
      <div className="flex justify-between items-center mb-1">
        <div className="text-sm font-medium">
          Your Hand
          {state.currentPhase === "card_exchange" && (
            <span className="block text-xs text-gray-600 dark:text-gray-300 mt-1">
              Select two cards to exchange
            </span>
          )}
        </div>
        
        {/* Show visual cue when it's player's turn in trick play */}
        {state.currentPhase === "trick_play" && isPlayerTurn && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-md text-xs font-medium"
          >
            Your Turn
          </motion.div>
        )}
      </div>
      
      <div style={cardListStyles} className="card-container">
        <CardList
          cards={playerHand}
          selectedCards={selectedCards}
          onCardClick={handleCardClick}
          playableCards={playableCards}
          size={cardSize}
          fanned={true}
          overlap={cardOverlap}
          maxWidth={isMobile ? window.innerWidth - 40 : 700} // Adjusted to fit screen
          className="transition-all duration-300"
          highlightPlayable={state.currentPhase === "trick_play" && isPlayerTurn}
        />
      </div>
      
      {/* Simplified contextual help text */}
      {state.currentPhase === "trick_play" && isPlayerTurn && (
        <div className="text-center mt-1 text-xs text-gray-600 dark:text-gray-300">
          {state.currentTrick.leadSuit 
            ? `Follow with ${state.currentTrick.leadSuit} if possible`
            : "Play any card"}
        </div>
      )}
      
      {/* Selected cards count for exchange */}
      {state.currentPhase === "card_exchange" && (
        <div className="text-center mt-1 text-xs">
          <span className="font-medium">{selectedCards.length}/2</span> selected
        </div>
      )}
    </div>
  );
};
