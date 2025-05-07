import { FC, useEffect, useState } from "react";
import { Card as CardType, PlayerId } from "../../types/game";
import { Card, CardPlaceholder } from "./Card";
import { useGame } from "../../context/GameContext";
import { SUIT_SYMBOLS } from "../../utils/constants";

interface PlayAreaProps {
  className?: string;
}

export const PlayArea: FC<PlayAreaProps> = ({ className }) => {
  const { state, isAiThinking } = useGame();
  const [animationCard, setAnimationCard] = useState<{card: CardType, position: string} | null>(null);
  
  const { currentTrick, playerOrder, currentPlayerIndex, trump } = state;
  const currentPlayerId = playerOrder[currentPlayerIndex];
  
  // Calculate positions for each player's card placement
  const positions: Record<PlayerId, { top: string, left: string, transform: string }> = {
    player: { top: "75%", left: "50%", transform: "translate(-50%, -50%)" },
    bot1: { top: "50%", left: "25%", transform: "translate(-50%, -50%)" },
    bot2: { top: "25%", left: "50%", transform: "translate(-50%, -50%)" },
    bot3: { top: "50%", left: "75%", transform: "translate(-50%, -50%)" },
  };
  
  // Track when a new card is played to animate it
  useEffect(() => {
    const lastCardPlayed = currentTrick.cards[currentTrick.cards.length - 1];
    if (lastCardPlayed) {
      const position = positions[lastCardPlayed.playerId].left;
      setAnimationCard({card: lastCardPlayed.card, position});
      
      const timer = setTimeout(() => {
        setAnimationCard(null);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentTrick.cards.length]);

  return (
    <div className={`play-area ${className || ""} relative`} style={{ height: "300px" }}>
      {/* Trump indicator */}
      {trump && (
        <div className="absolute top-2 right-2 p-2 bg-gray-100 rounded shadow text-lg font-bold">
          Trump: <span style={{ color: trump === "hearts" || trump === "diamonds" ? "#E31B23" : "#000000" }}>
            {SUIT_SYMBOLS[trump]}
          </span>
        </div>
      )}
      
      {/* Play positions for each player */}
      {Object.entries(positions).map(([playerId, position]) => {
        const cardPlayed = currentTrick.cards.find(c => c.playerId === playerId);
        const isCurrentPlayer = currentPlayerId === playerId;
        
        return (
          <div 
            key={playerId}
            className={`absolute ${isCurrentPlayer ? "ring-2 ring-blue-400 ring-opacity-70" : ""}`}
            style={{ 
              top: position.top, 
              left: position.left, 
              transform: position.transform,
              transition: "all 0.3s ease",
              padding: "10px",
              borderRadius: "10px"
            }}
          >
            <div className="text-center text-sm font-medium mb-1">
              {state.players[playerId as PlayerId].name}
              {isCurrentPlayer && isAiThinking && <span className="ml-2 animate-pulse">•••</span>}
            </div>
            
            {cardPlayed ? (
              <Card card={cardPlayed.card} size="normal" />
            ) : (
              <CardPlaceholder size="normal" />
            )}
          </div>
        );
      })}
      
      {/* Card animation */}
      {animationCard && (
        <div
          className="absolute z-10 transition-all duration-500"
          style={{ 
            top: "calc(100% - 50px)",
            left: animationCard.position,
            transform: "translate(-50%, -50%) scale(0.9)",
            opacity: 0,
          }}
        >
          <Card card={animationCard.card} size="normal" />
        </div>
      )}
      
      {/* Current trick info */}
      {currentTrick.leadSuit && (
        <div className="absolute bottom-2 left-2 p-2 bg-gray-100 rounded text-sm">
          Lead: <span style={{ 
            color: currentTrick.leadSuit === "hearts" || currentTrick.leadSuit === "diamonds" ? "#E31B23" : "#000000",
            fontWeight: "bold" 
          }}>
            {SUIT_SYMBOLS[currentTrick.leadSuit]}
          </span>
        </div>
      )}
    </div>
  );
};
