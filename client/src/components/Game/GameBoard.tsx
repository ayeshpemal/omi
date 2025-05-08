import { FC, useEffect, useState } from "react";
import { AIPlayer } from "./AIPlayer";
import { PlayerHand } from "./PlayerHand";
import { PlayArea } from "./PlayArea";
import { ScoreBoard } from "./ScoreBoard";
import { GameControls } from "./GameControls";
import { GameInfo } from "./GameInfo";
import { TrickSummary } from "./TrickSummary";
import { CardExchange } from "./CardExchange";
import { useAudio } from "../../lib/stores/useAudio";
import { useGame } from "../../context/GameContext";
import { useIsMobile } from "../../hooks/use-is-mobile";

export const GameBoard: FC = () => {
  const { state } = useGame();
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();
  const isMobile = useIsMobile();
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Track window dimensions for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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

  // Determine layout based on screen size
  const isCompactLayout = isMobile || windowHeight < 700 || windowWidth < 900;
  const isVeryNarrow = windowWidth < 600;

  // Determine which phases need the game controls to be visible
  const shouldShowControls = (phase: string): boolean => {
    if (!isCompactLayout) return true; // Always show on regular layout
    
    // These phases need controls to be visible even in compact layout
    const phasesWithControls = [
      "half_quote_decision", 
      "trump_declaration", 
      "full_quote_decision",
      "round_end"
    ];
    
    return phasesWithControls.includes(phase);
  };

  // Special classes for when we're in Half Quote decision phase to ensure cards remain visible
  const playerHandClasses = state.currentPhase === "half_quote_decision" 
    ? `mt-2 md:mt-4 ${isCompactLayout ? 'pb-2' : ''} z-30`
    : `mt-2 md:mt-4 ${isCompactLayout ? 'pb-2' : ''}`;

  return (
    <div className="game-board h-screen flex flex-col bg-gradient-to-b from-gray-100 to-gray-200 p-2 md:p-4 overflow-hidden">
      {/* Game info and message */}
      <GameInfo className="mb-2 md:mb-4" />
      
      {/* Main game area */}
      <div className={`flex flex-1 ${isCompactLayout ? 'flex-col-reverse' : 'flex-row'} gap-2 md:gap-4 relative overflow-hidden`}>
        {/* Left sidebar - changes to top bar in compact layout */}
        <div className={`
          ${isCompactLayout ? 'w-full h-auto' : isVeryNarrow ? 'w-48' : 'w-64'} 
          flex ${isCompactLayout ? 'flex-row justify-around' : 'flex-col'} 
          gap-2 md:gap-4 relative
        `}>
          <ScoreBoard className={`flex-none ${isCompactLayout ? 'w-[48%]' : 'w-full'}`} />
          
          {/* Trick Summary - Always visible */}
          <TrickSummary className={`flex-none ${isCompactLayout ? 'w-[48%]' : 'w-full'}`} />
        </div>
        
        {/* Central game area */}
        <div className="flex-1 relative bg-green-50 rounded-lg shadow-inner overflow-hidden min-h-[200px]">
          {/* Card exchange UI during that phase */}
          {state.currentPhase === "card_exchange" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
              <CardExchange />
            </div>
          )}
          
          {/* AI Players with responsive positioning */}
          <AIPlayer 
            playerId="bot1" 
            position={isCompactLayout ? "bottom-left" : "left"} 
            className={isCompactLayout ? "scale-75 origin-bottom-left" : ""}
          />
          <AIPlayer 
            playerId="bot2" 
            position="top" 
            className={isCompactLayout ? "scale-75 origin-top" : ""}
          />
          <AIPlayer 
            playerId="bot3" 
            position={isCompactLayout ? "bottom-right" : "right"} 
            className={isCompactLayout ? "scale-75 origin-bottom-right" : ""}
          />
          
          {/* Play area with padding for AI players */}
          <PlayArea className="absolute inset-4 md:inset-8" />
        </div>
      </div>
      
      {/* Game controls - Floating position that doesn't overlap with cards */}
      {shouldShowControls(state.currentPhase) && (
        <GameControls 
          className={`
            ${state.currentPhase === "half_quote_decision" 
              ? 'absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50' 
              : 'absolute bottom-[calc(15%+85px)] right-4 z-50'}
            max-w-sm shadow-xl
            ${state.currentPhase === "half_quote_decision" ? 'bg-amber-50 border-2 border-amber-200' : ''}
          `} 
        />
      )}
      
      {/* Player's hand - Ensure it's visible during Half Quote decision */}
      <PlayerHand className={playerHandClasses} />
    </div>
  );
};
