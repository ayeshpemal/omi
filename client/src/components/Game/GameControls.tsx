import { FC } from "react";
import { useGame } from "../../context/GameContext";
import { Button } from "../ui/button";
import { SUIT_SYMBOLS, MOBILE_BREAKPOINT } from "../../utils/constants";
import { Suit } from "../../types/game";
import { useIsMobile } from "../../hooks/use-is-mobile";

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
  const isMobile = useIsMobile();
  
  // Control rendering based on game phase
  const renderHalfQuoteControls = () => {
    if (state.currentPhase === "half_quote_decision" && isPlayerTurn) {
      return (
        <div className="flex flex-col space-y-3">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-center`}>Half Quote Decision</h3>
          <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded-md mb-2">
            <p className="text-xs md:text-sm text-center">
              Declaring Half Quote means your team must win <strong>all 8 tricks</strong> to score 3 points!
            </p>
          </div>
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row space-x-3'}`}>
            <Button 
              onClick={declareHalfQuote} 
              className="bg-green-600 hover:bg-green-700 transition-all"
              size={isMobile ? "sm" : "default"}
            >
              Declare Half Quote
            </Button>
            <Button 
              onClick={passHalfQuote} 
              variant="outline"
              size={isMobile ? "sm" : "default"}
            >
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
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-center`}>
            Trump Declaration
          </h3>
          <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-md mb-2">
            <p className="text-xs md:text-sm text-center">
              Select a trump suit. Trump cards will beat any other suit in a trick.
            </p>
          </div>
          <div className="flex space-x-3 justify-center">
            {(["hearts", "diamonds", "clubs", "spades"] as Suit[]).map(suit => (
              <Button
                key={suit}
                onClick={() => declareTrump(suit)}
                className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-xl ${
                  suit === "hearts" || suit === "diamonds" 
                    ? "text-red-600 hover:bg-red-50" 
                    : "text-black hover:bg-gray-50"
                } transition-all`}
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
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-center`}>
              Full Quote Decision
            </h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-xs md:text-sm text-center">
                Your team declared trump, so you cannot declare Full Quote.
              </p>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex flex-col space-y-3">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-center`}>
            Full Quote Decision
          </h3>
          <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded-md mb-2">
            <p className="text-xs md:text-sm text-center">
              Declaring Full Quote allows you to exchange cards with your teammate. 
              You must win <strong>all 8 tricks</strong> to score 3 points!
            </p>
          </div>
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row space-x-3'}`}>
            <Button 
              onClick={declareFullQuote} 
              className="bg-green-600 hover:bg-green-700 transition-all"
              size={isMobile ? "sm" : "default"}
            >
              Declare Full Quote
            </Button>
            <Button 
              onClick={passFullQuote} 
              variant="outline"
              size={isMobile ? "sm" : "default"}
            >
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
      // Extract round result information
      const lastRound = state.roundHistory[state.roundHistory.length - 1];
      const winningTeam = lastRound ? lastRound.winner : null;
      const wasYourTeamWinner = winningTeam === "team1";
      
      return (
        <div className="flex flex-col space-y-3">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-center`}>
            Round Complete
          </h3>
          
          <div className={`p-3 rounded-md text-center ${
            wasYourTeamWinner 
              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" 
              : "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100"
          }`}>
            <p className="text-sm md:text-base font-medium">
              {wasYourTeamWinner ? "Your team won this round!" : "Opponent team won this round!"}
            </p>
            {lastRound && (
              <div className="text-xs mt-1">
                {lastRound.wasKapoothi && <span>Kapoothi! </span>}
                {lastRound.wasQuote && <span>Quote succeeded! </span>}
                <span>+{lastRound.points} points</span>
              </div>
            )}
          </div>
          
          <div className="text-center font-semibold text-sm mt-2">
            Score: You {state.scores.team1} - {state.scores.team2} Opponents
          </div>
          
          <Button 
            onClick={startNewRound} 
            className="bg-primary hover:bg-primary/90 w-full mt-2"
            size={isMobile ? "sm" : "default"}
          >
            Start New Round
          </Button>
        </div>
      );
    }
    return null;
  };
  
  // Display current game message
  const renderGameMessage = () => {
    // Only show in trick play and trick result phases
    if (state.currentPhase !== "trick_play" && state.currentPhase !== "trick_result") {
      return null;
    }

    const isWaitingForAI = !isPlayerTurn && state.currentPhase === "trick_play";

    return (
      <div className="game-message my-3">
        <div className={`
          p-2 rounded-md text-center text-sm
          ${isWaitingForAI ? "bg-blue-50 dark:bg-blue-950 animate-pulse" : "bg-gray-50 dark:bg-gray-900"}
        `}>
          {state.message}
        </div>
      </div>
    );
  };

  return (
    <div className={`game-controls ${isMobile ? 'p-3' : 'p-4'} bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all ${className || ""}`}>
      {renderGameMessage()}
      {renderHalfQuoteControls()}
      {renderTrumpControls()}
      {renderFullQuoteControls()}
      {renderRoundEndControls()}
      
      {/* Card exchange info */}
      {state.currentPhase === "card_exchange" && (
        <div className="mt-3 text-center text-sm">
          <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-md">
            <p>Select two cards from your hand to exchange with your teammate.</p>
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">
              Exchange good cards to help your team win all tricks!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
