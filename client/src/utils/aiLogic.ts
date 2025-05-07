import { Card, GameState, PlayerId, Suit } from "../types/game";
import { canFollowSuit, countSuitDistribution, findHighestCard, findHighestCardOfSuit, findLowestCardOfSuit, findMostCommonSuit, getCardsOfSuit, hasStrongHand } from "./deckUtils";

/**
 * AI decision function to determine if bot should declare Half Quote
 */
export function shouldDeclareHalfQuote(state: GameState, botId: PlayerId): boolean {
  const bot = state.players[botId];
  
  // Only consider half quote if player has a very strong initial hand
  // Checks for at least 3 high cards (A, K, Q) in the initial hand
  const highCards = bot.hand.filter(card => 
    card.rank === 'A' || card.rank === 'K' || card.rank === 'Q'
  );
  
  // Count aces specifically
  const aces = bot.hand.filter(card => card.rank === 'A');
  
  // More aggressive if bot has 2+ aces and multiple high cards
  return aces.length >= 2 && highCards.length >= 3;
}

/**
 * AI decision function to determine the best trump suit for bot
 */
export function chooseTrumpSuit(state: GameState, botId: PlayerId): Suit {
  const bot = state.players[botId];
  
  // Count cards by suit
  const distribution = countSuitDistribution(bot.hand);
  
  // Get suits sorted by count (descending)
  const suitsByCount = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .map(([suit]) => suit as Suit);
  
  // Default to most common suit
  let bestSuit = suitsByCount[0];
  
  // If there's a tie in count, prefer the suit with higher cards
  if (suitsByCount.length > 1 && distribution[suitsByCount[0]] === distribution[suitsByCount[1]]) {
    const suit1Cards = getCardsOfSuit(bot.hand, suitsByCount[0]);
    const suit2Cards = getCardsOfSuit(bot.hand, suitsByCount[1]);
    
    const suit1Strength = suit1Cards.reduce((sum, card) => sum + card.value, 0);
    const suit2Strength = suit2Cards.reduce((sum, card) => sum + card.value, 0);
    
    bestSuit = suit1Strength > suit2Strength ? suitsByCount[0] : suitsByCount[1];
  }
  
  return bestSuit;
}

/**
 * AI decision function to determine if bot should declare Full Quote
 */
export function shouldDeclareFullQuote(state: GameState, botId: PlayerId): boolean {
  const bot = state.players[botId];
  
  // Count high cards (A, K, Q)
  const highCards = bot.hand.filter(card => 
    card.rank === 'A' || card.rank === 'K' || card.rank === 'Q'
  );
  
  // Count aces specifically
  const aces = bot.hand.filter(card => card.rank === 'A');
  
  // Count trump cards if trump is declared
  const trumpCards = state.trump ? getCardsOfSuit(bot.hand, state.trump) : [];
  
  // Calculate distribution to check for void suits
  const distribution = countSuitDistribution(bot.hand);
  const hasSuitVoid = Object.values(distribution).some(count => count === 0);
  
  // Check for aces of other suits
  const nonTrumpAces = aces.filter(card => card.suit !== state.trump);
  
  // More aggressive with multiple high cards, aces, and/or many trump cards
  return (
    (highCards.length >= 4 && aces.length >= 2) || 
    (trumpCards.length >= 4 && nonTrumpAces.length >= 1) ||
    (trumpCards.length >= 3 && hasSuitVoid && aces.length >= 1)
  );
}

/**
 * AI function to choose which cards to exchange during Full Quote
 */
export function chooseCardsToExchange(state: GameState, botId: PlayerId): Card[] {
  const bot = state.players[botId];
  const hand = [...bot.hand];
  
  // Prefer to exchange low cards that aren't trump
  const nonTrumpCards = hand.filter(card => card.suit !== state.trump);
  
  // Sort by value (ascending)
  nonTrumpCards.sort((a, b) => a.value - b.value);
  
  // Choose lowest 2 non-trump cards
  if (nonTrumpCards.length >= 2) {
    return nonTrumpCards.slice(0, 2);
  }
  
  // If we don't have 2 non-trump cards, get lowest cards from hand
  hand.sort((a, b) => a.value - b.value);
  return hand.slice(0, 2);
}

