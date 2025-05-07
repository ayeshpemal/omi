import { Card, GameAction, GameState, PlayerId, Suit, Trick } from "../types/game";
import { KAPOOTHI_POINTS, QUOTE_POINTS, REGULAR_WIN_POINTS, TOTAL_TRICKS_PER_ROUND } from "./constants";
import { createDeck, dealCards, shuffleDeck } from "./deckUtils";

/**
 * Initializes a new game state
 */
export function initializeGameState(): GameState {
  // Define players and their teams
  const players = {
    player: {
      id: "player",
      name: "You",
      hand: [],
      isHuman: true,
      team: "team1",
    },
    bot1: {
      id: "bot1",
      name: "Bot 1",
      hand: [],
      isHuman: false,
      team: "team2",
    },
    bot2: {
      id: "bot2",
      name: "Bot 2",
      hand: [],
      isHuman: false,
      team: "team1",
    },
    bot3: {
      id: "bot3",
      name: "Bot 3",
      hand: [],
      isHuman: false,
      team: "team2",
    },
  };

  // Create and shuffle the deck
  const deck = shuffleDeck(createDeck());

  // Initial game state
  return {
    players,
    playerOrder: ["player", "bot1", "bot2", "bot3"],
    currentPlayerIndex: 0,
    currentPhase: "deal",
    deck,
    trump: null,
    trumpDecider: null,
    quoteType: "none",
    quotePlayer: null,
    currentTrick: {
      cards: [],
      leadSuit: null,
      winner: null,
    },
    completedTricks: [],
    scores: {
      team1: 0,
      team2: 0,
    },
    roundHistory: [],
    halfQuotePossible: true,
    fullQuotePossible: true,
    exchangedCards: {
      player: [],
      bot1: [],
      bot2: [],
      bot3: [],
    },
    message: "Game starting... Dealing cards",
  };
}

/**
 * Deals initial half of cards to each player
 */
export function dealInitialCards(state: GameState): GameState {
  const newState = { ...state };
  
  // Deal 4 cards to each player in order
  for (let i = 0; i < 4; i++) {
    for (const playerId of newState.playerOrder) {
      const { dealt, remaining } = dealCards(newState.deck, 1);
      newState.players[playerId].hand.push(...dealt);
      newState.deck = remaining;
    }
  }
  
  newState.currentPhase = "half_quote_decision";
  newState.message = "Half Quote phase: Decide if you want to declare Half Quote";
  
  return newState;
}

/**
 * Deals remaining cards to each player
 */
export function dealRemainingCards(state: GameState): GameState {
  const newState = { ...state };
  
  // Deal remaining 4 cards to each player in order
  for (let i = 0; i < 4; i++) {
    for (const playerId of newState.playerOrder) {
      const { dealt, remaining } = dealCards(newState.deck, 1);
      newState.players[playerId].hand.push(...dealt);
      newState.deck = remaining;
    }
  }
  
  if (newState.trump !== null) {
    newState.currentPhase = "full_quote_decision";
    newState.message = "Full Quote phase: Decide if you want to declare Full Quote";
  } else {
    newState.currentPhase = "trump_declaration";
    newState.message = "Trump declaration phase: Select a trump suit";
  }
  
  return newState;
}

/**
 * Processes a player declaring Half Quote
 */
export function declareHalfQuote(state: GameState, playerId: PlayerId): GameState {
  const newState = { ...state };
  
  // Set half quote details
  newState.quoteType = "half";
  newState.quotePlayer = playerId;
  
  // Skip straight to trick play phase
  newState.currentPhase = "trick_play";
  
  // Deal remaining cards
  for (let i = 0; i < 4; i++) {
    for (const pId of newState.playerOrder) {
      const { dealt, remaining } = dealCards(newState.deck, 1);
      newState.players[pId].hand.push(...dealt);
      newState.deck = remaining;
    }
  }
  
  // The quote player goes first
  const quotePlayerIndex = newState.playerOrder.indexOf(playerId);
  newState.currentPlayerIndex = quotePlayerIndex;
  
  newState.message = `${newState.players[playerId].name} declared Half Quote! They must win all tricks.`;
  
  return newState;
}

