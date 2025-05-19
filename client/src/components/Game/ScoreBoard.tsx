import { FC, useState } from "react";
import { useGame } from "../../context/GameContext";
import { Card } from "../ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Star, AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

interface ScoreBoardProps {
  className?: string;
}

export const ScoreBoard: FC<ScoreBoardProps> = ({ className }) => {
  const { state } = useGame();
  const { scores, roundHistory } = state;
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Calculate the winning threshold (typically 500 points)
  const WINNING_THRESHOLD = 500;
  const yourProgress = (scores.team1 / WINNING_THRESHOLD) * 100;
  const opponentProgress = (scores.team2 / WINNING_THRESHOLD) * 100;
  
  return (
    <Card className={`${className || ""} p-4 overflow-hidden`}>
      <div className="text-lg font-bold mb-3 text-center">Score</div>
      
      <div className="flex justify-around items-center mb-4">
        <div className="text-center">
          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Your Team</div>
          <motion.div 
            key={scores.team1}
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.2, 1],
              transition: { duration: 0.5 }
            }}
            className="text-3xl font-bold"
          >
            {scores.team1}
          </motion.div>
        </div>
        
        <div className="text-xl font-bold text-gray-400">vs</div>
        
        <div className="text-center">
          <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Opponent Team</div>
          <motion.div 
            key={scores.team2}
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.2, 1],
              transition: { duration: 0.5 }
            }}
            className="text-3xl font-bold"
          >
            {scores.team2}
          </motion.div>
        </div>
      </div>
      
      {/* Progress bars to winning */}
      <div className="space-y-2 mb-3">
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(yourProgress, 100)}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full bg-blue-500 rounded-full"
          />
        </div>
        
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(opponentProgress, 100)}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full bg-red-500 rounded-full"
          />
        </div>
      </div>
      
      {/* Goal indicator */}
      <div className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">
        First team to reach {WINNING_THRESHOLD} points wins
      </div>
      
      {/* Round history */}
      {roundHistory.length > 0 && (
        <Collapsible
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800"
        >
          <CollapsibleTrigger className="flex items-center justify-center w-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            Round History {isHistoryOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
            <AnimatePresence>
              {roundHistory.map((round, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-xs p-2 rounded-md ${
                    round.winner === "team1" 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500" 
                      : "bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">
                      Round {index + 1}: {round.winner === "team1" ? "Your team" : "Opponent team"} won
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      +{round.points} pts
                    </Badge>
                  </div>
                  
                  <div className="mt-1 flex flex-wrap gap-1">
                    {round.wasQuote && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 hover:bg-purple-100 dark:hover:bg-purple-900">
                        <Star className="h-3 w-3 mr-1" /> Quote
                      </Badge>
                    )}
                    {round.wasKapoothi && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Kapoothi
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
};
