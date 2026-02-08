"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gemImage from "../assets/images/gem.png";
import mineImage from "../assets/images/mine.png";
import { Gameplay } from "../classes/Gameplay";
import { AutoMode } from "../classes/AutoMode";

type GridCreatorProps = {
  rows?: number;
  cols?: number;
};

export default function GridCreator({ rows = 5, cols = 5 }: GridCreatorProps) {
  const [opened, setOpened] = useState<boolean[]>(
    Array(rows * cols).fill(false)
  );
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [revealedMines, setRevealedMines] = useState<boolean[]>(
    Array(rows * cols).fill(false)
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [playAmountIndex, setPlayAmountIndex] = useState(0);
  const [minesCount, setMinesCount] = useState(1);
  const [credit, setCredit] = useState(10000);
  const [multiplier, setMultiplier] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState(0);
  const [controlMode, setControlMode] = useState<"manual" | "auto">("manual");
  const [selectedTiles, setSelectedTiles] = useState<boolean[]>(Array(rows * cols).fill(false));
  const [autoPlayCount, setAutoPlayCount] = useState(1);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [autoPlayResult, setAutoPlayResult] = useState<"win" | "loss" | null>(null);
  const playAmounts = [10, 20, 30, 50, 100, 200];
  const gameplayRef = useRef<Gameplay | null>(null);
  const autoModeRef = useRef<AutoMode | null>(null);
  const autoPlayLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleClick = (i: number) => {
    if (!gameStarted || !gameplayRef.current || gameOver) return;
    
    const result = gameplayRef.current.revealCell(i);
    
    if (result.success) {
      const newOpened = opened.slice();
      newOpened[i] = true;
      setOpened(newOpened);
      
      if (result.isMine) {
        // Hit a mine - reveal it immediately, then reveal all mines after 0.5 sec
        const allMines = gameplayRef.current.getMinePositions();
        const newRevealedMines = Array(rows * cols).fill(false);
        newRevealedMines[i] = true; // Show the hit mine immediately
        setRevealedMines(newRevealedMines);
        
        // After 0.5 seconds, reveal all mines
        setTimeout(() => {
          const allMinesRevealed = Array(rows * cols).fill(false);
          allMines.forEach(minePos => {
            allMinesRevealed[minePos] = true;
          });
          setRevealedMines(allMinesRevealed);
        }, 500);
        
        setGameOver(true);
        setGameStarted(false);
      } else {
        // Update multiplier
        const currentMultiplier = gameplayRef.current.getMultiplier();
        setMultiplier(currentMultiplier);
      }
    }
  };

  const handlePlayButton = () => {
    if (gameStarted) {
      // Cashout
      if (gameplayRef.current) {
        const winnings = gameplayRef.current.cashout();
        setCredit(credit + winnings);
        setCashoutAmount(winnings);
        setShowCashoutModal(true);
        setGameStarted(false);
        setGameOver(false);
        setOpened(Array(rows * cols).fill(false));
        setRevealedMines(Array(rows * cols).fill(false));
        setMultiplier(1);
      }
    } else {
      // Start new game
      const betAmount = playAmounts[playAmountIndex];
      if (credit < betAmount) {
        alert('Insufficient credits!');
        return;
      }
      
      setCredit(credit - betAmount);
      gameplayRef.current = new Gameplay(rows, cols, minesCount, betAmount);
      gameplayRef.current.startGame();
      setMinePositions(new Set(gameplayRef.current.getMinePositions()));
      setGameStarted(true);
      setGameOver(false);
      setOpened(Array(rows * cols).fill(false));
      setRevealedMines(Array(rows * cols).fill(false));
      setMultiplier(1);
    }
  };

  const handleIncreaseAmount = () => {
    if (playAmountIndex < playAmounts.length - 1) {
      setPlayAmountIndex(playAmountIndex + 1);
    }
  };

  const handleDecreaseAmount = () => {
    if (playAmountIndex > 0) {
      setPlayAmountIndex(playAmountIndex - 1);
    }
  };

  const handlePickRandom = () => {
    if (!gameStarted || !gameplayRef.current || gameOver) return;
    
    // Get unopened cells
    const unopenedCells: number[] = [];
    for (let i = 0; i < rows * cols; i++) {
      if (!opened[i]) {
        unopenedCells.push(i);
      }
    }
    
    if (unopenedCells.length === 0) return;
    
    // Pick a random cell
    const randomIndex = Math.floor(Math.random() * unopenedCells.length);
    const cellToOpen = unopenedCells[randomIndex];
    
    handleClick(cellToOpen);
  };

  const handleTileSelect = (i: number) => {
    if (controlMode === "auto" && !gameStarted) {
      const newSelected = selectedTiles.slice();
      newSelected[i] = !newSelected[i];
      setSelectedTiles(newSelected);
    }
  };

  const handleStartAutoPlay = () => {
    const selectedCount = selectedTiles.filter(s => s).length;
    
    // Must have at least one tile selected
    if (controlMode !== "auto" || selectedCount === 0) return;
    
    if (!gameStarted) {
      const betAmount = playAmounts[playAmountIndex];
      if (credit < betAmount) {
        alert('Insufficient credits!');
        return;
      }
      
      setCredit(credit - betAmount);
      gameplayRef.current = new Gameplay(rows, cols, minesCount, betAmount);
      gameplayRef.current.startGame();
      setMinePositions(new Set(gameplayRef.current.getMinePositions()));
      setGameStarted(true);
      setGameOver(false);
      setOpened(Array(rows * cols).fill(false));
      setRevealedMines(Array(rows * cols).fill(false));
      setMultiplier(1);
    }
    
    setAutoPlayActive(true);
  };

  const handleStopAutoPlay = () => {
    setAutoPlayActive(false);
    if (autoPlayLoopRef.current) {
      clearInterval(autoPlayLoopRef.current);
      autoPlayLoopRef.current = null;
    }
  };

  // Reset selectedTiles when minesCount changes
  useEffect(() => {
    setSelectedTiles(Array(rows * cols).fill(false));
  }, [minesCount, rows, cols]);

  // Auto mode auto-pick behavior (manual mode)
  useEffect(() => {
    if (!autoModeRef.current) {
      autoModeRef.current = new AutoMode(600);
    }

    const auto = autoModeRef.current;
    const shouldRun = controlMode === "auto" && gameStarted && !gameOver && !showCashoutModal && !autoPlayActive;

    if (shouldRun) {
      auto.start(() => {
        handlePickRandom();
      });
    } else {
      auto.stop();
    }

    return () => {
      auto.stop();
    };
  }, [controlMode, gameStarted, gameOver, showCashoutModal, opened, autoPlayActive]);

  // Auto play loop effect
  useEffect(() => {
    if (!autoPlayActive || !gameStarted || !gameplayRef.current) return;

    let isRunning = true;
    
    const roundLoop = async () => {
      let roundNumber = 0;
      const totalCells = rows * cols;
      const playCount = autoPlayCount;
      const selected = selectedTiles.slice();
      
      while (isRunning && roundNumber < playCount) {
        roundNumber++;
        
        // Reveal all tiles
        setOpened(Array(totalCells).fill(true));
        
        // Check win condition: all gems (non-mine cells) must be in selectedTiles
        const gemsInSelectedTiles = Array.from({length: totalCells}).every((_, i) => 
          minePositions.has(i) || selected[i]
        );
        
        const isWin = gemsInSelectedTiles;
        setAutoPlayResult(isWin ? "win" : "loss");
        
        // Wait 1 second before next round
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isRunning && roundNumber < playCount) {
          // Reset for next round
          setOpened(Array(totalCells).fill(false));
          setRevealedMines(Array(totalCells).fill(false));
          gameplayRef.current?.reset();
          gameplayRef.current?.startGame();
          setMinePositions(new Set(gameplayRef.current?.getMinePositions() || []));
        }
      }
      
      if (isRunning) {
        setAutoPlayActive(false);
      }
    };
    
    roundLoop();

    return () => {
      isRunning = false;
    };
  }, [autoPlayActive, gameStarted]);

  const cells: number[] = Array.from({ length: rows * cols }, (_, i) => i);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-amber-200 rounded-lg px-8 pb-8 pt-4 min-h-screen flex flex-col items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center justify-between mx-auto" style={{ width: cols * 60 }}>
            <div className="bg-white/50 rounded-lg px-4 py-2 flex items-center justify-center" style={{ width: 140, height: 30 }}>
              <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">Credit: {credit.toFixed(2)}</p>
            </div>
            {gameStarted && (
              <div className="bg-white/50 rounded-lg px-4 py-2 flex items-center justify-center" style={{ width: 140, height: 30 }}>
                <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">Multiplier: {multiplier.toFixed(2)}x</p>
              </div>
            )}
          </div>
          <div
            className="grid gap-2 mx-auto"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, width: cols * 60 }}
          >
            {cells.map((i) => {
              const isSelected = controlMode === "auto" && selectedTiles[i];
              const isAutoTileSelection = controlMode === "auto" && !gameStarted;
              
              return revealedMines[i] ? (
                <div key={i} className="w-full aspect-square border border-sky-400 rounded-lg inline-flex items-center justify-center bg-red-100" aria-label={`mine-${i}`}>
                  <Image src={mineImage} alt="mine" className="w-[90%] h-[90%] object-contain" width={60} height={60} />
                </div>
              ) : opened[i] ? (
                <div key={i} className="w-full aspect-square border border-sky-400 rounded-lg inline-flex items-center justify-center bg-transparent" aria-label={`gem-${i}`}>
                  <Image src={gemImage} alt="gem" className="w-[90%] h-[90%] object-contain" width={60} height={60} />
                </div>
              ) : (
                <button
                  key={i}
                  className={`w-full aspect-square border border-sky-400 rounded-lg inline-flex items-center justify-center cursor-pointer active:translate-y-0.5 ${
                    isSelected 
                      ? "bg-orange-400 border-orange-500" 
                      : "bg-sky-100"
                  }`}
                  onClick={() => {
                    if (isAutoTileSelection) {
                      handleTileSelect(i);
                    } else {
                      handleClick(i);
                    }
                  }}
                  disabled={isAutoTileSelection && gameStarted}
                  aria-label={`cell-${i}`}
                />
              );
            })}
          </div>
          {autoPlayActive && autoPlayResult && (
            <div
              className={`text-lg font-bold text-center py-2 px-4 rounded-lg mx-auto mt-2 ${
                autoPlayResult === "win"
                  ? "bg-green-100 text-green-800 border border-green-400"
                  : "bg-red-100 text-red-800 border border-red-400"
              }`}
            >
              {autoPlayResult === "win" ? "🎉 You Won!" : "❌ You Lost!"}
            </div>
          )}
          <div className="mx-auto mt-2" style={{ width: cols * 60 }}>
            <div className="flex bg-white/50 border border-gray-400 rounded-lg p-0.5">
              <button
                className={`flex-1 rounded-md text-[10px] font-semibold flex items-center justify-center ${
                  controlMode === "manual" ? "bg-white text-gray-900" : "text-gray-700 hover:text-gray-900"
                }`}
                style={{ height: 26 }}
                onClick={() => setControlMode("manual")}
              >
                Manual
              </button>
              <button
                className={`flex-1 rounded-md text-[10px] font-semibold flex items-center justify-center ${
                  controlMode === "auto" ? "bg-white text-gray-900" : "text-gray-700 hover:text-gray-900"
                }`}
                style={{ height: 26 }}
                onClick={() => setControlMode("auto")}
              >
                Auto
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-2 -mt-2">
            <div className="mx-auto" style={{ width: cols * 60 }}>
              <div className="flex items-center justify-between">
                {controlMode === "manual" ? (
                  <>
                    <button
                      className={`rounded-lg text-xs font-semibold active:translate-y-0.5 flex items-center justify-center ${gameStarted ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      style={{ width: 140, height: 30 }}
                      onClick={handlePlayButton}
                    >
                      {gameStarted ? 'Cashout' : 'Play'}
                    </button>
                    <div className="bg-white/50 border border-gray-400 rounded-lg flex items-center justify-between px-1" style={{ width: 140, height: 30 }}>
                      <button
                        className="bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 flex items-center justify-center text-xs disabled:opacity-50"
                        style={{ width: 24, height: 24 }}
                        onClick={handleDecreaseAmount}
                        disabled={playAmountIndex === 0 || gameStarted}
                      >
                        −
                      </button>
                      <p className="text-xs font-bold text-gray-800 text-center flex items-center justify-center">{playAmounts[playAmountIndex]}</p>
                      <button
                        className="bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 flex items-center justify-center text-xs disabled:opacity-50"
                        style={{ width: 24, height: 24 }}
                        onClick={handleIncreaseAmount}
                        disabled={playAmountIndex === playAmounts.length - 1 || gameStarted}
                      >
                        +
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      className={`rounded-lg text-xs font-semibold active:translate-y-0.5 flex items-center justify-center ${
                        autoPlayActive 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : selectedTiles.filter(s => s).length > 0 && !gameStarted
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed disabled:opacity-50'
                      }`}
                      style={{ width: 140, height: 30 }}
                      onClick={autoPlayActive ? handleStopAutoPlay : handleStartAutoPlay}
                      disabled={!autoPlayActive && selectedTiles.filter(s => s).length === 0}
                    >
                      {autoPlayActive ? 'Stop Auto' : 'Start Auto'}
                    </button>
                    <div className="bg-white/50 border border-gray-400 rounded-lg flex items-center justify-between px-1" style={{ width: 140, height: 30 }}>
                      <button
                        className="bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 flex items-center justify-center text-xs disabled:opacity-50"
                        style={{ width: 24, height: 24 }}
                        onClick={handleDecreaseAmount}
                        disabled={playAmountIndex === 0 || gameStarted}
                      >
                        −
                      </button>
                      <p className="text-xs font-bold text-gray-800 text-center flex items-center justify-center">{playAmounts[playAmountIndex]}</p>
                      <button
                        className="bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 flex items-center justify-center text-xs disabled:opacity-50"
                        style={{ width: 24, height: 24 }}
                        onClick={handleIncreaseAmount}
                        disabled={playAmountIndex === playAmounts.length - 1 || gameStarted}
                      >
                        +
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mx-auto" style={{ width: cols * 60 }}>
              <div className="flex justify-between">
                {controlMode === "manual" ? (
                  <>
                    <select
                      value={minesCount}
                      onChange={(e) => setMinesCount(Number(e.target.value))}
                      className="pl-4 pr-2 border border-gray-400 rounded-lg bg-white text-gray-800 font-semibold text-xs flex items-center disabled:opacity-50"
                      style={{ width: 140, height: 30 }}
                      disabled={gameStarted}
                    >
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} Mines
                        </option>
                      ))}
                    </select>
                    <button
                      className="bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 text-xs flex items-center justify-center disabled:opacity-50"
                      style={{ width: 140, height: 30 }}
                      onClick={handlePickRandom}
                      disabled={!gameStarted || gameOver}
                    >
                      Pick Random
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      value={minesCount}
                      onChange={(e) => setMinesCount(Number(e.target.value))}
                      className="pl-4 pr-2 border border-gray-400 rounded-lg bg-white text-gray-800 font-semibold text-xs flex items-center disabled:opacity-50"
                      style={{ width: 140, height: 30 }}
                      disabled={gameStarted}
                    >
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} Mines
                        </option>
                      ))}
                    </select>
                    <div
                      className="bg-white/50 border border-gray-400 rounded-lg flex items-center px-1"
                      style={{ width: 140, height: 30 }}
                    >
                      <span className="text-[10px] font-semibold text-gray-800 pl-1" style={{ width: 80 }}>
                        AutoCount
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={autoPlayCount}
                        onChange={(e) => setAutoPlayCount(Math.max(1, Number(e.target.value) || 1))}
                        className="bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 text-center"
                        style={{ width: 24, height: 24 }}
                        disabled={autoPlayActive}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cashout Modal */}
      {showCashoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-2xl p-12 flex flex-col items-center gap-6 shadow-2xl" style={{ width: 300, height: 300 }}>
            <h2 className="text-2xl font-bold text-gray-800">You Won!</h2>
            <p className="text-5xl font-bold text-green-600">${cashoutAmount.toFixed(2)}</p>
            <button
              onClick={() => setShowCashoutModal(false)}
              className="mt-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    
  );
}
