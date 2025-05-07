import { FC } from "react";
import { useGame } from "../../context/GameContext";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Info, AlertCircle } from "lucide-react";

interface GameInfoProps {
  className?: string;
}

export const GameInfo: FC<GameInfoProps> = ({ className }) => {
  const { state } = useGame();
  
  // Determine appropriate alert variant based on game phase
  let icon = <Info className="h-4 w-4" />;
  let variant: "default" | "destructive" | undefined = "default";
  
  if (state.currentPhase === "round_end") {
    icon = <AlertCircle className="h-4 w-4" />;
    const lastRound = state.roundHistory[state.roundHistory.length - 1];
    variant = lastRound?.winner === "team1" ? "default" : "destructive";
  }
  
  // Custom styling based on phase
  const customStyle = state.currentPhase === "trick_play" 
    ? "bg-blue-50 border-blue-200" 
    : state.currentPhase === "round_end"
      ? variant === "destructive" 
        ? "bg-red-50 border-red-200" 
        : "bg-green-50 border-green-200"
      : "";
  
  return (
    <Alert 
      variant={variant} 
      className={`${className || ""} ${customStyle}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <AlertTitle>
          {state.currentPhase === "half_quote_decision" && "Half Quote Phase"}
          {state.currentPhase === "trump_declaration" && "Trump Declaration Phase"}
          {state.currentPhase === "full_quote_decision" && "Full Quote Phase"}
          {state.currentPhase === "card_exchange" && "Card Exchange Phase"}
          {state.currentPhase === "trick_play" && "Trick Play Phase"}
          {state.currentPhase === "round_end" && "Round Complete"}
        </AlertTitle>
      </div>
      <AlertDescription className="mt-2">
        {state.message}
      </AlertDescription>
    </Alert>
  );
};