/**
 * Processes a player passing on Half Quote
 */
export function passHalfQuote(state: GameState, playerId: PlayerId): GameState {
  const newState = { ...state };
  
  // Move to next player for half quote decision
  const nextPlayerIndex = (newState.playerOrder.indexOf(playerId) + 1) % 4;
  newState.currentPlayerIndex = nextPlayerIndex;
  
  // If we've gone all the way around, move to trump declaration
  if (nextPlayerIndex === 0) {
    newState.halfQuotePossible = false;
    newState.currentPhase = "trump_declaration";
    newState.message = "No one declared Half Quote. Trump declaration phase: Select a trump suit";
    
    // Deal remaining cards
    return dealRemainingCards(newState);
  }
  
  const nextPlayer = newState.players[newState.playerOrder[nextPlayerIndex]];
  newState.message = `${nextPlayer.name}'s turn to decide on Half Quote`;
  
  return newState;
}

/**
 * Processes a player declaring a trump suit
 */
export function declareTrump(state: GameState, playerId: PlayerId, suit: Suit): GameState {
  const newState = { ...state };
  
  // Set trump details
  newState.trump = suit;
  newState.trumpDecider = playerId;
  
  // Move to full quote decision phase
  newState.currentPhase = "full_quote_decision";
  
  // The trump deciding team can't declare Full Quote
  const trumpTeam = newState.players[playerId].team;
  
  // Find the first player from the non-trump team
  const otherTeam = trumpTeam === "team1" ? "team2" : "team1";
  const firstOtherTeamPlayerIndex = newState.playerOrder.findIndex(
    pId => newState.players[pId].team === otherTeam
  );
  
  newState.currentPlayerIndex = firstOtherTeamPlayerIndex;
  const currentPlayer = newState.players[newState.playerOrder[firstOtherTeamPlayerIndex]];
  
  newState.message = `Trump suit is ${suit}! ${currentPlayer.name}'s turn to decide on Full Quote`;
  
  return newState;
}

/**
 * Processes a player declaring Full Quote
 */
export function declareFullQuote(state: GameState, playerId: PlayerId): GameState {
  const newState = { ...state };
  
  // Set full quote details
  newState.quoteType = "full";
  newState.quotePlayer = playerId;
  
  // Move to card exchange phase
  newState.currentPhase = "card_exchange";
  
  // Find the teammate of the quote declarer
  const team = newState.players[playerId].team;
  const teammate = Object.values(newState.players).find(
    p => p.id !== playerId && p.team === team
  );
  
  if (!teammate) {
    throw new Error("Teammate not found");
  }
  
  newState.message = `${newState.players[playerId].name} declared Full Quote! Exchange cards with ${teammate.name}`;
  
  return newState;
}

/**
 * Processes a player passing on Full Quote
 */
export function passFullQuote(state: GameState, playerId: PlayerId): GameState {
  const newState = { ...state };
  
  const team = newState.players[playerId].team;
  const otherTeamPlayers = newState.playerOrder.filter(
    pid => newState.players[pid].team === team && pid !== playerId
  );
  
  // If there are other team members who can quote, move to them
  if (otherTeamPlayers.length > 0) {
    const nextQuotePlayer = otherTeamPlayers[0];
    const nextPlayerIndex = newState.playerOrder.indexOf(nextQuotePlayer);
    newState.currentPlayerIndex = nextPlayerIndex;
    
    newState.message = `${newState.players[nextQuotePlayer].name}'s turn to decide on Full Quote`;
    return newState;
  }
  
  // If no one wants to quote, start trick play
  newState.fullQuotePossible = false;
  newState.currentPhase = "trick_play";
  
  // The player who declared trump goes first
  if (newState.trumpDecider) {
    const trumpDeciderIndex = newState.playerOrder.indexOf(newState.trumpDecider);
    newState.currentPlayerIndex = trumpDeciderIndex;
  }
  
  newState.message = "No one declared Full Quote. Starting trick play!";
  
  return newState;
}

