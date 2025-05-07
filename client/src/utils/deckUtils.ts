import { Card, Rank, Suit } from "../types/game";
import { CARD_VALUES } from "./constants";

// All suits in the game
const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

// All ranks from 7 to Ace
const RANKS: Rank[] = ["7", "8", "9", "10", "J", "Q", "K", "A"];

/**
 * Creates a 32-card deck with 7 to Ace in all suits
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        value: CARD_VALUES[rank],
      });
    }
  }

  return deck;
}

/**
 * Shuffles a deck of cards using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Deals a specific number of cards from the deck
 */
export function dealCards(deck: Card[], count: number): { dealt: Card[], remaining: Card[] } {
  const dealt = deck.slice(0, count);
  const remaining = deck.slice(count);
  
  return { dealt, remaining };
}

/**
 * Checks if a hand has cards that could win tricks (high cards)
 */
export function hasStrongHand(hand: Card[]): boolean {
  // Count aces and kings
  const highCards = hand.filter(card => card.rank === 'A' || card.rank === 'K');
  
  // Check if we have at least one ace
  const hasAce = hand.some(card => card.rank === 'A');
  
  return highCards.length >= 2 && hasAce;
}

/**
 * Get cards of a specific suit from a hand
 */
export function getCardsOfSuit(hand: Card[], suit: Suit): Card[] {
  return hand.filter(card => card.suit === suit);
}

/**
 * Check if player can follow the lead suit
 */
export function canFollowSuit(hand: Card[], leadSuit: Suit): boolean {
  return hand.some(card => card.suit === leadSuit);
}

/**
 * Find best card to play from hand based on suit and existing cards
 */
export function findHighestCardOfSuit(hand: Card[], suit: Suit): Card | undefined {
  const suitCards = getCardsOfSuit(hand, suit);
  if (suitCards.length === 0) return undefined;
  
  return suitCards.reduce((highest, card) => 
    card.value > highest.value ? card : highest, suitCards[0]);
}

/**
 * Find lowest card to play from hand based on suit
 */
export function findLowestCardOfSuit(hand: Card[], suit: Suit): Card | undefined {
  const suitCards = getCardsOfSuit(hand, suit);
  if (suitCards.length === 0) return undefined;
  
  return suitCards.reduce((lowest, card) => 
    card.value < lowest.value ? card : lowest, suitCards[0]);
}

/**
 * Count cards by suit in a hand
 */
export function countSuitDistribution(hand: Card[]): Record<Suit, number> {
  const distribution: Record<Suit, number> = {
    hearts: 0,
    diamonds: 0,
    clubs: 0,
    spades: 0
  };
  
  hand.forEach(card => {
    distribution[card.suit]++;
  });
  
  return distribution;
}

/**
 * Find the suit with the most cards in a hand
 */
export function findMostCommonSuit(hand: Card[]): Suit {
  const distribution = countSuitDistribution(hand);
  
  return Object.entries(distribution)
    .reduce((mostCommon, [suit, count]) => {
      return count > mostCommon.count 
        ? { suit: suit as Suit, count } 
        : mostCommon;
    }, { suit: 'spades' as Suit, count: 0 })
    .suit;
}

/**
 * Find the highest value card in a hand
 */
export function findHighestCard(hand: Card[]): Card | undefined {
  if (hand.length === 0) return undefined;
  
  return hand.reduce((highest, card) => 
    card.value > highest.value ? card : highest, hand[0]);
}
