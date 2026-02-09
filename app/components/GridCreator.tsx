"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Settings2 } from "lucide-react";
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
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  const [showAutoSettings, setShowAutoSettings] = useState(false);
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
    <div className="flex flex-col items-center w-full max-h-[calc(100vh-32px)] overflow-hidden">
      <div className="w-full flex-1 overflow-y-auto" style={{ backgroundColor: 'rgba(17, 26, 46, 0.8)' }}>
        {/* Master wrapper - controls ALL width */}
        <div className="w-full max-w-[340px] mx-auto px-3 flex flex-col gap-2 py-3">
          <div className="flex items-center justify-between gap-2 shrink-0 w-full">
            <div className="rounded-xl px-3 py-1.5 flex items-center justify-center backdrop-blur-sm flex-1" style={{ minWidth: 100, height: 28, backgroundColor: '#172445', border: '1px solid #2B3F70', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)' }}>
              <p className="text-[10px] font-semibold whitespace-nowrap" style={{ color: '#EAF0FF' }}>Credit: {credit.toFixed(2)}</p>
            </div>
            {gameStarted && (
              <div className="rounded-xl px-3 py-1.5 flex items-center justify-center backdrop-blur-sm flex-1" style={{ minWidth: 100, height: 28, backgroundColor: '#172445', border: '1px solid #2B3F70', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)' }}>
                <p className="text-[10px] font-semibold whitespace-nowrap" style={{ color: '#EAF0FF' }}>Multiplier: {multiplier.toFixed(2)}x</p>
              </div>
            )}
          </div>
          
          {/* Grid Panel */}
          <div className="rounded-xl p-3 w-full shrink-0" style={{ backgroundColor: '#172445', border: '1px solid #2B3F70', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
            <div
              className="grid gap-2 w-full aspect-square mx-auto"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {cells.map((i) => {
                const isSelected = controlMode === "auto" && selectedTiles[i];
                const isAutoTileSelection = controlMode === "auto" && !gameStarted;
                
                return revealedMines[i] ? (
                  <div key={i} className="w-full aspect-square rounded-md inline-flex items-center justify-center tile-hover overflow-hidden" style={{ backgroundColor: '#203056', border: '1px solid #2B3F70', boxShadow: '0 4px 12px rgba(32, 48, 86, 0.4)' }} aria-label={`mine-${i}`}>
                    <Image src={mineImage} alt="mine" className="scale-[1.8] object-contain pointer-events-none select-none" width={60} height={60} />
                  </div>
                ) : opened[i] ? (
                  <div key={i} className="w-full aspect-square rounded-md inline-flex items-center justify-center tile-hover overflow-hidden" style={{ backgroundColor: '#203056', border: '1px solid #2B3F70', boxShadow: '0 4px 12px rgba(32, 48, 86, 0.4)' }} aria-label={`gem-${i}`}>
                    <Image src={gemImage} alt="gem" className="scale-[1.8] object-contain pointer-events-none select-none" width={60} height={60} />
                  </div>
                ) : (
                  <button
                    key={i}
                    className="w-full aspect-square rounded-md inline-flex items-center justify-center cursor-pointer tile-hover transition-all duration-200"
                    style={{
                      backgroundColor: isSelected ? '#3B82F6' : (hoveredTile === i ? '#2B3F70' : '#203056'),
                      border: isSelected ? '1px solid #3B82F6' : '1px solid #223055',
                      boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.5)' : (hoveredTile === i ? '0 4px 12px rgba(43, 63, 112, 0.6)' : '0 2px 6px rgba(0, 0, 0, 0.3)')
                    }}
                    onClick={() => {
                      if (isAutoTileSelection) {
                        handleTileSelect(i);
                      } else {
                        handleClick(i);
                      }
                    }}
                    onMouseEnter={() => !isAutoTileSelection && setHoveredTile(i)}
                    onMouseLeave={() => setHoveredTile(null)}
                    disabled={isAutoTileSelection && gameStarted}
                    aria-label={`cell-${i}`}
                  />
                );
              })}
            </div>
          </div>
          {autoPlayActive && autoPlayResult && (
            <div
              className="text-xs font-bold text-center py-1.5 px-3 rounded-lg mx-auto shrink-0"
              style={{
                backgroundColor: autoPlayResult === "win" ? '#22C55E' : '#EF4444',
                color: '#FFFFFF',
                border: autoPlayResult === "win" ? '2px solid #16A34A' : '2px solid #DC2626'
              }}
            >
              {autoPlayResult === "win" ? "🎉 Won!" : "❌ Lost!"}
            </div>
          )}
          
          {/* Control Panel */}
          <div className="rounded-lg p-3 w-full shrink-0" style={{ backgroundColor: '#172445', border: '1px solid #2B3F70', boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
            <div className="grid grid-cols-2 gap-2 items-stretch w-full">
              
              {/* Row 1: Segmented Control (Manual/Auto) | Auto Settings Icon Button */}
              <div className="h-7 rounded-full p-0.5 flex w-full" style={{ backgroundColor: 'rgba(17, 26, 46, 0.7)', border: '1px solid rgba(43, 63, 112, 0.4)' }}>
                <button
                  className="flex-1 h-full rounded-full text-[11px] font-semibold leading-none flex items-center justify-center transition whitespace-nowrap"
                  style={{
                    color: controlMode === "manual" ? '#FFFFFF' : '#A7B2D6',
                    backgroundColor: controlMode === "manual" ? '#3B82F6' : 'transparent',
                    boxShadow: controlMode === "manual" ? '0 1px 3px rgba(59, 130, 246, 0.5)' : 'none'
                  }}
                  onClick={() => setControlMode("manual")}
                  onMouseEnter={(e) => {
                    if (controlMode !== "manual") {
                      e.currentTarget.style.color = '#EAF0FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (controlMode !== "manual") {
                      e.currentTarget.style.color = '#A7B2D6';
                    }
                  }}
                >
                  Manual
                </button>
                <button
                  className="flex-1 h-full rounded-full text-[11px] font-semibold leading-none flex items-center justify-center transition whitespace-nowrap"
                  style={{
                    color: controlMode === "auto" ? '#FFFFFF' : '#A7B2D6',
                    backgroundColor: controlMode === "auto" ? '#3B82F6' : 'transparent',
                    boxShadow: controlMode === "auto" ? '0 1px 3px rgba(59, 130, 246, 0.5)' : 'none'
                  }}
                  onClick={() => setControlMode("auto")}
                  onMouseEnter={(e) => {
                    if (controlMode !== "auto") {
                      e.currentTarget.style.color = '#EAF0FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (controlMode !== "auto") {
                      e.currentTarget.style.color = '#A7B2D6';
                    }
                  }}
                >
                  Auto
                </button>
              </div>
              
              {/* Row 1 Col 2: Auto Settings Button */}
              <div className="justify-self-end">
                <button
                  onClick={() => setShowAutoSettings(true)}
                  className="h-7 w-7 rounded-md flex items-center justify-center transition"
                  style={{
                    backgroundColor: 'rgba(17, 26, 46, 0.7)',
                    border: '1px solid rgba(43, 63, 112, 0.4)',
                    color: '#EAF0FF'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(17, 26, 46, 0.7)';
                  }}
                  title="Auto settings"
                >
                  <Settings2 size={16} />
                </button>
              </div>
              
              {/* Row 2: Play Button | Bet Stepper */}
              <button
                className="h-7 w-full rounded-md px-3 text-xs font-semibold leading-none flex items-center justify-center transition"
                style={{
                  backgroundColor: gameStarted ? '#10B981' : '#3B82F6',
                  color: '#FFFFFF',
                  boxShadow: gameStarted ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.2)'
                }}
                onClick={handlePlayButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.filter = 'brightness(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }}
              >
                {gameStarted ? 'Cashout' : 'Play'}
              </button>
              
              {/* Row 2 Col 2: Bet Stepper */}
              <div className="h-7 w-full rounded-md flex items-center justify-between px-1" style={{ backgroundColor: 'rgba(17, 26, 46, 0.6)', border: '1px solid rgba(43, 63, 112, 0.4)' }}>
                <button
                  className="h-6 w-6 rounded flex items-center justify-center transition text-xs font-medium" 
                  style={{ 
                    backgroundColor: 'rgba(17, 26, 46, 0.7)',
                    border: '1px solid rgba(43, 63, 112, 0.4)',
                    color: '#EAF0FF'
                  }}
                  onClick={handleDecreaseAmount}
                  disabled={playAmountIndex === 0 || gameStarted}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(17, 26, 46, 0.7)';
                  }}
                >
                  <span className="leading-none">−</span>
                </button>
                <p className="flex-1 text-xs font-semibold text-center tabular-nums leading-none" style={{ color: '#EAF0FF' }}>{playAmounts[playAmountIndex]}</p>
                <button
                  className="h-6 w-6 rounded flex items-center justify-center transition text-xs font-medium"
                  style={{ 
                    backgroundColor: 'rgba(17, 26, 46, 0.7)',
                    border: '1px solid rgba(43, 63, 112, 0.4)',
                    color: '#EAF0FF'
                  }}
                  onClick={handleIncreaseAmount}
                  disabled={playAmountIndex === playAmounts.length - 1 || gameStarted}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(17, 26, 46, 0.7)';
                  }}
                >
                  <span className="leading-none">+</span>
                </button>
              </div>
              
              {/* Row 3 Col 1: Mines Selector */}
              <select
                value={minesCount}
                onChange={(e) => setMinesCount(Number(e.target.value))}
                className="h-7 w-full rounded-md px-2.5 text-xs font-medium leading-none disabled:opacity-50 transition appearance-none"
                style={{
                  backgroundColor: 'rgba(17, 26, 46, 0.7)',
                  border: '1px solid rgba(43, 63, 112, 0.4)',
                  color: '#EAF0FF',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23A7B2D6%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.2em 1.2em',
                  paddingRight: '2rem'
                }}
                disabled={gameStarted}
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num} style={{ backgroundColor: '#111A2E', color: '#EAF0FF' }}>
                    {num} Mines
                  </option>
                ))}
              </select>
              
              {/* Row 3 Col 2: Pick Random or Auto Counter */}
              {controlMode === "manual" ? (
                <button
                  className="h-7 w-full rounded-md px-2.5 text-xs font-medium leading-none flex items-center justify-center transition"
                  style={{
                    backgroundColor: 'rgba(17, 26, 46, 0.7)',
                    border: '1px solid rgba(43, 63, 112, 0.4)',
                    color: '#EAF0FF'
                  }}
                  onClick={handlePickRandom}
                  disabled={!gameStarted || gameOver}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(17, 26, 46, 0.7)';
                  }}
                >
                  Pick Random
                </button>
              ) : (
                <div className="h-7 w-full rounded-md flex items-center justify-between px-2 min-w-0" style={{ backgroundColor: 'rgba(17, 26, 46, 0.7)', border: '1px solid rgba(43, 63, 112, 0.4)' }}>
                  <span className="text-xs font-medium flex-shrink-0 leading-none" style={{ color: '#A7B2D6' }}>Auto</span>
                  <input
                    type="number"
                    min={1}
                    value={autoPlayCount}
                    onChange={(e) => setAutoPlayCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 flex-shrink-0 text-xs font-semibold text-center tabular-nums leading-none transition appearance-none outline-none"
                    style={{
                      backgroundColor: 'transparent',
                      color: '#EAF0FF',
                      border: 'none'
                    }}
                    disabled={autoPlayActive}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cashout Modal */}
      {showCashoutModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
          <div className="rounded-2xl p-12 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300" style={{ width: 320, minHeight: 320, backgroundColor: '#111A2E', border: '2px solid #22C55E', boxShadow: '0 25px 50px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.2)' }}>
            <h2 className="text-3xl font-bold" style={{ color: '#22C55E' }}>You Won!</h2>
            <p className="text-6xl font-bold text-center" style={{ color: '#22C55E' }}>${cashoutAmount.toFixed(2)}</p>
            <button
              onClick={() => setShowCashoutModal(false)}
              className="mt-auto text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 hover:brightness-110 hover:scale-105 active:scale-95"
              style={{ 
                backgroundColor: '#22C55E',
                boxShadow: '0 8px 20px rgba(34, 197, 94, 0.6)'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Auto Settings Modal */}
      {showAutoSettings && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
          <div className="rounded-2xl p-8 flex flex-col gap-6 animate-in fade-in zoom-in duration-300" style={{ width: 360, backgroundColor: '#111A2E', border: '1px solid #2B3F70', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#EAF0FF' }}>Auto Mode Settings</h2>
              <button
                onClick={() => setShowAutoSettings(false)}
                className="text-2xl flex items-center justify-center w-8 h-8 hover:brightness-110 transition-all"
                style={{ color: '#A7B2D6' }}
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#A7B2D6' }}>Number of Mines</label>
                <select
                  value={minesCount}
                  onChange={(e) => setMinesCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    backgroundColor: '#172445',
                    border: '1px solid #2B3F70',
                    color: '#EAF0FF'
                  }}
                  disabled={gameStarted || autoPlayActive}
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num} style={{ backgroundColor: '#111A2E', color: '#EAF0FF' }}>
                      {num} Mines
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#A7B2D6' }}>Bet Amount</label>
                <div className="flex items-center gap-2">
                  <button
                    className="h-8 w-8 rounded-lg font-bold flex items-center justify-center transition-all"
                    style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                    onClick={handleDecreaseAmount}
                    disabled={playAmountIndex === 0 || gameStarted}
                  >
                    −
                  </button>
                  <div className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-center" style={{ backgroundColor: '#172445', border: '1px solid #2B3F70', color: '#EAF0FF' }}>
                    ${playAmounts[playAmountIndex]}
                  </div>
                  <button
                    className="h-8 w-8 rounded-lg font-bold flex items-center justify-center transition-all"
                    style={{ backgroundColor: '#22C55E', color: '#FFFFFF' }}
                    onClick={handleIncreaseAmount}
                    disabled={playAmountIndex === playAmounts.length - 1 || gameStarted}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#A7B2D6' }}>Runs</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={autoPlayCount}
                  onChange={(e) => setAutoPlayCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    backgroundColor: '#172445',
                    border: '1px solid #2B3F70',
                    color: '#EAF0FF'
                  }}
                  disabled={autoPlayActive}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAutoSettings(false)}
                className="flex-1 h-10 rounded-xl font-semibold text-sm transition-all"
                style={{
                  backgroundColor: 'rgba(167, 178, 214, 0.1)',
                  color: '#EAF0FF'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(167, 178, 214, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(167, 178, 214, 0.1)';
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    
  );
}
