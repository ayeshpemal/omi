import { FC } from "react";
import { Card, CardList } from "./Card";
import { useGame } from "../../context/GameContext";
import { Card as CardType } from "../../types/game";
import { useIsMobile } from "../../hooks/use-is-mobile";

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
  
  const handleCardClick = (card: CardType) => {
    // Different behavior based on game phase
    
    if (state.currentPhase === "trick_play") {
      // In trick play, clicking a card plays it
      if (isPlayerTurn && canPlayCard(card)) {
        playCard(card);
      }
    } else if (state.currentPhase === "card_exchange") {
      // In card exchange, toggle selection of cards
      if (selectedCards.some(sc => sc.id === card.id)) {
        deselectCard(card);
      } else {
        if (selectedCards.length < 2) {
          selectCard(card);
        }
      }
    }
  };
  
  const canPlayCard = (card: CardType): boolean => {
    // Can't play if it's not your turn
    if (!isPlayerTurn) return false;
    
    // Can only play cards during trick play phase
    if (state.currentPhase !== "trick_play") return false;
    
    const currentTrick = state.currentTrick;
    
    // If this is the first card of the trick, any card is playable
    if (currentTrick.cards.length === 0) return true;
    
    // Must follow suit if possible
    if (currentTrick.leadSuit) {
      // Check if player has any cards of the lead suit
      const hasSuit = playerHand.some(c => c.suit === currentTrick.leadSuit);
      
      // If player has a card of the lead suit, they must play it
      if (hasSuit) {
        return card.suit === currentTrick.leadSuit;
      }
      
      // If no cards of the lead suit, any card is playable
      return true;
    }
    
    return true;
  };
  
  // Determine which cards are playable in the current context
  const playableCards = playerHand.filter(canPlayCard);
  const isMobile = useIsMobile();

  // Adjust card display settings based on game phase
  const isSpecialPhase = ["half_quote_decision", "trump_declaration", "full_quote_decision"].includes(state.currentPhase);
  
  // Use smaller overlap in special phases to make sure all cards are visible
  const cardOverlap = isSpecialPhase 
    ? (isMobile ? 15 : 30) 
    : (isMobile ? 25 : 40);
  
  // Adjust card size in decision phases for better visibility
  const cardSize = isSpecialPhase && isMobile 
    ? "small" 
    : isMobile ? "small" : "normal";
  
  // Make sure cards are positioned correctly in special phases
  const cardListStyles = isSpecialPhase 
    ? { transform: "translateY(-10px)", marginBottom: "10px" } 
    : {};

  return (
    <div className={`player-hand ${className || ""} w-full max-w-4xl mx-auto px-2 ${isSpecialPhase ? 'relative' : ''}`}>
      <div className="text-center mb-2 font-semibold text-sm md:text-base">
        {isPlayerTurn && state.currentPhase === "trick_play" && (
          <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-full text-xs md:text-sm mr-2 animate-pulse">
            Your Turn
          </span>
        )}
        Your Hand
        {state.currentPhase === "card_exchange" && (
          <span className="block text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Select two cards to exchange with your teammate
          </span>
        )}
      </div>
      
      <CardList
        cards={playerHand}
        selectedCards={selectedCards}
        onCardClick={handleCardClick}
        playableCards={playableCards}
        size={cardSize}
        fanned={true}
        overlap={cardOverlap}
        maxWidth={isMobile ? undefined : 800} // Let it auto-calculate on mobile
        className="transition-all duration-300"
        style={cardListStyles}
      />
      
      {/* Contextual help text */}
      {state.currentPhase === "trick_play" && isPlayerTurn && playableCards.length > 0 && (
        <div className="text-center mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
          {playableCards.length < playerHand.length 
            ? "You must follow the lead suit" 
            : "Select a card to play"}
        </div>
      )}
      
      {/* Special notification for decision phases */}
      {isSpecialPhase && (
        <div className="text-center text-xs text-gray-600 dark:text-gray-300 mt-2">
          <span className="inline-block bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            Your cards are still available for reference
          </span>
        </div>
      )}
    </div>
  );
};
