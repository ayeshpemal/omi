import { Card, GameAction, GameState, PlayerId, Suit, Trick } from "../types/game";
import { GAME_VERSION, KAPOOTHI_POINTS, QUOTE_POINTS, REGULAR_WIN_POINTS, TOTAL_TRICKS_PER_ROUND } from "./constants";
import { createDeck, dealCards, shuffleDeck } from "./deckUtils";

/**
 * Initializes a new game state
 */
export function initializeGameState(): GameState {
  // Define players and their teams
  const players: Record<PlayerId, {
    id: PlayerId;
    name: string;
    hand: Card[];
    isHuman: boolean;
    team: "team1" | "team2";
  }> = {
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
    version: GAME_VERSION,
    settings: {
      botCanInitiateHalfQuote: true,
      botCanInitiateFullQuote: true,
      gameStarted: false
    },
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
    trickSummary: {
      team1Tricks: 0,
      team2Tricks: 0,
      tricksRequired: TOTAL_TRICKS_PER_ROUND
    }
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
  
  // After initial 4 cards, move to Trump Declaration phase
  newState.currentPhase = "trump_declaration";
  newState.message = "Trump Declaration phase: Select a trump suit";
  
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
  
  // In half quote, we don't deal the remaining cards
  // The player must win with just the 4 cards they have
  
  // Store the player's team
  const quoteTeam = newState.players[playerId].team;
  
  // Find the teammate of the quote declarer
  const teammateId = Object.values(newState.players).find(
    p => p.id !== playerId && p.team === quoteTeam
  )?.id;
  
  // Create a modified player order that skips the teammate
  // For half quote, the teammate doesn't participate
  if (teammateId) {
    newState.playerOrder = newState.playerOrder.filter(id => id !== teammateId);
  }
  
  // The quote player goes first
  const quotePlayerIndex = newState.playerOrder.indexOf(playerId);
  newState.currentPlayerIndex = quotePlayerIndex;
  
  newState.message = `${newState.players[playerId].name} declared Half Quote! They must win all tricks with just 4 cards. Their teammate will not participate.`;
  
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
  // Set trump and then deal remaining cards
  const tempState = { ...state, trump: suit, trumpDecider: playerId };
  let newState = dealRemainingCards(tempState);
  
  // Determine first full quote decider from the non-trump team
  const trumpTeam = newState.players[playerId].team;
  const otherTeam = trumpTeam === "team1" ? "team2" : "team1";
  const firstIndex = newState.playerOrder.findIndex(
    pId => newState.players[pId].team === otherTeam
  );
  newState.currentPlayerIndex = firstIndex;
  const currentPlayer = newState.players[newState.playerOrder[firstIndex]];
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
  
  // Initialize the set of players who have passed if it doesn't exist
  if (!newState.playersPassedFullQuote) {
    newState.playersPassedFullQuote = new Set<PlayerId>();
  }
  
  // Add the current player to the set of players who have passed
  newState.playersPassedFullQuote.add(playerId);
  
  const team = newState.players[playerId].team;
  
  // Find all players on the same team who haven't passed yet
  const eligibleTeammates = newState.playerOrder.filter(pid => 
    newState.players[pid].team === team && 
    pid !== playerId && 
    !newState.playersPassedFullQuote?.has(pid)
  );
  
  // If there's another eligible player on the same team, move to them
  if (eligibleTeammates.length > 0) {
    const nextPlayerIndex = newState.playerOrder.indexOf(eligibleTeammates[0]);
    newState.currentPlayerIndex = nextPlayerIndex;
    
    newState.message = `${newState.players[eligibleTeammates[0]].name}'s turn to decide on Full Quote`;
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
    
    // In full quote, only the player who declared the quote participates (not their teammate)
    if (newState.quotePlayer) {
      // Find the teammate of the quote declarer
      const quoteTeam = newState.players[newState.quotePlayer].team;
      const teammateId = Object.values(newState.players).find(
        p => p.id !== newState.quotePlayer && p.team === quoteTeam
      )?.id;
      
      // Create a modified player order that skips the teammate
      if (teammateId) {
        newState.playerOrder = newState.playerOrder.filter(id => id !== teammateId);
      }
      
      // The quote player goes first
      const quotePlayerIndex = newState.playerOrder.indexOf(newState.quotePlayer);
      newState.currentPlayerIndex = quotePlayerIndex;
      
      newState.message = `Card exchange complete. ${newState.players[newState.quotePlayer].name} will play alone for Full Quote!`;
    } else {
      newState.message = "Card exchange complete. Starting trick play!";
    }
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
  newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.playerOrder.length;
  
  // Check if trick is complete - in Half Quote we have 3 players, otherwise 4
  const playersInGame = newState.playerOrder.length;
  if (newState.currentTrick.cards.length === playersInGame) {
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
      
      // Check if we're in quote mode (full or half)
      const isQuoteMode = newState.quoteType === "half" || newState.quoteType === "full";
      
      // If trump is played and winning card is not trump, trump wins (only if not in quote mode)
      if (!isQuoteMode && newState.trump && card.card.suit === newState.trump && 
          (winningCard.card.suit !== newState.trump)) {
        winningCard = card;
      }
      // If same suit as winning card and higher value
      else if (card.card.suit === winningCard.card.suit && 
               card.card.value > winningCard.card.value) {
        winningCard = card;
      }
      // If lead suit and winning card is not lead suit (and not trump when not in quote mode)
      else if (card.card.suit === trick.leadSuit && 
              winningCard.card.suit !== trick.leadSuit && 
              (isQuoteMode || newState.trump === null || winningCard.card.suit !== newState.trump)) {
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
  
  // Check if we're in quote mode (full or half)
  const isQuoteMode = newState.quoteType === "half" || newState.quoteType === "full";
  
  // Find winning card
  let winningCard = trick.cards[0];
  
  for (let i = 1; i < trick.cards.length; i++) {
    const card = trick.cards[i];
    
    // If trump is played and winning card is not trump, trump wins (only if not in quote mode)
    if (!isQuoteMode && newState.trump && card.card.suit === newState.trump && 
        (winningCard.card.suit !== newState.trump)) {
      winningCard = card;
    }
    // If same suit as winning card and higher value
    else if (card.card.suit === winningCard.card.suit && 
             card.card.value > winningCard.card.value) {
      winningCard = card;
    }
    // If lead suit and winning card is not lead suit (and not trump when not in quote mode)
    else if (card.card.suit === trick.leadSuit && 
            winningCard.card.suit !== trick.leadSuit && 
            (isQuoteMode || newState.trump === null || winningCard.card.suit !== newState.trump)) {
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
  
  // Update trick summary
  const winnerTeam = newState.players[trick.winner].team;
  if (winnerTeam === "team1") {
    newState.trickSummary.team1Tricks += 1;
  } else {
    newState.trickSummary.team2Tricks += 1;
  }
  
  // For half quote, we adjust the total tricks required
  if (newState.quoteType === "half") {
    newState.trickSummary.tricksRequired = 4;
  }
  
  // Winner starts next trick
  const winnerIndex = newState.playerOrder.indexOf(winningCard.playerId);
  newState.currentPlayerIndex = winnerIndex;
  
  // For half quote, we consider the round complete after 4 tricks
  // For regular play, after 8 tricks
  const tricksNeeded = newState.quoteType === "half" ? 4 : TOTAL_TRICKS_PER_ROUND;
  
  // Check if round is complete
  if (newState.completedTricks.length === tricksNeeded) {
    return endRound(newState);
  }
  
  // Set the game phase back to trick_play so players can continue playing
  newState.currentPhase = "trick_play";
  
  const nextPlayer = newState.players[newState.playerOrder[winnerIndex]];
  const winnerName = newState.players[trick.winner].name;
  const team1Name = "Your team";
  const team2Name = "Opponent team";
  
  // Update message based on who won and who plays next with trick summary
  const summaryText = `[${team1Name}: ${newState.trickSummary.team1Tricks}, ${team2Name}: ${newState.trickSummary.team2Tricks}]`;
  
  if (trick.winner === "player") {
    newState.message = `You won the trick! ${summaryText} Your turn to play next.`;
  } else if (newState.playerOrder[winnerIndex] === "player") {
    newState.message = `${winnerName} won the trick! ${summaryText} Your turn to play next.`;
  } else {
    newState.message = `${winnerName} won the trick! ${summaryText} ${nextPlayer.name}'s turn to play next.`;
  }
  
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
  
  // For half quote, the total tricks is 4, otherwise it's 8
  const totalTricks = newState.quoteType === "half" ? 4 : TOTAL_TRICKS_PER_ROUND;
  const team2Tricks = totalTricks - team1Tricks;
  
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
    if (quoteTricks === totalTricks) {
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
    if (team1Tricks === totalTricks) {
      team1Points = KAPOOTHI_POINTS;
      wasKapoothi = true;
    } else if (team2Tricks === totalTricks) {
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
    const kapTeam = team1Tricks === totalTricks ? "Your team" : "Opponent team";
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
  // Create a new game state
  const newState = initializeGameState();
  
  // Keep scores and round history from the previous state
  newState.scores = { ...state.scores };
  newState.roundHistory = [...state.roundHistory];
  
  // Standard player order
  newState.playerOrder = ["player", "bot1", "bot2", "bot3"];
  
  // Rotate trump declaration for the next round
  // If there was a trumpDecider last round, the next player gets to start this round
  if (state.trumpDecider) {
    const standardOrder = ["player", "bot1", "bot2", "bot3"];
    const lastTrumpDeciderIndex = standardOrder.indexOf(state.trumpDecider);
    if (lastTrumpDeciderIndex !== -1) {
      // Find the next player index in the rotation
      const nextPlayerIndex = (lastTrumpDeciderIndex + 1) % 4;
      newState.currentPlayerIndex = nextPlayerIndex;
    }
  }
  
  // Reset phase-specific variables
  newState.trumpDecider = null;
  newState.trump = null;
  newState.quoteType = "none";
  newState.quotePlayer = null;
  newState.halfQuotePossible = true;
  newState.fullQuotePossible = true;
  newState.playersPassedFullQuote = new Set<PlayerId>();
  
  // Reset trick summary for new round
  newState.trickSummary = {
    team1Tricks: 0,
    team2Tricks: 0,
    tricksRequired: TOTAL_TRICKS_PER_ROUND
  };
  
  // Clear any exchanged cards from previous round
  newState.exchangedCards = {
    player: [],
    bot1: [],
    bot2: [],
    bot3: [],
  };
  
  // Set starting message with information about the starting player
  const firstPlayer = newState.players[newState.playerOrder[newState.currentPlayerIndex]];
  newState.message = `Starting new round... ${firstPlayer.name} gets first chance for Half Quote and Trump selection.`;
  
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
      
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings
        }
      };
      
    case "START_GAME":
      return {
        ...state,
        settings: {
          ...state.settings,
          gameStarted: true
        }
      };
      
    default:
      return state;
  }
}
