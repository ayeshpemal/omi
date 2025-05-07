import { FC } from "react";
import { useGame } from "../../context/GameContext";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export const CardExchange: FC = () => {
  const { 
    state, 
    selectedCards, 
    exchangeCards, 
    isPlayerTurn
  } = useGame();
  
  // Find teammate of the player
  const playerTeam = state.players.player.team;
  const teammate = Object.values(state.players).find(
    p => p.id !== "player" && p.team === playerTeam
  );
  
  // Check if the current player is the one who should exchange
  const isPlayerExchanging = isPlayerTurn;
  
  if (!isPlayerExchanging) {
    return (
      <Card className="p-4 shadow-md text-center">
        <h2 className="text-xl font-bold mb-4">Card Exchange</h2>
        <p>Waiting for {state.players[state.playerOrder[state.currentPlayerIndex]].name} to exchange cards...</p>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center">Card Exchange</h2>
      
      <p className="text-center mb-4">
        Select 2 cards from your hand to exchange with {teammate?.name}
      </p>
      
      <div className="flex justify-center space-x-2 mb-4">
        <div className="text-center">
          <p className="text-sm mb-1">Selected Cards:</p>
          <div className="flex gap-2 justify-center">
            <div className={`w-12 h-16 border ${selectedCards[0] ? "border-blue-500" : "border-dashed border-gray-300"} rounded flex items-center justify-center`}>
              {selectedCards[0] ? `${selectedCards[0].rank}${selectedCards[0].suit.charAt(0).toUpperCase()}` : "1"}
            </div>
            <div className={`w-12 h-16 border ${selectedCards[1] ? "border-blue-500" : "border-dashed border-gray-300"} rounded flex items-center justify-center`}>
              {selectedCards[1] ? `${selectedCards[1].rank}${selectedCards[1].suit.charAt(0).toUpperCase()}` : "2"}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={exchangeCards} 
          disabled={selectedCards.length !== 2}
          className="bg-primary hover:bg-primary/90"
        >
          Exchange Cards
        </Button>
      </div>
    </Card>
  );
};
