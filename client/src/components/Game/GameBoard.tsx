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
import { Volume2, VolumeX } from "lucide-react";
import { DarkModeToggle } from "../ui/dark-mode-toggle";
import { RulesDialog } from "./RulesDialog";
import Confetti from 'react-confetti';

export const GameBoard: FC = () => {
  const { state } = useGame();
  const { setBackgroundMusic, setHitSound, setSuccessSound, isMuted, toggleMute } = useAudio();
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
    <div className="game-board h-screen grid grid-rows-[auto,1fr,auto] grid-cols-1 md:grid-cols-[200px,1fr] lg:grid-cols-[200px,1fr,200px] gap-2 md:gap-4 bg-gradient-to-b from-gray-100 to-gray-200 p-2 md:p-4 overflow-hidden">
      {/* Celebrate round end with confetti */}
      {state.currentPhase === 'round_end' && (
        <Confetti
          width={windowWidth}
          height={windowHeight}
          recycle={false}
          numberOfPieces={300}
        />
      )}

      {/* Header with audio toggle */}
      <header className="row-start-1 col-span-full flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <GameInfo className="w-full md:w-auto" />
          <DarkModeToggle />
          <RulesDialog />
        </div>
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          className="ml-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {isMuted ? <VolumeX className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                   : <Volume2 className="h-6 w-6 text-gray-600 dark:text-gray-300" />}
        </button>
      </header>

      {/* Sidebar with score and tricks */}
      <aside className="row-start-2 col-start-1 flex flex-col gap-2">
        <ScoreBoard className="w-full" />
        <TrickSummary className="w-full" />
      </aside>

      {/* Main play area */}
      <main className="row-start-2 col-start-2 relative bg-green-50 rounded-lg shadow-inner overflow-hidden flex items-center justify-center">
        {state.currentPhase === "card_exchange" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
            <CardExchange />
          </div>
        )}
        <PlayArea className="w-full h-full p-4" />
        <AIPlayer playerId="bot1" position="left" className="absolute left-2 top-1/2 -translate-y-1/2" />
        <AIPlayer playerId="bot2" position="top" className="absolute top-2 left-1/2 -translate-x-1/2" />
        <AIPlayer playerId="bot3" position="right" className="absolute right-2 top-1/2 -translate-y-1/2" />
      </main>

      {/* Controls section for large screens */}
      <section className="hidden lg:block row-start-2 col-start-3 relative">
        {shouldShowControls(state.currentPhase) && (
          <GameControls className="sticky top-4 p-2 bg-white bg-opacity-80 rounded-lg shadow-md" />
        )}
      </section>

      {/* Footer with controls and player hand for mobile/small */}
      <footer className="row-start-3 col-span-full flex flex-col md:flex-row items-center justify-between gap-2">
        {shouldShowControls(state.currentPhase) && (
          <GameControls className="w-full md:w-auto p-2 bg-white bg-opacity-80 rounded-lg shadow-md" />
        )}
        <PlayerHand className="w-full md:w-auto" />
      </footer>
    </div>
  );
};
