import { FC } from "react";
import { useGame } from "../../context/GameContext";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Trophy } from "lucide-react";

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
  const isTied = team1Tricks === team2Tricks;
  
  const isGamePhase = state.currentPhase === "trick_play" || 
                      state.currentPhase === "trick_result";

  return (
    <Card className={`${className || ""} p-3 border-2 ${isGamePhase ? 'border-blue-300' : 'border-gray-200'}`}>
      <div className="text-sm font-semibold mb-2 flex items-center justify-between">
        <span>Trick Summary</span>
        <Badge variant="outline" className={isGamePhase ? "bg-blue-50" : ""}>
          {team1Tricks + team2Tricks} of {tricksRequired} played
        </Badge>
      </div>
      
      {/* Team 1 (Your Team) */}
      <div className="mb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-medium text-blue-700">Your Team</span>
            {team1Winning && <Trophy className="h-4 w-4 ml-1 text-yellow-500" />}
          </div>
          <span className="font-bold">{team1Tricks}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${team1Progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Team 2 (Opponent Team) */}
      <div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-medium text-red-700">Opponent Team</span>
            {team2Winning && <Trophy className="h-4 w-4 ml-1 text-yellow-500" />}
          </div>
          <span className="font-bold">{team2Tricks}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
          <div 
            className="bg-red-600 h-2.5 rounded-full" 
            style={{ width: `${team2Progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Status message */}
      {(team1Tricks > 0 || team2Tricks > 0) && (
        <div className="mt-2 text-xs text-center font-medium">
          {isTied ? (
            <span className="text-gray-600">Teams are tied</span>
          ) : team1Winning ? (
            <span className="text-blue-600">Your team is leading</span>
          ) : (
            <span className="text-red-600">Opponent team is leading</span>
          )}
        </div>
      )}
    </Card>
  );
};