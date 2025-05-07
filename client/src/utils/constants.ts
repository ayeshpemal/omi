import { Rank, Suit } from "../types/game";

// Card values for comparison
export const CARD_VALUES: Record<Rank, number> = {
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  "J": 11,
  "Q": 12,
  "K": 13,
  "A": 14,
};

// Suit properties
export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: "#E31B23",
  diamonds: "#E31B23",
  clubs: "#000000",
  spades: "#000000",
};

// Game constants
export const CARDS_PER_PLAYER = 8;
export const TOTAL_TRICKS_PER_ROUND = 8;
export const INITIAL_DEAL_COUNT = 4;
export const EXCHANGE_CARD_COUNT = 2;

// Points
export const REGULAR_WIN_POINTS = 1;
export const KAPOOTHI_POINTS = 3;
export const QUOTE_POINTS = 3;

// AI delay to simulate thinking
export const AI_THINKING_DELAY = 1000;
export const AI_CARD_PLAY_DELAY = 500;
export const TRICK_RESULT_DELAY = 2000; // Delay before clearing trick cards

// Card dimensions
export const CARD_WIDTH = 120;
export const CARD_HEIGHT = 168;

// Responsive breakpoints
export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;