/**
 * Processes card exchange between teammates in Full Quote
 */
export function exchangeCards(
  state: GameState, 
  fromPlayer: PlayerId, 
  toPlayer: PlayerId, 
  cards: Card[]
): GameState {
  const newState = { ...state };
  
  // Remove cards from sender's hand
  newState.players[fromPlayer].hand = newState.players[fromPlayer].hand.filter(
    card => !cards.some(c => c.id === card.id)
  );
  
  // Add cards to receiver's hand
  newState.players[toPlayer].hand.push(...cards);
  
  // Keep track of exchanged cards
  newState.exchangedCards[fromPlayer] = [...newState.exchangedCards[fromPlayer], ...cards];
  
  // Check if both players have exchanged
  const team = newState.players[fromPlayer].team;
  const teamPlayers = Object.values(newState.players)
    .filter(p => p.team === team)
    .map(p => p.id);
  
  const bothExchanged = teamPlayers.every(pId => newState.exchangedCards[pId].length > 0);
  
  if (bothExchanged) {
    // Move to trick play phase
    newState.currentPhase = "trick_play";
    
    // The quote player goes first
    if (newState.quotePlayer) {
      const quotePlayerIndex = newState.playerOrder.indexOf(newState.quotePlayer);
      newState.currentPlayerIndex = quotePlayerIndex;
    }
    
    newState.message = "Card exchange complete. Starting trick play!";
  } else {
    // Determine which teammate needs to exchange now
    const otherTeammate = teamPlayers.find(pid => pid !== fromPlayer);
    if (otherTeammate) {
      const nextPlayerIndex = newState.playerOrder.indexOf(otherTeammate);
      newState.currentPlayerIndex = nextPlayerIndex;
      
      newState.message = `${newState.players[otherTeammate].name} needs to exchange cards`;
    }
  }
  
  return newState;
}

/**
 * Processes a player playing a card
 */
export function playCard(state: GameState, playerId: PlayerId, card: Card): GameState {
  const newState = { ...state };
  
  // Remove card from player's hand
  newState.players[playerId].hand = newState.players[playerId].hand.filter(c => c.id !== card.id);
  
  // Add card to current trick
  newState.currentTrick.cards.push({ playerId, card });
  
  // Set lead suit if this is the first card
  if (newState.currentTrick.cards.length === 1) {
    newState.currentTrick.leadSuit = card.suit;
  }
  
  // Move to next player
  newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % 4;
  
  // Check if trick is complete
  if (newState.currentTrick.cards.length === 4) {
    // Change to trick result phase instead of completing trick immediately
    newState.currentPhase = "trick_result";
    
    // Determine the winner but don't reset the trick yet
    const trick = newState.currentTrick;
    
    if (!trick.leadSuit) {
      throw new Error("Lead suit not set for trick");
    }
    
    // Find winning card
    let winningCard = trick.cards[0];
    
    for (let i = 1; i < trick.cards.length; i++) {
      const card = trick.cards[i];
      
      // If trump is played and winning card is not trump, trump wins
      if (newState.trump && card.card.suit === newState.trump && 
          (winningCard.card.suit !== newState.trump)) {
        winningCard = card;
      }
      // If same suit as winning card and higher value
      else if (card.card.suit === winningCard.card.suit && 
               card.card.value > winningCard.card.value) {
        winningCard = card;
      }
      // If lead suit and winning card is not lead suit or trump
      else if (card.card.suit === trick.leadSuit && 
              winningCard.card.suit !== trick.leadSuit && 
              (newState.trump === null || winningCard.card.suit !== newState.trump)) {
        winningCard = card;
      }
    }
    
    // Set trick winner
    trick.winner = winningCard.playerId;
    
    // Set message
    const winnerName = newState.players[trick.winner].name;
    newState.message = `${winnerName} won the trick!`;
    
    return newState;
  }
  
  const nextPlayer = newState.players[newState.playerOrder[newState.currentPlayerIndex]];
  newState.message = `${nextPlayer.name}'s turn to play a card`;
  
  return newState;
}

