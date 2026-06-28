# Omi - Sri Lankan Card Game

A modern, web-based implementation of **Omi** (sometimes transliterated as *Omee*), the classic and beloved trick-taking card game of Sri Lanka. 

Play online: [omi-web.onrender.com](https://omi-web.onrender.com/)

> [!WARNING]
> **Work in Progress:** This project is currently under active development. Both the user interface (UI) and the game logic are still being worked on and refined.

---

## 🎮 Game Rules & Mechanics

Omi is a partnership trick-taking game played with a shortened deck of **32 cards** (Aces down to 7s of all four suits: Hearts, Diamonds, Clubs, and Spades). 

### The Setup
* **Players & Teams:** 4 players divided into 2 teams. 
  * **Team 1:** You (Player) & Bot 2 (Teammate)
  * **Team 2:** Bot 1 & Bot 3 (Opponents)
* **Goal:** Be the first team to reach **500 points**.

---

### Phase-by-Phase Gameplay

#### 1. Initial Deal & Half Quote Phase
* Each player is dealt **4 cards** to start.
* Starting with the dealer, players decide if they want to declare a **Half Quote** or pass:
  * **Half Quote:** A high-risk, high-reward commitment to win all 4 tricks using only the cards currently in hand.
  * When a player declares a Half Quote, their teammate is benched and does *not* participate. The declarer plays alone against the two opponents.
  * If successful, the team gains **+3 points** (`QUOTE_POINTS`). If they fail, the opposing team gains the points.
  * If a Half Quote is declared, the round immediately moves to trick play. Otherwise, the game proceeds to the Trump selection.

#### 2. Trump Declaration & Final Deal
* If no one declared Half Quote, the starting player selects a **Trump Suit** (♥ Hearts, ♦ Diamonds, ♣ Clubs, or ♠ Spades) based on their first 4 cards.
* The remaining **4 cards** are then dealt to all players, giving everyone a hand of **8 cards**.

#### 3. Full Quote Phase
* Starting with the team that did *not* declare trump, players can choose to declare a **Full Quote**:
  * **Full Quote:** A commitment to win all 8 tricks of the round.
  * Like Half Quote, the declarer plays alone (their teammate does not participate).
  * If declared, the game moves to the **Card Exchange** phase.
  * If all players pass, standard trick play begins.

#### 4. Card Exchange (Full Quote Only)
* If a player declares a Full Quote, they and their teammate select and exchange exactly **2 cards** to optimize the declarer's hand before they play alone.

#### 5. Trick Play
* The winner of the bidding (or the trump selector if no quote was declared) leads the first trick.
* **Following Suit:** Players must follow the suit of the lead card if they have one. If not, they may play any card.
* **Winning a Trick:** 
  * **Standard Mode:** The highest card of the lead suit wins the trick, unless a Trump card is played (Trumps beat all other suits).
  * **Quote Mode:** Since the quote declarer plays alone against three opponents, Trumps do *not* have a higher rank. The highest card of the lead suit wins.
* The winner of a trick leads the next one.

#### 6. Scoring
At the end of the round, points are calculated as follows:
* **Normal Play:**
  * The team with **5 or more tricks** wins the round and gains **+1 point** (`REGULAR_WIN_POINTS`).
  * If a team wins all **8 tricks**, it is a **Kapoothi** and awards **+3 points** (`KAPOOTHI_POINTS`).
  * If both teams win exactly 4 tricks, the round is a draw and no points are awarded.
* **Quote Play (Half or Full):**
  * If the quote declarer wins all tricks (4 for Half, 8 for Full), their team gets **+3 points**.
  * If the opponents win even a single trick, the quote fails, and the opposing team gets **+3 points**.

---

## 🛠️ Tech Stack & Features

* **Frontend Framework:** React (TypeScript) bootstrapped with Vite.
* **State Management:** 
  * React Reducer (`useReducer`) + Context API (`GameContext`) for game engine mechanics.
  * Zustand (`useAudio`) for managing sound effects and background music states.
* **Styling & UI:** 
  * Tailwind CSS for modern aesthetics and fully responsive grids.
  * Framer Motion for smooth micro-animations, card hover scales, and hand transitions.
  * Radix UI for accessible interactive overlays (dialogs, tooltips, buttons).
* **Sound System:** Fully interactive audio controls, including background music, sound effects for card placement, success chimes on round wins, and a mute toggle.
* **Extra Features:**
  * Automatic dark mode toggle.
  * AI behavior that simulates thinking and makes decisions (bidding, exchanging, playing) dynamically.
  * Mobile and desktop responsive layouts.
  * Victory celebration using `react-confetti`.

---

## 🚀 Local Development

To run this project on your machine, follow these steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
This runs the client dev server (Vite) and the server side logic concurrently:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5000`.

### 3. Build for Production
To bundle and optimize the application:
```bash
npm run build
```

### 4. Run the Production Build
To spin up the compiled bundle:
```bash
npm run start
```

---

## 🌐 Deployment (Render)

This application is ready for deployment on **Render** (as configured in `render.yaml`).

### Environment Variables
To successfully deploy the game, you need to set the following environment variables in the Render dashboard:
* `NODE_ENV`: Should be set to `production`.
* `DATABASE_URL`: Connection string for PostgreSQL database (e.g., Neon or Supabase) to execute drizzle migrations and manage schemas if database integration is active.
* `SESSION_SECRET`: A long random string used for session cookie security.

---

## 📁 Project Structure

```
├── client/
│   ├── public/             # Static assets (sounds, icons)
│   └── src/
│       ├── components/     # UI components (Game, ScoreBoard, PlayArea)
│       ├── context/        # Game Context & State provider
│       ├── hooks/          # Custom utility hooks
│       ├── lib/            # Shared third-party store definitions (Zustand)
│       ├── utils/          # Core game/AI logic and constants
│       ├── App.tsx         # Main entry component
│       └── main.tsx        # React DOM render entry
├── server/                 # Express backend configurations
├── shared/                 # Shared database schemas
├── package.json            # Scripts & project dependencies
└── vite.config.ts          # Vite configuration
```
