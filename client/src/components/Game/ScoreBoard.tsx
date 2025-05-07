import { FC } from "react";
import { useGame } from "../../context/GameContext";

interface ScoreBoardProps {
  className?: string;
}

export const ScoreBoard: FC<ScoreBoardProps> = ({ className }) => {
  const { state } = useGame();
  const { scores, roundHistory } = state;
  
  return (
    <div className={`score-board rounded-lg bg-white shadow p-4 ${className || ""}`}>
      <div className="text-xl font-bold mb-4 text-center">Score</div>
      
      <div className="flex justify-around items-center mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">Your Team</div>
          <div className="text-3xl font-bold">{scores.team1}</div>
        </div>
        
        <div className="text-xl font-bold">vs</div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">Opponent Team</div>
          <div className="text-3xl font-bold">{scores.team2}</div>
        </div>
      </div>
      
      {roundHistory.length > 0 && (
        <div className="mt-4">
          <div className="text-lg font-semibold mb-2">History</div>
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Round</th>
                  <th className="text-left py-1">Winner</th>
                  <th className="text-right py-1">Points</th>
                  <th className="text-right py-1">Notes</th>
                </tr>
              </thead>
              <tbody>
                {roundHistory.map((round, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-1">{index + 1}</td>
                    <td className={`py-1 ${round.winner === "team1" ? "text-blue-600" : "text-red-600"}`}>
                      {round.winner === "team1" ? "Your Team" : "Opponent Team"}
                    </td>
                    <td className="text-right py-1">+{round.points}</td>
                    <td className="text-right py-1 text-xs">
                      {round.wasKapoothi && "Kapoothi"}
                      {round.wasQuote && !round.wasKapoothi && "Quote"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
