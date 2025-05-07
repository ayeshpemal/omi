export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number; // Numeric value for comparison
}

export type PlayerId = "player" | "bot1" | "bot2" | "bot3";

export interface Player {
  id: PlayerId;
  name: string;
  hand: Card[];
  isHuman: boolean;
  team: "team1" | "team2";
}

export type GamePhase = 
  | "deal" 
  | "half_quote_decision" 
  | "trump_declaration" 
  | "full_quote_decision" 
  | "card_exchange" 
  | "trick_play" 
  | "trick_result"
  | "round_end";

export type QuoteType = "none" | "half" | "full";

export interface Trick {
  cards: { playerId: PlayerId; card: Card }[];
  leadSuit: Suit | null;
  winner: PlayerId | null;
}

export interface GameState {
  players: Record<PlayerId, Player>;
  playerOrder: PlayerId[]; // Current player order
  currentPlayerIndex: number;
  currentPhase: GamePhase;
  deck: Card[];
  trump: Suit | null;
  trumpDecider: PlayerId | null;
  quoteType: QuoteType;
  quotePlayer: PlayerId | null;
  currentTrick: Trick;
  completedTricks: Trick[];
  scores: Record<"team1" | "team2", number>;
  roundHistory: {
    winner: "team1" | "team2";
    points: number;
    wasKapoothi: boolean;
    wasQuote: boolean;
  }[];
  halfQuotePossible: boolean;
  fullQuotePossible: boolean;
  exchangedCards: Record<PlayerId, Card[]>;
  message: string;
}

export type GameAction = 
  | { type: "DEAL_INITIAL_CARDS" }
  | { type: "DECLARE_HALF_QUOTE", playerId: PlayerId }
  | { type: "PASS_HALF_QUOTE", playerId: PlayerId }
  | { type: "DECLARE_TRUMP", playerId: PlayerId, suit: Suit }
  | { type: "DEAL_REMAINING_CARDS" }
  | { type: "DECLARE_FULL_QUOTE", playerId: PlayerId }
  | { type: "PASS_FULL_QUOTE", playerId: PlayerId }
  | { type: "EXCHANGE_CARDS", fromPlayer: PlayerId, toPlayer: PlayerId, cards: Card[] }
  | { type: "PLAY_CARD", playerId: PlayerId, card: Card }
  | { type: "COMPLETE_TRICK" }
  | { type: "END_ROUND" }
  | { type: "START_NEW_ROUND" };
