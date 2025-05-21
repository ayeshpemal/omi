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
import { Volume2, VolumeX, HelpCircle } from "lucide-react";
import { Button } from "../ui/button";
import { DarkModeToggle } from "../ui/dark-mode-toggle";
import { RulesDialog } from "./RulesDialog";
import Confetti from 'react-confetti';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { HomePage } from "./HomePage";

export const GameBoard: FC = () => {
  const { state, isPlayerTurn, isAiThinking } = useGame();
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
    const bgMusic = new Audio('/sounds/background.mp3'); 
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

  // If the game hasn't started, show the home page
  if (!state.settings.gameStarted) {
    return <HomePage />;
  }

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

  // Get current game phase for styling
  const getGamePhaseBackgroundColor = (): string => {
    switch(state.currentPhase) {
      case "half_quote_decision":
        return "from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-gray-900";
      case "trump_declaration":
        return "from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-gray-900";
      case "full_quote_decision":
        return "from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-gray-900";
      case "card_exchange":
        return "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-gray-900";
      case "trick_play":
      case "trick_result":
        return "from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-gray-900";
      case "round_end":
        return "from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-gray-900";
      default:
        return "from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800";
    }
  };

  return (
    <div 
      className={`game-board h-screen grid grid-rows-[auto,1fr,auto] grid-cols-1 md:grid-cols-[200px,1fr] lg:grid-cols-[230px,1fr,230px] gap-2 md:gap-3 bg-gradient-to-b ${getGamePhaseBackgroundColor()} p-2 overflow-hidden transition-colors duration-500`}
    >
      {/* Celebrate round end with confetti */}
      {state.currentPhase === 'round_end' && (
        <Confetti
          width={windowWidth}
          height={windowHeight}
          recycle={false}
          numberOfPieces={300}
        />
      )}

      {/* Header with game info and audio controls */}
      <header className="row-start-1 col-span-full flex justify-between items-center py-1 px-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <GameInfo className="w-full md:w-auto" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block">
                  <DarkModeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle dark mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block">
                  <RulesDialog>
                    <Button variant="ghost" size="icon" aria-label="View game rules">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </RulesDialog>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Game rules</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                className="ml-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                {isMuted ? <VolumeX className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                         : <Volume2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isMuted ? "Unmute audio" : "Mute audio"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {/* Sidebar with score and tricks */}
      <aside className="row-start-2 col-start-1 hidden md:flex flex-col gap-2 h-full overflow-y-auto">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ScoreBoard className="w-full" />
          </motion.div>
        </AnimatePresence>
        
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <TrickSummary className="w-full" />
          </motion.div>
        </AnimatePresence>
      </aside>

      {/* Main play area */}
      <main className={`row-start-2 col-start-1 md:col-start-2 relative ${state.currentPhase === "trick_play" || state.currentPhase === "trick_result" ? "bg-green-100" : "bg-amber-50"} rounded-lg shadow-inner overflow-hidden flex items-center justify-center transition-colors duration-500`}>
        {/* Card exchange overlay */}
        <AnimatePresence>
          {state.currentPhase === "card_exchange" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm z-10"
            >
              <CardExchange />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Player turn indicator overlay */}
        {isPlayerTurn && state.currentPhase === "trick_play" && (
          <div className="absolute inset-0 border-4 border-blue-400 border-opacity-50 rounded-lg animate-pulse z-0"></div>
        )}
        
        {/* AI thinking indicator */}
        {isAiThinking && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm z-50">
            Thinking...
          </div>
        )}
        
        <PlayArea className="w-full h-full p-4" />
        
        {/* AI Player components with position-based styling */}
        <AIPlayer 
          playerId="bot1" 
          position="left" 
          className={`absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-300 ${state.playerOrder[state.currentPlayerIndex] === "bot1" ? "scale-110 z-10" : ""}`} 
        />
        <AIPlayer 
          playerId="bot2" 
          position="top" 
          className={`absolute top-2 left-1/2 -translate-x-1/2 transition-all duration-300 ${state.playerOrder[state.currentPlayerIndex] === "bot2" ? "scale-110 z-10" : ""}`} 
        />
        <AIPlayer 
          playerId="bot3" 
          position="right" 
          className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-300 ${state.playerOrder[state.currentPlayerIndex] === "bot3" ? "scale-110 z-10" : ""}`} 
        />
      </main>

      {/* Controls section for large screens */}
      <section className="hidden lg:block row-start-2 col-start-3 relative h-full">
        {shouldShowControls(state.currentPhase) && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full max-h-full flex flex-col"
            >
              <GameControls className="sticky top-0 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md flex-1 overflow-y-auto" />
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Mobile scoreboard for small screens */}
      <div className="md:hidden row-start-3 col-span-full -mb-1 -mt-1">
        <details className="bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm">
          <summary className="p-1 text-sm font-medium cursor-pointer flex items-center justify-center">
            <span>Score & Tricks</span>
          </summary>
          <div className="p-2 grid grid-cols-2 gap-2">
            <ScoreBoard className="w-full" />
            <TrickSummary className="w-full" />
          </div>
        </details>
      </div>

      {/* Footer with controls and player hand */}
      <footer className={`row-start-3 md:row-start-3 col-span-full flex flex-col md:flex-row items-center justify-between gap-1 ${isPlayerTurn ? "bg-blue-50/50 dark:bg-blue-900/20 rounded-lg transition-colors duration-300" : ""}`}>
        {shouldShowControls(state.currentPhase) && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:hidden"
            >
              <GameControls className="w-full p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md" />
            </motion.div>
          </AnimatePresence>
        )}
        
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full ${isPlayerTurn && state.currentPhase === "trick_play" ? "ring-2 ring-blue-400 rounded-lg" : ""}`}
          >
            <PlayerHand className="w-full" />
          </motion.div>
        </AnimatePresence>
        
        {/* Version display */}
        <div className="absolute bottom-1 right-1 text-xs text-gray-500 dark:text-gray-400 opacity-70">
          v{state.version}
        </div>
      </footer>
    </div>
  );
};
