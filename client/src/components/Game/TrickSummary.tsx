import { FC } from "react";
import { useGame } from "../../context/GameContext";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Trophy, Target } from "lucide-react";
import { motion } from "framer-motion";

interface TrickSummaryProps {
  className?: string;
}

export const TrickSummary: FC<TrickSummaryProps> = ({ className }) => {
  const { state } = useGame();
  
  // Get trick summary data
  const { team1Tricks, team2Tricks, tricksRequired } = state.trickSummary;
  
  // Calculate progress percentages for the progress bars
  const team1Progress = (team1Tricks / tricksRequired) * 100;
  const team2Progress = (team2Tricks / tricksRequired) * 100;
  
  // Determine which team is winning
  const team1Winning = team1Tricks > team2Tricks;
  const team2Winning = team2Tricks > team1Tricks;
  const isTied = team1Tricks === team2Tricks && team1Tricks > 0;
  
  // Calculate tricks remaining
  const tricksRemaining = tricksRequired - team1Tricks - team2Tricks;
  
  return (
    <Card className={`${className || ""} p-4 overflow-hidden`}>
      <div className="text-lg font-semibold mb-3 flex items-center justify-between">
        <span>Current Tricks</span>
        {tricksRemaining > 0 && (
          <Badge variant="outline" className="font-normal">
            {tricksRemaining} remaining
          </Badge>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Your team */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Your Team</span>
              {team1Winning && <Trophy className="h-4 w-4 text-yellow-500 ml-1" />}
            </div>
            <Badge variant="secondary" className="font-bold">
              {team1Tricks}/{tricksRequired}
            </Badge>
          </div>
          
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${team1Progress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className={`h-full ${team1Winning ? 'bg-blue-500' : 'bg-blue-400'} rounded-full`}
            />
          </div>
        </div>
        
        {/* Opponent team */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Opponent Team</span>
              {team2Winning && <Trophy className="h-4 w-4 text-yellow-500 ml-1" />}
            </div>
            <Badge variant="secondary" className="font-bold">
              {team2Tricks}/{tricksRequired}
            </Badge>
          </div>
          
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${team2Progress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className={`h-full ${team2Winning ? 'bg-red-500' : 'bg-red-400'} rounded-full`}
            />
          </div>
        </div>
      </div>
      
      {/* Current status */}
      {state.currentPhase !== "round_end" && (
        <div className="mt-4 text-center">
          {team1Winning && (
            <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">
              Your team is leading by {team1Tricks - team2Tricks} {(team1Tricks - team2Tricks) === 1 ? 'trick' : 'tricks'}
            </div>
          )}
          {team2Winning && (
            <div className="text-xs text-red-700 dark:text-red-400 font-medium">
              Opponent team is leading by {team2Tricks - team1Tricks} {(team2Tricks - team1Tricks) === 1 ? 'trick' : 'tricks'}
            </div>
          )}
          {isTied && (
            <div className="text-xs text-gray-700 dark:text-gray-400 font-medium flex items-center justify-center">
              <Target className="h-3 w-3 mr-1" />
              Teams are tied at {team1Tricks} {team1Tricks === 1 ? 'trick' : 'tricks'} each
            </div>
          )}
        </div>
      )}
      
      {/* Quote information when applicable */}
      {state.quoteType !== "none" && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-center">
            <span className="font-medium">
              {state.quoteType === "half" ? "Half Quote" : "Full Quote"} by {state.players[state.quotePlayer || "player"].name}
            </span>
            <span className="block mt-1 text-gray-500 dark:text-gray-400">
              {state.quoteType === "half" 
                ? "Need to win at least half the tricks" 
                : "Need to win all the tricks"}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};