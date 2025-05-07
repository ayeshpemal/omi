import { FC, useEffect } from "react";
import { AIPlayer } from "./AIPlayer";
import { PlayerHand } from "./PlayerHand";
import { PlayArea } from "./PlayArea";
import { ScoreBoard } from "./ScoreBoard";
import { GameControls } from "./GameControls";
import { GameInfo } from "./GameInfo";
import { CardExchange } from "./CardExchange";
import { useAudio } from "../../lib/stores/useAudio";
import { useGame } from "../../context/GameContext";

export const GameBoard: FC = () => {
  const { state } = useGame();
  
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();
  
  // Set up audio elements
  useEffect(() => {
    // Create audio elements
    const bgMusic = new Audio(); 
    const hitSound = new Audio('/sounds/hit.mp3');
    const successSound = new Audio('/sounds/success.mp3');
    
    // Set up background music loop
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    
    // Store in context
    setHitSound(hitSound);
    setSuccessSound(successSound);
    setBackgroundMusic(bgMusic);
    
    return () => {
      // Clean up
      bgMusic.pause();
      hitSound.pause();
      successSound.pause();
    };
  }, []);

  return (
    <div className="game-board h-screen flex flex-col bg-gradient-to-b from-gray-100 to-gray-200 p-4">
      {/* Game info and message */}
      <GameInfo className="mb-4" />
      
      {/* Main game area */}
      <div className="flex flex-1 gap-4 relative">
        {/* Left sidebar */}
        <div className="w-64 flex flex-col gap-4">
          <ScoreBoard className="flex-none" />
          
          {/* Game controls */}
          <GameControls className="flex-none" />
        </div>
        
        {/* Central game area */}
        <div className="flex-1 relative bg-green-50 rounded-lg shadow-inner overflow-hidden">
          {/* Card exchange UI during that phase */}
          {state.currentPhase === "card_exchange" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
              <CardExchange />
            </div>
          )}
          
          {/* AI Players */}
          <AIPlayer playerId="bot1" position="left" />
          <AIPlayer playerId="bot2" position="top" />
          <AIPlayer playerId="bot3" position="right" />
          
          {/* Play area */}
          <PlayArea className="absolute inset-0" />
        </div>
      </div>
      
      {/* Player's hand */}
      <PlayerHand className="mt-4" />
    </div>
  );
};
