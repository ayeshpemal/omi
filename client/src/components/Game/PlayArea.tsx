import { FC, useEffect, useState } from "react";
import { Card as CardType, PlayerId } from "../../types/game";
import { Card, CardPlaceholder } from "./Card";
import { useGame } from "../../context/GameContext";
import { SUIT_SYMBOLS, MOBILE_BREAKPOINT } from "../../utils/constants";
import { useIsMobile } from "../../hooks/use-is-mobile";

interface PlayAreaProps {
  className?: string;
}

export const PlayArea: FC<PlayAreaProps> = ({ className }) => {
  const { state, isAiThinking } = useGame();
  const [animationCard, setAnimationCard] = useState<{card: CardType, position: string} | null>(null);
  const isMobile = useIsMobile();
  
  const { currentTrick, playerOrder, currentPlayerIndex, trump, currentPhase } = state;
  const currentPlayerId = playerOrder[currentPlayerIndex];
  
  // Calculate positions for each player's card placement - adjust for mobile
  const positions: Record<PlayerId, { top: string, left: string, transform: string }> = isMobile 
    ? {
        player: { top: "80%", left: "50%", transform: "translate(-50%, -50%)" },
        bot1: { top: "50%", left: "20%", transform: "translate(-50%, -50%)" },
        bot2: { top: "20%", left: "50%", transform: "translate(-50%, -50%)" },
        bot3: { top: "50%", left: "80%", transform: "translate(-50%, -50%)" },
      }
    : {
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
    <div 
      className={`play-area ${className || ""} relative w-full max-w-4xl mx-auto transition-all duration-300`} 
      style={{ 
        height: isMobile ? "280px" : "340px",
        background: currentPhase === "trick_result" ? "rgba(255, 253, 232, 0.4)" : "transparent",
        borderRadius: "8px"
      }}
    >
      {/* Trump indicator */}
      {trump && (
        <div className="absolute top-2 right-2 p-2 bg-gray-100 dark:bg-gray-700 rounded shadow z-10 text-base md:text-lg font-bold">
          <span className="hidden md:inline">Trump:</span> <span className="md:ml-1" style={{ color: trump === "hearts" || trump === "diamonds" ? "#E31B23" : "#000000" }}>
            {SUIT_SYMBOLS[trump]}
          </span>
        </div>
      )}
      
      {/* Show trick winner overlay during trick_result phase */}
      {currentPhase === "trick_result" && currentTrick.winner && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-100 dark:to-amber-900 opacity-20 rounded-lg"></div>
      )}
      
      {/* Play positions for each player */}
      {Object.entries(positions).map(([playerId, position]) => {
        const cardPlayed = currentTrick.cards.find(c => c.playerId === playerId);
        const isCurrentPlayer = currentPlayerId === playerId;
        const isWinner = currentPhase === "trick_result" && currentTrick.winner === playerId;
        
        return (
          <div 
            key={playerId}
            className={`absolute transition-all ${isCurrentPlayer ? "ring-2 ring-blue-400 ring-opacity-70" : ""} 
                      ${isWinner ? "ring-3 ring-yellow-400 ring-opacity-90 animate-pulse" : ""}`}
            style={{ 
              top: position.top, 
              left: position.left, 
              transform: position.transform,
              transition: "all 0.3s ease",
              padding: isMobile ? "6px" : "10px",
              borderRadius: "10px",
              zIndex: isWinner ? 5 : 1
            }}
          >
            <div className="text-center text-xs md:text-sm font-medium mb-1">
              {state.players[playerId as PlayerId].name}
              {isCurrentPlayer && isAiThinking && <span className="ml-2 animate-pulse">•••</span>}
              {isWinner && <span className="ml-1 text-yellow-600 dark:text-yellow-400">🏆</span>}
            </div>
            
            {cardPlayed ? (
              <Card card={cardPlayed.card} size={isMobile ? "small" : "normal"} />
            ) : (
              <CardPlaceholder size={isMobile ? "small" : "normal"} />
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
          <Card card={animationCard.card} size={isMobile ? "small" : "normal"} />
        </div>
      )}
      
      {/* Current trick info */}
      {currentTrick.leadSuit && (
        <div className="absolute bottom-2 left-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs md:text-sm">
          <span className="hidden md:inline">Lead:</span> <span style={{ 
            color: currentTrick.leadSuit === "hearts" || currentTrick.leadSuit === "diamonds" ? "#E31B23" : "#000000",
            fontWeight: "bold" 
          }}>
            {SUIT_SYMBOLS[currentTrick.leadSuit]}
          </span>
        </div>
      )}
      
      {/* Phase indicator for trick result */}
      {currentPhase === "trick_result" && currentTrick.winner && (
        <div className="absolute bottom-0 left-0 right-0 text-center mb-2">
          <div className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 px-3 py-1 rounded-full text-sm shadow-md">
            {state.players[currentTrick.winner].name} wins the trick!
          </div>
        </div>
      )}
    </div>
  );
};
