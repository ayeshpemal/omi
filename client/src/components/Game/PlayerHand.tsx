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

  return (
    <div className={`player-hand ${className || ""} w-full max-w-4xl mx-auto px-2`}>
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
        size={isMobile ? "small" : "normal"}
        fanned={true}
        overlap={isMobile ? 25 : 40}
        maxWidth={isMobile ? undefined : 800} // Let it auto-calculate on mobile
        className="transition-all duration-300"
      />
      
      {/* Contextual help text */}
      {state.currentPhase === "trick_play" && isPlayerTurn && playableCards.length > 0 && (
        <div className="text-center mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
          {playableCards.length < playerHand.length 
            ? "You must follow the lead suit" 
            : "Select a card to play"}
        </div>
      )}
    </div>
  );
};
