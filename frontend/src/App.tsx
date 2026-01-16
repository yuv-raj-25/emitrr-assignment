import { type FormEvent, useEffect, useRef, useState } from "react";
import "./App.css";
import Board from "./Board";
import Leaderboard from "./Leaderboard";
import { disconnectSocket, getSocket } from "./socket";

type GameStatus = "WAITING" | "ACTIVE" | "ENDED";

type CellValue = 0 | 1 | 2;

type GameState = {
  board: CellValue[][];
  currentTurn: string | null;
  gameStatus: GameStatus;
  winner: string | null;
  resultReason?: string | null;
};

type GamePayload = {
  board?: CellValue[][];
  currentTurn?: string;
  turn?: string;
  gameStatus?: GameStatus;
  status?: GameStatus;
  winner?: string;
  result?: { winner?: string };
  resultReason?: string;
  reason?: string;
  outcome?: string;
  yourTurn?: boolean;
  playerToken?: string;
  playerSymbol?: string;
  playerId?: string;
  you?: string;
  game?: { board?: CellValue[][] };
};

const createEmptyBoard = (): CellValue[][] =>
  Array.from({ length: 6 }, () =>
    Array.from({ length: 7 }, () => 0 as CellValue)
  );

function App() {
  const [username, setUsername] = useState("");
  const [joinedUsername, setJoinedUsername] = useState<string | null>(
    null
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [yourTurnOverride, setYourTurnOverride] = useState<
    boolean | null
  >(null);
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentTurn: null,
    gameStatus: "WAITING",
    winner: null,
    resultReason: null,
  });
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] =
    useState(0);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const isYourTurn = (() => {
    if (gameState.gameStatus !== "ACTIVE") {
      return false;
    }
    if (yourTurnOverride !== null) {
      return yourTurnOverride;
    }
    if (!gameState.currentTurn) {
      return false;
    }
    if (playerToken && gameState.currentTurn === playerToken) {
      return true;
    }
    if (joinedUsername && gameState.currentTurn === joinedUsername) {
      return true;
    }
    return false;
  })();

  const applyGamePayload = (payload: GamePayload) => {
    setGameState((prev) => {
      const board =
        payload.board || payload.game?.board || prev.board;
      const currentTurn =
        payload.currentTurn || payload.turn || prev.currentTurn;
      const gameStatus =
        payload.gameStatus || payload.status || prev.gameStatus;
      const winner =
        payload.winner || payload.result?.winner || prev.winner;
      const resultReason =
        payload.resultReason ||
        payload.reason ||
        payload.outcome ||
        prev.resultReason;

      return {
        board,
        currentTurn,
        gameStatus,
        winner,
        resultReason,
      };
    });

    if (typeof payload.yourTurn === "boolean") {
      setYourTurnOverride(payload.yourTurn);
    }

    const tokenCandidate =
      payload.playerToken ||
      payload.playerSymbol ||
      payload.playerId ||
      payload.you;

    if (tokenCandidate) {
      setPlayerToken(tokenCandidate);
    }
  };

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || connectionStatus !== "disconnected") {
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;
    setConnectionStatus("connecting");

    socket.on("connect", () => {
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    socket.on("game_started", (payload: GamePayload) => {
      setGameState((prev) => ({
        ...prev,
        gameStatus: "ACTIVE",
        winner: null,
        resultReason: null,
      }));
      applyGamePayload(payload);
    });

    socket.on("game_update", (payload: GamePayload) => {
      applyGamePayload(payload);
    });

    socket.on("game_over", (payload: GamePayload) => {
      setGameState((prev) => ({
        ...prev,
        gameStatus: "ENDED",
      }));
      applyGamePayload(payload);
      setYourTurnOverride(false);
      setLeaderboardRefreshKey((prev) => prev + 1);
    });

    socket.connect();
    socket.emit("join_game", { username: trimmed });
    setJoinedUsername(trimmed);
  };

  const handleColumnClick = (columnIndex: number) => {
    if (!socketRef.current || !isYourTurn) {
      return;
    }
    socketRef.current.emit("make_move", { columnIndex });
  };

  const handlePlayAgain = () => {
    window.location.reload();
  };

  const renderStatus = () => {
    if (gameState.gameStatus === "WAITING") {
      return "Waiting for opponent...";
    }
    if (gameState.gameStatus === "ACTIVE") {
      return isYourTurn ? "Your turn" : "Opponent's turn";
    }
    if (gameState.winner) {
      return `${gameState.winner} wins${
        gameState.resultReason ? ` (${gameState.resultReason})` : ""
      }`;
    }
    if (gameState.resultReason) {
      return gameState.resultReason;
    }
    return "Game ended";
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Connect Four</h1>
          <p className="muted">Real-time play with Socket.IO</p>
        </div>
        <div className="connection">
          <span className={`status status--${connectionStatus}`}>
            {connectionStatus}
          </span>
        </div>
      </header>

      {!joinedUsername ? (
        <form className="card" onSubmit={handleJoin}>
          <label htmlFor="username">Enter your username</label>
          <div className="input-row">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Your name"
              required
            />
            <button type="submit">Join</button>
          </div>
        </form>
      ) : (
        <main className="content">
          <section className="game-area">
            <div className="status-row">
              <h2>{renderStatus()}</h2>
              {gameState.gameStatus === "ENDED" && (
                <button type="button" onClick={handlePlayAgain}>
                  Play Again
                </button>
              )}
            </div>
            <Board
              board={gameState.board}
              onColumnClick={handleColumnClick}
              disabled={
                !isYourTurn || gameState.gameStatus !== "ACTIVE"
              }
            />
          </section>
          <Leaderboard refreshKey={leaderboardRefreshKey} />
        </main>
      )}
    </div>
  );
}

export default App;