/**
 * Completes the current trick and determines the winner
 */
export function completeTrick(state: GameState): GameState {
  const newState = { ...state };
  const trick = newState.currentTrick;
  
  if (!trick.leadSuit) {
    throw new Error("Lead suit not set for trick");
  }
  
  // Find winning card
  let winningCard = trick.cards[0];
  
  for (let i = 1; i < trick.cards.length; i++) {
    const card = trick.cards[i];
    
    // If trump is played and winning card is not trump, trump wins
    if (newState.trump && card.card.suit === newState.trump && 
        (winningCard.card.suit !== newState.trump)) {
      winningCard = card;
    }
    // If same suit as winning card and higher value
    else if (card.card.suit === winningCard.card.suit && 
             card.card.value > winningCard.card.value) {
      winningCard = card;
    }
    // If lead suit and winning card is not lead suit or trump
    else if (card.card.suit === trick.leadSuit && 
            winningCard.card.suit !== trick.leadSuit && 
            (newState.trump === null || winningCard.card.suit !== newState.trump)) {
      winningCard = card;
    }
  }
  
  // Set trick winner
  trick.winner = winningCard.playerId;
  
  // Add to completed tricks
  newState.completedTricks.push({ ...trick });
  
  // Reset current trick
  newState.currentTrick = {
    cards: [],
    leadSuit: null,
    winner: null,
  };
  
  // Winner starts next trick
  const winnerIndex = newState.playerOrder.indexOf(winningCard.playerId);
  newState.currentPlayerIndex = winnerIndex;
  
  // Check if round is complete
  if (newState.completedTricks.length === TOTAL_TRICKS_PER_ROUND) {
    return endRound(newState);
  }
  
  const nextPlayer = newState.players[newState.playerOrder[winnerIndex]];
  newState.message = `${nextPlayer.name} won the trick! Their turn to play next.`;
  
  return newState;
}

/**
 * Ends the current round and calculates scores
 */