/**
 * AI function to select the best card to play in a trick
 */
export function selectCardToPlay(state: GameState, botId: PlayerId): Card {
  const bot = state.players[botId];
  const trick = state.currentTrick;
  const hand = bot.hand;
  
  // If this is the first card in the trick
  if (trick.cards.length === 0) {
    return selectLeadCard(state, botId);
  }
  
  if (!trick.leadSuit) {
    throw new Error("Lead suit missing for trick");
  }
  
  // Must follow suit if possible
  if (canFollowSuit(hand, trick.leadSuit)) {
    return selectFollowSuitCard(state, botId, trick.leadSuit);
  }
  
  // Can't follow suit, check if we should play trump
  if (state.trump && getCardsOfSuit(hand, state.trump).length > 0) {
    return selectTrumpCard(state, botId);
  }
  
  // Can't follow suit or play trump, play lowest card
  return selectDiscardCard(hand);
}

/**
 * Helper function to select a card when leading the trick
 */
function selectLeadCard(state: GameState, botId: PlayerId): Card {
  const bot = state.players[botId];
  const hand = bot.hand;
  const botTeam = bot.team;
  
  // If we're in a quote and on the quoting team, lead with high card
  if (state.quotePlayer && state.players[state.quotePlayer].team === botTeam) {
    // Lead with highest card or trump if available
    if (state.trump) {
      const highTrump = findHighestCardOfSuit(hand, state.trump);
      if (highTrump) return highTrump;
    }
    
    return findHighestCard(hand) || hand[0];
  }
  
  // If we're in a quote and NOT on the quoting team, try to prevent them from winning
  if (state.quotePlayer && state.players[state.quotePlayer].team !== botTeam) {
    // Lead with a high card from our strongest suit
    const strongestSuit = findMostCommonSuit(hand);
    const highCard = findHighestCardOfSuit(hand, strongestSuit);
    
    if (highCard) return highCard;
  }
  
  // Regular play - lead with a strong card if we have one
  const highCards = hand.filter(card => card.rank === 'A' || card.rank === 'K');
  
  if (highCards.length > 0) {
    return highCards[0];
  }
  
  // Default to middle-value card from most common suit
  const strongestSuit = findMostCommonSuit(hand);
  const suitCards = getCardsOfSuit(hand, strongestSuit);
  suitCards.sort((a, b) => a.value - b.value);
  
  const middleIndex = Math.floor(suitCards.length / 2);
  return suitCards[middleIndex] || hand[0];
}

/**
 * Helper function to select a card when following suit
 */
