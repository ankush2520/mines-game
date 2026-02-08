"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import gemImage from "../assets/images/gem.png";
import mineImage from "../assets/images/mine.png";
import { Gameplay } from "../classes/Gameplay";

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
  const playAmounts = [10, 20, 30, 50, 100, 200];
  const gameplayRef = useRef<Gameplay | null>(null);

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

  const cells: number[] = Array.from({ length: rows * cols }, (_, i) => i);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-amber-200 rounded-lg p-8 min-h-screen flex flex-col items-center pt-4">
        <div className="flex items-center justify-between mb-4 mx-auto" style={{ width: cols * 60 }}>
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
        {cells.map((i) =>
          revealedMines[i] ? (
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
              className="w-full aspect-square bg-sky-100 border border-sky-400 rounded-lg inline-flex items-center justify-center cursor-pointer active:translate-y-0.5"
              onClick={() => handleClick(i)}
              aria-label={`cell-${i}`}
            />
          )
        )}
      </div>
      <div className="mt-6 mb-0 mx-auto" style={{ width: cols * 60 }}>
        <div className="flex items-center justify-between">
        <button
          className={`rounded-lg text-xs font-semibold active:translate-y-0.5 flex items-center justify-center ${gameStarted ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          style={{ width: 140, height: 30 }}
          onClick={handlePlayButton}
        >
          {gameStarted ? 'Cashout' : 'Play'}
        </button>
        <div className="bg-white/50 rounded-lg flex items-center justify-between px-1" style={{ width: 140, height: 30 }}>
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
        </div>
      </div>
      <div className="mt-3 mx-auto" style={{ width: cols * 60 }}>
        <div className="flex justify-between">
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
    </div>
  );
}