export function endRound(state: GameState): GameState {
  const newState = { ...state };
  
  // Count tricks won by each team
  const team1Tricks = newState.completedTricks.filter(
    trick => trick.winner && newState.players[trick.winner].team === "team1"
  ).length;
  
  const team2Tricks = TOTAL_TRICKS_PER_ROUND - team1Tricks;
  
  let team1Points = 0;
  let team2Points = 0;
  let team1WinsRound = false;
  let wasKapoothi = false;
  let quoteSucceeded = false;
  
  // Handle quote scenarios first
  if (newState.quoteType !== "none" && newState.quotePlayer) {
    const quoteTeam = newState.players[newState.quotePlayer].team;
    const quoteTricks = quoteTeam === "team1" ? team1Tricks : team2Tricks;
    
    // For both half and full quote, player must win all tricks
    if (quoteTricks === TOTAL_TRICKS_PER_ROUND) {
      // Quote succeeded
      if (quoteTeam === "team1") {
        team1Points = QUOTE_POINTS;
      } else {
        team2Points = QUOTE_POINTS;
      }
      quoteSucceeded = true;
    } else {
      // Quote failed - opponents get points
      if (quoteTeam === "team1") {
        team2Points = QUOTE_POINTS;
      } else {
        team1Points = QUOTE_POINTS;
      }
    }
  } 
  // Normal scoring if no quote
  else {
    // Check for Kapoothi (one team won all tricks)
    if (team1Tricks === TOTAL_TRICKS_PER_ROUND) {
      team1Points = KAPOOTHI_POINTS;
      wasKapoothi = true;
    } else if (team2Tricks === TOTAL_TRICKS_PER_ROUND) {
      team2Points = KAPOOTHI_POINTS;
      wasKapoothi = true;
    } 
    // Regular scoring - team with 5+ tricks gets 1 point
    else if (team1Tricks >= 5) {
      team1Points = REGULAR_WIN_POINTS;
    } else {
      team2Points = REGULAR_WIN_POINTS;
    }
  }
  
  // Update scores
  newState.scores.team1 += team1Points;
  newState.scores.team2 += team2Points;
  
  // Determine round winner
  team1WinsRound = team1Points > 0;
  
  // Add to round history
  newState.roundHistory.push({
    winner: team1WinsRound ? "team1" : "team2",
    points: team1WinsRound ? team1Points : team2Points,
    wasKapoothi,
    wasQuote: newState.quoteType !== "none",
  });
  
  // Update game phase
  newState.currentPhase = "round_end";
  
  // Create result message
  let resultMessage = "";
  if (newState.quoteType !== "none" && newState.quotePlayer) {
    const quoteTeam = newState.players[newState.quotePlayer].team;
    const quoteTeamName = quoteTeam === "team1" ? "Your team" : "Opponent team";
    const quoteTypeStr = newState.quoteType === "half" ? "Half" : "Full";
    
    if (quoteSucceeded) {
      resultMessage = `${quoteTeamName} successfully completed the ${quoteTypeStr} Quote! +${QUOTE_POINTS} points`;
    } else {
      resultMessage = `${quoteTeamName} failed the ${quoteTypeStr} Quote! Opponents get +${QUOTE_POINTS} points`;
    }
  } else if (wasKapoothi) {
    const kapTeam = team1Tricks === TOTAL_TRICKS_PER_ROUND ? "Your team" : "Opponent team";
    resultMessage = `${kapTeam} won all tricks (Kapoothi)! +${KAPOOTHI_POINTS} points`;
  } else {
    const winTeam = team1WinsRound ? "Your team" : "Opponent team";
    const winTricks = team1WinsRound ? team1Tricks : team2Tricks;
    resultMessage = `${winTeam} won ${winTricks} tricks! +${REGULAR_WIN_POINTS} point`;
  }
  
  newState.message = resultMessage;
  
  return newState;
}

/**
 * Starts a new round of the game
 */
export function startNewRound(state: GameState): GameState {
  // Keep scores and round history, reset everything else
  const newState = {
    ...initializeGameState(),
    scores: { ...state.scores },
    roundHistory: [...state.roundHistory],
  };
  
  // Deal initial cards
  return dealInitialCards(newState);
}

/**
 * Main game reducer to handle all game actions
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "DEAL_INITIAL_CARDS":
      return dealInitialCards(state);
      
    case "DECLARE_HALF_QUOTE":
      return declareHalfQuote(state, action.playerId);
      
    case "PASS_HALF_QUOTE":
      return passHalfQuote(state, action.playerId);
      
    case "DECLARE_TRUMP":
      return declareTrump(state, action.playerId, action.suit);
      
    case "DEAL_REMAINING_CARDS":
      return dealRemainingCards(state);
      
    case "DECLARE_FULL_QUOTE":
      return declareFullQuote(state, action.playerId);
      
    case "PASS_FULL_QUOTE":
      return passFullQuote(state, action.playerId);
      
    case "EXCHANGE_CARDS":
      return exchangeCards(state, action.fromPlayer, action.toPlayer, action.cards);
      
    case "PLAY_CARD":
      return playCard(state, action.playerId, action.card);
      
    case "COMPLETE_TRICK":
      return completeTrick(state);
      
    case "END_ROUND":
      return endRound(state);
      
    case "START_NEW_ROUND":
      return startNewRound(state);
      
    default:
      return state;
  }
}
