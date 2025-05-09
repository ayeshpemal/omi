import React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { useGame } from "../../context/GameContext";
import { RulesDialog } from "./RulesDialog";

export const HomePage: React.FC = () => {
  const { startGame, updateSettings, state } = useGame();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">OMI</h1>
        <p className="text-slate-300">Sri Lankan Card Game</p>
      </div>
      
      <Card className="max-w-md w-full p-6 bg-slate-800 border-slate-700">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white text-center mb-6">Game Settings</h2>
          
          <div className="space-y-4">
            {/* Half Quote Toggle */}
            <div className="flex items-center justify-between space-x-4">
              <Label htmlFor="botHalfQuote" className="text-white">
                AI Can Initiate Half Quote
              </Label>
              <button
                id="botHalfQuote"
                role="switch"
                aria-checked={state.settings.botCanInitiateHalfQuote}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  state.settings.botCanInitiateHalfQuote ? "bg-indigo-600" : "bg-gray-500"
                }`}
                onClick={() => updateSettings({ botCanInitiateHalfQuote: !state.settings.botCanInitiateHalfQuote })}
              >
                <span
                  className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    state.settings.botCanInitiateHalfQuote ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            
            {/* Full Quote Toggle */}
            <div className="flex items-center justify-between space-x-4">
              <Label htmlFor="botFullQuote" className="text-white">
                AI Can Initiate Full Quote
              </Label>
              <button
                id="botFullQuote"
                role="switch"
                aria-checked={state.settings.botCanInitiateFullQuote}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  state.settings.botCanInitiateFullQuote ? "bg-indigo-600" : "bg-gray-500"
                }`}
                onClick={() => updateSettings({ botCanInitiateFullQuote: !state.settings.botCanInitiateFullQuote })}
              >
                <span
                  className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    state.settings.botCanInitiateFullQuote ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
          
          <div className="space-y-4 pt-4">
            <RulesDialog />
            
            <Button 
              onClick={startGame} 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              Start Game
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};