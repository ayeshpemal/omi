import { FC, useState } from "react";
import { Card as CardType } from "../../types/game";
import { CARD_HEIGHT, CARD_WIDTH, SUIT_COLORS, SUIT_SYMBOLS } from "../../utils/constants";
import { useGame } from "../../context/GameContext";
import { useAudio } from "../../lib/stores/useAudio";

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  size?: "small" | "normal" | "large";
  className?: string;
}

export const Card: FC<CardProps> = ({
  card,
  isSelected = false,
  isPlayable = false,
  onClick,
  faceDown = false,
  size = "normal",
  className = "",
}) => {
  const { playHit } = useAudio();
  const [isHovering, setIsHovering] = useState(false);
  
  // Size multipliers
  const sizes = {
    small: 0.7,
    normal: 1,
    large: 1.2,
  };
  
  const width = CARD_WIDTH * sizes[size];
  const height = CARD_HEIGHT * sizes[size];
  
  const handleClick = () => {
    if (onClick && isPlayable) {
      playHit();
      onClick();
    }
  };
  
  // Card styling
  const cardStyle = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: "8px",
    position: "relative" as const,
    backgroundColor: "white",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    border: isSelected ? "2px solid blue" : "1px solid #ddd",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
    transform: isHovering && isPlayable ? "translateY(-10px)" : (isSelected ? "translateY(-5px)" : "none"),
    cursor: isPlayable ? "pointer" : "default",
    opacity: isPlayable ? 1 : 0.8,
  };
  
  // If the card is face down, render the back
  if (faceDown) {
    return (
      <div 
        style={cardStyle}
        className={`${className} card-back`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          width: "100%",
          height: "100%",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpattern id='pattern' x='0' y='0' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Crect fill='%233498db' width='5' height='5' x='0' y='0'/%3E%3Crect fill='%232c3e50' width='5' height='5' x='5' y='5'/%3E%3C/pattern%3E%3Crect fill='%23243342' width='40' height='40'/%3E%3Crect fill='url(%23pattern)' width='40' height='40'/%3E%3C/svg%3E")`,
        }} />
      </div>
    );
  }
  
  // For face-up card, show the card content
  const { suit, rank } = card;
  const color = SUIT_COLORS[suit];
  const symbol = SUIT_SYMBOLS[suit];
  
  return (
    <div 
      style={cardStyle}
      className={`${className} card-front`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Top left corner */}
      <div style={{ position: "absolute", top: "5px", left: "5px", fontSize: `${width * 0.15}px`, color }}>
        <div>{rank}</div>
        <div style={{ fontSize: `${width * 0.16}px` }}>{symbol}</div>
      </div>
      
      {/* Bottom right corner */}
      <div style={{ position: "absolute", bottom: "5px", right: "5px", fontSize: `${width * 0.15}px`, color, transform: "rotate(180deg)" }}>
        <div>{rank}</div>
        <div style={{ fontSize: `${width * 0.16}px` }}>{symbol}</div>
      </div>
      
      {/* Center symbol */}
      <div style={{ 
        position: "absolute", 
        top: "50%", 
        left: "50%", 
        transform: "translate(-50%, -50%)",
        fontSize: `${width * 0.3}px`,
        color,
      }}>
        {symbol}
      </div>
    </div>
  );
};

// CardPlaceholder component for empty spots
export const CardPlaceholder: FC<{
  size?: "small" | "normal" | "large";
  className?: string;
}> = ({ size = "normal", className = "" }) => {
  const sizes = {
    small: 0.7,
    normal: 1,
    large: 1.2,
  };
  
  const width = CARD_WIDTH * sizes[size];
  const height = CARD_HEIGHT * sizes[size];
  
  return (
    <div style={{
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: "8px",
      border: "1px dashed #aaa",
      backgroundColor: "rgba(0,0,0,0.05)",
    }} className={className} />
  );
};

// CardList component for displaying a list of cards (e.g., in hand)
export const CardList: FC<{
  cards: CardType[];
  selectedCards?: CardType[];
  onCardClick?: (card: CardType) => void;
  playableCards?: CardType[];
  size?: "small" | "normal" | "large";
  fanned?: boolean;
  overlap?: number;
  maxWidth?: number;
  className?: string;
}> = ({
  cards,
  selectedCards = [],
  onCardClick,
  playableCards = [],
  size = "normal",
  fanned = true,
  overlap = 30,
  maxWidth,
  className = "",
}) => {
  const { state } = useGame();
  
  const isPlayable = (card: CardType) => {
    if (!playableCards.length) return true;
    return playableCards.some(pc => pc.id === card.id);
  };
  
  const isSelected = (card: CardType) => {
    return selectedCards.some(sc => sc.id === card.id);
  };
  
  // Calculate fan width
  const cardWidth = CARD_WIDTH * (size === "small" ? 0.7 : size === "large" ? 1.2 : 1);
  const totalWidth = fanned ? cardWidth + (cards.length - 1) * overlap : cardWidth;
  
  // Adjust overlap if maxWidth is provided and we exceed it
  let adjustedOverlap = overlap;
  if (maxWidth && totalWidth > maxWidth) {
    adjustedOverlap = Math.max(15, (maxWidth - cardWidth) / (cards.length - 1));
  }
  
  return (
    <div 
      style={{ 
        display: "flex", 
        justifyContent: "center",
        width: maxWidth ? `${maxWidth}px` : "auto",
        margin: "0 auto",
        position: "relative",
        height: `${CARD_HEIGHT * (size === "small" ? 0.7 : size === "large" ? 1.2 : 1) + 15}px`,
      }}
      className={className}
    >
      {cards.map((card, index) => (
        <Card
          key={card.id}
          card={card}
          size={size}
          isSelected={isSelected(card)}
          isPlayable={isPlayable(card)}
          onClick={() => onCardClick && onCardClick(card)}
          style={{
            position: "absolute",
            left: fanned ? `${index * adjustedOverlap}px` : "0",
            zIndex: index,
          }}
        />
      ))}
    </div>
  );
};