function selectFollowSuitCard(state: GameState, botId: PlayerId, leadSuit: Suit): Card {
  const bot = state.players[botId];
  const hand = bot.hand;
  const botTeam = bot.team;
  const trick = state.currentTrick;
  
  const suitCards = getCardsOfSuit(hand, leadSuit);
  
  // Get the current highest card in the trick
  let highestCardInTrick: Card | null = null;
  let highestCardTeam: string | null = null;
  
  for (const played of trick.cards) {
    const playedCard = played.card;
    const playedSuit = playedCard.suit;
    const playerTeam = state.players[played.playerId].team;
    
    // Only consider lead suit or trump
    if (playedSuit !== leadSuit && (state.trump === null || playedSuit !== state.trump)) {
      continue;
    }
    
    // If it's a trump and highest is not trump
    if (state.trump && playedSuit === state.trump && 
        (!highestCardInTrick || highestCardInTrick.suit !== state.trump)) {
      highestCardInTrick = playedCard;
      highestCardTeam = playerTeam;
    } 
    // If highest is not set or played card is higher
    else if (!highestCardInTrick || 
            (playedSuit === highestCardInTrick.suit && playedCard.value > highestCardInTrick.value) ||
            (playedSuit === leadSuit && highestCardInTrick.suit !== leadSuit && 
             (state.trump === null || highestCardInTrick.suit !== state.trump))) {
      highestCardInTrick = playedCard;
      highestCardTeam = playerTeam;
    }
  }
  
  // If we're on the quoting team and need to win
  if (state.quotePlayer && state.players[state.quotePlayer].team === botTeam) {
    // If teammate is winning, play a low card
    if (highestCardTeam === botTeam) {
      return findLowestCardOfSuit(hand, leadSuit) || suitCards[0];
    }
    
    // Otherwise we need to play a card that can win
    for (const card of suitCards) {
      if (!highestCardInTrick || card.value > highestCardInTrick.value) {
        return card;
      }
    }
    
    // If we can't win, play lowest
    return findLowestCardOfSuit(hand, leadSuit) || suitCards[0];
  }
  
  // If we're the last to play and teammate is winning, play low
  if (trick.cards.length === 3 && highestCardTeam === botTeam) {
    return findLowestCardOfSuit(hand, leadSuit) || suitCards[0];
  }
  
  // If we're the last to play and we can win, play the lowest card that wins
  if (trick.cards.length === 3 && highestCardInTrick) {
    // Find the lowest card that can win
    suitCards.sort((a, b) => a.value - b.value);
    for (const card of suitCards) {
      if (card.value > highestCardInTrick.value) {
        return card;
      }
    }
  }
  
  // Default play - if we have high cards play them, otherwise play low
  const highCards = suitCards.filter(card => card.rank === 'A' || card.rank === 'K');
  
  if (highCards.length > 0) {
    return highCards[0];
  }
  
  // Play middle value card
  suitCards.sort((a, b) => a.value - b.value);
  const middleIndex = Math.floor(suitCards.length / 2);
  return suitCards[middleIndex] || suitCards[0];
}

/**
 * Helper function to select a trump card
 */
function selectTrumpCard(state: GameState, botId: PlayerId): Card {
  const bot = state.players[botId];
  const hand = bot.hand;
  const botTeam = bot.team;
  
  if (!state.trump) {
    throw new Error("Trump is not defined");
  }
  
  const trumpCards = getCardsOfSuit(hand, state.trump);
  
  // If quoting team, play high trump to win
  if (state.quotePlayer && state.players[state.quotePlayer].team === botTeam) {
    return findHighestCardOfSuit(hand, state.trump) || trumpCards[0];
  }
  
  // Find if a teammate is already winning the trick
  const trick = state.currentTrick;
  let teammateWinning = false;
  let highestTrump: Card | null = null;
  
  for (const played of trick.cards) {
    const playerTeam = state.players[played.playerId].team;
    
    // Check if it's a trump
    if (played.card.suit === state.trump) {
      if (!highestTrump || played.card.value > highestTrump.value) {
        highestTrump = played.card;
        teammateWinning = playerTeam === botTeam;
      }
    } else if (!highestTrump && (trick.leadSuit && played.card.suit === trick.leadSuit)) {
      // Leading suit, but no trump played yet
      teammateWinning = playerTeam === botTeam;
    }
  }
  
  // If teammate is winning, play lowest trump
  if (teammateWinning) {
    return findLowestCardOfSuit(hand, state.trump) || trumpCards[0];
  }
  
  // Otherwise play medium-high trump to win
  trumpCards.sort((a, b) => a.value - b.value);
  
  // If we're the last to play, just use lowest winning trump
  if (trick.cards.length === 3 && highestTrump) {
    for (const card of trumpCards) {
      if (card.value > highestTrump.value) {
        return card;
      }
    }
  }
  
  // Use a higher trump if possible
  const highIndex = Math.floor(trumpCards.length * 0.7);
  return trumpCards[highIndex] || trumpCards[0];
}

/**
 * Helper function to select a discard card (when can't follow suit or play trump)
 */
function selectDiscardCard(hand: Card[]): Card {
  // Play lowest card from any suit
  hand.sort((a, b) => a.value - b.value);
  return hand[0];
}
