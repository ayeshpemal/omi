import { FC } from "react";
import { useGame } from "../../context/GameContext";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Info, AlertCircle, TrendingUp, Crown, Repeat, ArrowRight, Award } from "lucide-react";
import { motion } from "framer-motion";
import { SUIT_SYMBOLS } from "../../utils/constants";

interface GameInfoProps {
  className?: string;
}

export const GameInfo: FC<GameInfoProps> = ({ className }) => {
  const { state } = useGame();
  
  // Determine appropriate alert variant and icon based on game phase
  let icon = <Info className="h-5 w-5" />;
  let variant: "default" | "destructive" | undefined = "default";
  
  if (state.currentPhase === "round_end") {
    const lastRound = state.roundHistory[state.roundHistory.length - 1];
    variant = lastRound?.winner === "team1" ? "default" : "destructive";
    icon = lastRound?.winner === "team1" ? <Award className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />;
  } else if (state.currentPhase === "half_quote_decision") {
    icon = <TrendingUp className="h-5 w-5" />;
  } else if (state.currentPhase === "trump_declaration") {
    icon = <Crown className="h-5 w-5" />;
  } else if (state.currentPhase === "full_quote_decision") {
    icon = <TrendingUp className="h-5 w-5" />;
  } else if (state.currentPhase === "card_exchange") {
    icon = <Repeat className="h-5 w-5" />;
  } else if (state.currentPhase === "trick_play" || state.currentPhase === "trick_result") {
    icon = <ArrowRight className="h-5 w-5" />;
  }
  
  // Custom styling based on phase
  const getCustomStyle = () => {
    switch (state.currentPhase) {
      case "half_quote_decision":
        return "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800/50";
      case "trump_declaration":
        return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50";
      case "full_quote_decision":
        return "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/50";
      case "card_exchange":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50";
      case "trick_play":
      case "trick_result":
        return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50";
      case "round_end":
        return variant === "destructive" 
          ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50" 
          : "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/50";
      default:
        return "";
    }
  };

  // Get a descriptive text for the current phase
  const getPhaseDescription = () => {
    switch (state.currentPhase) {
      case "half_quote_decision":
        return "Decide if you want to declare Half Quote";
      case "trump_declaration":
        return "Choose a trump suit";
      case "full_quote_decision":
        return "Decide if you want to declare Full Quote";
      case "card_exchange":
        return "Exchange cards with your teammate";
      case "trick_play":
        return "Play your cards in turn";
      case "trick_result":
        return "Trick result";
      case "round_end":
        return "Round complete!";
      default:
        return "";
    }
  };

  // Format the message with trump suit symbol if applicable
  const formatMessage = (message: string) => {
    if (state.trump && message.includes("trump")) {
      const trumpSymbol = SUIT_SYMBOLS[state.trump];
      return message.replace(/trump/gi, `trump (${trumpSymbol})`);
    }
    return message;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert 
        variant={variant} 
        className={`${className || ""} ${getCustomStyle()} transition-colors duration-300 border shadow-sm`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <AlertTitle className="font-semibold text-base">
            {state.currentPhase === "half_quote_decision" && "Half Quote Phase"}
            {state.currentPhase === "trump_declaration" && "Trump Declaration Phase"}
            {state.currentPhase === "full_quote_decision" && "Full Quote Phase"}
            {state.currentPhase === "card_exchange" && "Card Exchange Phase"}
            {state.currentPhase === "trick_play" && "Trick Play Phase"}
            {state.currentPhase === "trick_result" && "Trick Result"}
            {state.currentPhase === "round_end" && "Round Complete"}
          </AlertTitle>
        </div>
        <AlertDescription className="mt-2 flex flex-col gap-1">
          <span className="text-sm opacity-80">{getPhaseDescription()}</span>
          <span className="text-sm font-medium">{formatMessage(state.message)}</span>
          
          {/* Display active trump if one is set */}
          {state.trump && state.currentPhase !== "trump_declaration" && (
            <div className="mt-1 text-xs font-medium bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded inline-flex items-center self-start">
              <span className="mr-1">Trump:</span>
              <span className="text-base">{SUIT_SYMBOLS[state.trump]}</span>
              <span className="ml-1 capitalize">{state.trump}</span>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};
