import { FC } from "react";
import { useGame } from "../../context/GameContext";
import { Button } from "../ui/button";
import { SUIT_SYMBOLS } from "../../utils/constants";
import { Suit } from "../../types/game";

interface GameControlsProps {
  className?: string;
}

export const GameControls: FC<GameControlsProps> = ({ className }) => {
  const { 
    state, 
    isPlayerTurn, 
    declareHalfQuote, 
    passHalfQuote,
    declareTrump,
    declareFullQuote,
    passFullQuote,
    startNewRound
  } = useGame();
  
  // Control rendering based on game phase
  const renderHalfQuoteControls = () => {
    if (state.currentPhase === "half_quote_decision" && isPlayerTurn) {
      return (
        <div className="flex flex-col space-y-3">
          <h3 className="text-lg font-semibold">Half Quote Decision</h3>
          <p className="text-sm">Do you want to declare Half Quote?</p>
          <div className="flex space-x-3">
            <Button onClick={declareHalfQuote} className="bg-green-600 hover:bg-green-700">
              Declare Half Quote
            </Button>
            <Button onClick={passHalfQuote} variant="outline">
              Pass
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const renderTrumpControls = () => {
    if (state.currentPhase === "trump_declaration" && isPlayerTurn) {
      return (
        <div className="flex flex-col space-y-3">
          <h3 className="text-lg font-semibold">Trump Declaration</h3>
          <p className="text-sm">Select a trump suit:</p>
          <div className="flex space-x-3 justify-center">
            {(["hearts", "diamonds", "clubs", "spades"] as Suit[]).map(suit => (
              <Button
                key={suit}
                onClick={() => declareTrump(suit)}
                className={`w-12 h-12 text-xl ${
                  suit === "hearts" || suit === "diamonds" 
                    ? "text-red-600" 
                    : "text-black"
                }`}
                variant="outline"
              >
                {SUIT_SYMBOLS[suit]}
              </Button>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  const renderFullQuoteControls = () => {
    if (state.currentPhase === "full_quote_decision" && isPlayerTurn) {
      // Check if player's team can declare full quote
      const canDeclareFullQuote = state.trumpDecider 
        ? state.players.player.team !== state.players[state.trumpDecider].team
        : true;
        
      if (!canDeclareFullQuote) {
        return (
          <div className="flex flex-col space-y-3">
            <h3 className="text-lg font-semibold">Full Quote Decision</h3>
            <p className="text-sm">Your team declared trump, so you cannot declare Full Quote.</p>
          </div>
        );
      }
      
      return (
        <div className="flex flex-col space-y-3">
          <h3 className="text-lg font-semibold">Full Quote Decision</h3>
          <p className="text-sm">Do you want to declare Full Quote?</p>
          <div className="flex space-x-3">
            <Button onClick={declareFullQuote} className="bg-green-600 hover:bg-green-700">
              Declare Full Quote
            </Button>
            <Button onClick={passFullQuote} variant="outline">
              Pass
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const renderRoundEndControls = () => {
    if (state.currentPhase === "round_end") {
      return (
        <div className="flex flex-col space-y-3">
          <h3 className="text-lg font-semibold">Round Complete</h3>
          <Button onClick={startNewRound} className="bg-primary hover:bg-primary/90">
            Start New Round
          </Button>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={`game-controls p-4 bg-white rounded-lg shadow ${className || ""}`}>
      {renderHalfQuoteControls()}
      {renderTrumpControls()}
      {renderFullQuoteControls()}
      {renderRoundEndControls()}
    </div>
  );
};
