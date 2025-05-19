import { FC, useState, CSSProperties } from "react";
import { Card as CardType } from "../../types/game";
import { CARD_HEIGHT, CARD_WIDTH, SUIT_COLORS, SUIT_SYMBOLS, MOBILE_BREAKPOINT } from "../../utils/constants";
import { useGame } from "../../context/GameContext";
import { useAudio } from "../../lib/stores/useAudio";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { motion } from "framer-motion";

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  style?: CSSProperties;
}

export const Card: FC<CardProps> = ({
  card,
  isSelected = false,
  isPlayable = false,
  onClick,
  faceDown = false,
  size = "md",
  className = "",
  style = {},
}) => {
  const { playHit } = useAudio();
  const [isHovering, setIsHovering] = useState(false);
  const isMobile = useIsMobile();
  
  // Size multipliers - adjust further down for mobile
  const sizes = {
    xs: isMobile ? 0.5 : 0.6,
    sm: isMobile ? 0.65 : 0.75,
    md: isMobile ? 0.8 : 0.9,
    lg: isMobile ? 0.95 : 1.1,
  };
  
  const width = CARD_WIDTH * sizes[size];
  const height = CARD_HEIGHT * sizes[size];
  
  const handleClick = () => {
    if (onClick) {
      playHit();
      onClick();
    }
  };
  
  // Card styling
  const cardStyle: CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: "8px",
    backgroundColor: "white",
    cursor: onClick ? "pointer" : "default",
    ...style,
  };
  
  // If the card is face down, render the back
  if (faceDown) {
    return (
      <motion.div 
        style={cardStyle}
        className={`${className} card-back relative shadow-md`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        whileHover={{ y: onClick ? -5 : 0, boxShadow: "0 5px 15px rgba(0,0,0,0.2)" }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 to-blue-800 p-[2px]">
          <div className="absolute inset-0 rounded-lg bg-gray-900 flex items-center justify-center">
            <div className="text-lg font-bold text-blue-400">OMI</div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // For face-up card, show the card content
  const { suit, rank } = card;
  const color = SUIT_COLORS[suit];
  const symbol = SUIT_SYMBOLS[suit];
  
  // Card highlight styling for playable cards
  const getCardHighlight = () => {
    if (isSelected) return "ring-2 ring-blue-500 dark:ring-blue-400";
    if (isPlayable) return "hover:ring-2 hover:ring-green-400 dark:hover:ring-green-400";
    return "";
  };
  
  return (
    <motion.div 
      style={cardStyle}
      className={`card-front bg-white dark:bg-gray-100 relative ${getCardHighlight()} shadow-md ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileHover={isPlayable || onClick ? { 
        y: -8, 
        boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
        transition: { type: "spring", stiffness: 300, damping: 15 }
      } : {}}
      animate={isSelected ? {
        y: -5,
        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.5)",
      } : {}}
    >
      {/* Playable indicator */}
      {isPlayable && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white z-10 animate-pulse"></div>
      )}
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border border-white z-10"></div>
      )}
      
      {/* Top left corner */}
      <div className="absolute top-1 left-1 flex flex-col items-center" style={{ color }}>
        <div style={{ fontSize: `${width * 0.16}px`, lineHeight: 1, fontWeight: "bold" }}>{rank}</div>
        <div style={{ fontSize: `${width * 0.16}px`, lineHeight: 1 }}>{symbol}</div>
      </div>
      
      {/* Bottom right corner */}
      <div className="absolute bottom-1 right-1 flex flex-col items-center transform rotate-180" style={{ color }}>
        <div style={{ fontSize: `${width * 0.16}px`, lineHeight: 1, fontWeight: "bold" }}>{rank}</div>
        <div style={{ fontSize: `${width * 0.16}px`, lineHeight: 1 }}>{symbol}</div>
      </div>
      
      {/* Center symbol */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ color }}>
        <div style={{ fontSize: `${width * 0.35}px`, lineHeight: 1 }}>{symbol}</div>
      </div>
    </motion.div>
  );
};

// CardPlaceholder component for empty spots
export const CardPlaceholder: FC<{
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "md", className = "" }) => {
  const isMobile = useIsMobile();
  
  const sizes = {
    xs: isMobile ? 0.5 : 0.6,
    sm: isMobile ? 0.65 : 0.75,
    md: isMobile ? 0.8 : 0.9,
    lg: isMobile ? 0.95 : 1.1,
  };
  
  const width = CARD_WIDTH * sizes[size];
  const height = CARD_HEIGHT * sizes[size];
  
  return (
    <div 
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }} 
      className={`rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 ${className}`} 
    />
  );
};

// CardList component for displaying a list of cards (e.g., in hand)
export const CardList: FC<{
  cards: CardType[];
  selectedCards?: CardType[];
  onCardClick?: (card: CardType) => void;
  playableCards?: string[];
  size?: "xs" | "sm" | "md" | "lg";
  fanned?: boolean;
  overlap?: number;
  maxWidth?: number;
  className?: string;
  highlightPlayable?: boolean;
}> = ({
  cards,
  selectedCards = [],
  onCardClick,
  playableCards = [],
  size = "md",
  fanned = true,
  overlap = 0.5, // This is now a percentage of card width
  maxWidth,
  className = "",
  highlightPlayable = false,
}) => {
  const { state } = useGame();
  const isMobile = useIsMobile();
  
  const isCardPlayable = (card: CardType) => {
    if (!playableCards.length || !highlightPlayable) return false;
    return playableCards.includes(card.id);
  };
  
  const isCardSelected = (card: CardType) => {
    return selectedCards.some(sc => sc.id === card.id);
  };
  
  // Size multipliers - adjust for mobile
  const sizes = {
    xs: isMobile ? 0.5 : 0.6,
    sm: isMobile ? 0.65 : 0.75,
    md: isMobile ? 0.8 : 0.9,
    lg: isMobile ? 0.95 : 1.1,
  };
  
  // Calculate card width and position
  const cardWidth = CARD_WIDTH * sizes[size];
  
  // Calculate overlap pixels based on percentage of card width
  const overlapPixels = cardWidth * overlap;
  
  // Calculate total width
  const calculatedWidth = fanned ? cardWidth + (cards.length - 1) * overlapPixels : cardWidth;
  
  // Adjust overlap if maxWidth is provided and we exceed it
  let adjustedOverlap = overlapPixels;
  
  // Default maxWidth for mobile if not provided
  const effectiveMaxWidth = maxWidth || (isMobile ? window.innerWidth - 40 : 750);
  
  if (calculatedWidth > effectiveMaxWidth) {
    adjustedOverlap = Math.max(10, (effectiveMaxWidth - cardWidth) / Math.max(1, cards.length - 1));
  }
  
  return (
    <div 
      style={{ 
        display: "flex", 
        justifyContent: "center",
        width: "100%",
        margin: "0 auto",
        position: "relative",
        height: `${CARD_HEIGHT * sizes[size] + 15}px`,
        paddingLeft: cardWidth / 2,
        paddingRight: cardWidth / 2
      }}
      className={className}
    >
      {cards.map((card, index) => (
        <Card
          key={card.id}
          card={card}
          size={size}
          isSelected={isCardSelected(card)}
          isPlayable={isCardPlayable(card)}
          onClick={() => onCardClick && onCardClick(card)}
          style={{
            position: "absolute",
            left: fanned ? `calc(50% - ${cardWidth/2}px + ${index * adjustedOverlap - ((cards.length-1) * adjustedOverlap)/2}px)` : "50%",
            transform: fanned ? "none" : "translateX(-50%)",
            zIndex: index,
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
};