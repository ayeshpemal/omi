import { FC, useEffect, useState } from "react";
import { Card as CardType, PlayerId } from "../../types/game";
import { Card, CardPlaceholder } from "./Card";
import { useGame } from "../../context/GameContext";
import { SUIT_SYMBOLS, MOBILE_BREAKPOINT } from "../../utils/constants";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { motion, AnimatePresence } from "framer-motion";

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
        player: { top: '85%', left: '50%', transform: 'translate(-50%, -50%)' },
        bot1: { top: '50%', left: '15%', transform: 'translate(-50%, -50%)' },
        bot2: { top: '15%', left: '50%', transform: 'translate(-50%, -50%)' },
        bot3: { top: '50%', left: '85%', transform: 'translate(-50%, -50%)' }
      }
    : {
        player: { top: '80%', left: '50%', transform: 'translate(-50%, -50%)' },
        bot1: { top: '50%', left: '20%', transform: 'translate(-50%, -50%)' },
        bot2: { top: '20%', left: '50%', transform: 'translate(-50%, -50%)' },
        bot3: { top: '50%', left: '80%', transform: 'translate(-50%, -50%)' }
      };
      
  // Set up card animation
  useEffect(() => {
    if (currentTrick.cards.length > 0) {
      const lastCard = currentTrick.cards[currentTrick.cards.length - 1];
      setAnimationCard({ 
        card: lastCard.card,
        position: lastCard.playerId
      });
      
      // Clear animation state after animation completes
      const timer = setTimeout(() => {
        setAnimationCard(null);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentTrick.cards.length]);
  
  // Show trump indicator
  const renderTrumpIndicator = () => {
    if (!trump) return null;
    
    return (
      <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded-full shadow-md flex items-center justify-center">
        <div className="text-lg font-semibold mr-1">{SUIT_SYMBOLS[trump]}</div>
        <div className="text-xs font-medium capitalize">{trump}</div>
      </div>
    );
  };
  
  // Show turn indicator
  const renderTurnIndicator = () => {
    if (currentPhase !== "trick_play" && currentPhase !== "trick_result") return null;
    
    const playerName = state.players[currentPlayerId].name;
    
    return (
      <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm text-xs font-medium">
        {currentPhase === "trick_play" ? `${playerName}'s Turn` : `${state.players[currentTrick.winner || "player"].name} Won Trick`}
      </div>
    );
  };
  
  // Render circular indicators for each player position
  const renderPlayerPositions = () => {
    return Object.entries(positions).map(([playerId, position]) => {
      const isCurrentPlayer = currentPlayerId === playerId;
      const isWinner = currentPhase === "trick_result" && currentTrick.winner === playerId;
      
      return (
        <div 
          key={`position-${playerId}`}
          className={`absolute h-2 w-2 rounded-full transition-all duration-300 ${
            isCurrentPlayer ? "bg-blue-500 scale-150" : 
            isWinner ? "bg-yellow-500 scale-150 animate-pulse" : 
            "bg-gray-300 dark:bg-gray-600"
          }`}
          style={{ 
            top: position.top, 
            left: position.left, 
            transform: position.transform,
            zIndex: 1
          }}
        />
      );
    });
  };
  
  return (
    <div className={`play-area relative w-full h-full ${className || ""}`}>
      {/* Background pattern for the play area */}
      <div className="absolute inset-0 bg-opacity-10 bg-pattern-cards"></div>
      
      {/* Lead suit indicator when available */}
      {currentTrick.leadSuit && currentTrick.cards.length > 0 && (
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
          <div className="flex items-center">
            <span className="text-xs mr-1">Lead:</span>
            <span className="text-base mr-1">{SUIT_SYMBOLS[currentTrick.leadSuit]}</span>
            <span className="text-xs capitalize">{currentTrick.leadSuit}</span>
          </div>
        </div>
      )}
      
      {renderTrumpIndicator()}
      {renderTurnIndicator()}
      {renderPlayerPositions()}
      
      {/* Card positions for each player */}
      {Object.entries(positions).map(([playerId, position]) => {
        const playerCards = currentTrick.cards.filter(card => card.playerId === playerId);
        const cardToShow = playerCards.length > 0 ? playerCards[0].card : null;
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
              {isWinner && <span className="ml-1 text-yellow-500">★</span>}
            </div>
            
            <AnimatePresence mode="wait">
              {cardToShow ? (
                <motion.div
                  key={`card-${cardToShow.id}`}
                  initial={{ 
                    scale: 1.5, 
                    opacity: 0,
                    y: playerId === "player" ? 50 : 
                       playerId === "bot2" ? -50 : 
                       playerId === "bot1" ? 0 : 0,
                    x: playerId === "bot1" ? 50 : 
                       playerId === "bot3" ? -50 : 0
                  }}
                  animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    card={cardToShow} 
                    size={isMobile ? "sm" : "md"} 
                    className={isWinner ? "ring-2 ring-yellow-400" : ""}
                  />
                </motion.div>
              ) : (
                // Empty placeholder with subtle styling to indicate where cards will appear
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                >
                  <CardPlaceholder 
                    size={isMobile ? "sm" : "md"} 
                    className={`border-2 border-dashed ${
                      isCurrentPlayer ? "border-blue-300 dark:border-blue-700" : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      
      {/* Lead suit and trump suit indicators for trick */}
      {currentTrick.cards.length > 0 && currentPhase === "trick_play" && (
        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
          {currentTrick.leadSuit && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm text-xs">
              <span>Lead: </span>
              <span className="font-semibold">{SUIT_SYMBOLS[currentTrick.leadSuit]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
