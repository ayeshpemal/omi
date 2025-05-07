import { GameProvider } from "./context/GameContext";
import { GameBoard } from "./components/Game/GameBoard";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import "@fontsource/inter";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <GameBoard />
      </GameProvider>
    </QueryClientProvider>
  );
}

export default App;
