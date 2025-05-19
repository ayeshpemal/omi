import { FC } from "react";
import { Card, CardList } from "./Card";
import { PlayerId } from "../../types/game";
import { useGame } from "../../context/GameContext";

interface AIPlayerProps {
  playerId: PlayerId;
  position: "left" | "top" | "right";
  className?: string;
}

export const AIPlayer: FC<AIPlayerProps> = ({ 
  playerId, 
  position,
  className 
}) => {
  const { state } = useGame();
  const player = state.players[playerId];
  const isBotTurn = state.playerOrder[state.currentPlayerIndex] === playerId;
  const cards = player.hand;
  
  // Style based on position
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    ...(position === "left" ? { left: "20px", top: "50%", transform: "translateY(-50%)" } : 
      position === "right" ? { right: "20px", top: "50%", transform: "translateY(-50%)" } : 
      { top: "20px", left: "50%", transform: "translateX(-50%)" }),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };
  
  const cardListStyle: React.CSSProperties = {
    display: "flex",
    ...(position === "top" ? { flexDirection: "row" } : { flexDirection: "column" }),
    ...(position === "left" ? { alignItems: "flex-start" } : 
      position === "right" ? { alignItems: "flex-end" } : {}),
  };
  
  return (
    <div 
      className={`ai-player ${className || ""}`}
      style={containerStyle}
    >
      <div className={`player-info mb-2 text-center ${player.team === "team1" ? "text-blue-600" : "text-red-600"}`}>
        <div className={`font-semibold ${isBotTurn ? "text-black" : ""}`}>
          {player.name}
          {isBotTurn && <span className="ml-1 inline-block animate-pulse">•••</span>}
        </div>
        <div className="text-xs">{cards.length} cards</div>
      </div>
      
      <div style={cardListStyle}>
        {position === "top" ? (
          <div style={{ display: "flex", gap: "2px" }}>
            {cards.map((_, i) => (
              <Card
                key={i}
                card={{ id: `dummy-${i}`, suit: "hearts", rank: "A", value: 14 }}
                faceDown={true}
                size="xs"
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {cards.map((_, i) => (
              <Card
                key={i}
                card={{ id: `dummy-${i}`, suit: "hearts", rank: "A", value: 14 }}
                faceDown={true}
                size="xs"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
