"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Settings2 } from "lucide-react";
import gemImage from "../assets/images/gem.png";
import mineImage from "../assets/images/mine.png";
import { Gameplay } from "../classes/Gameplay";
import { AutoMode } from "../classes/AutoMode";
import { COLORS, SIZES, SHADOWS, BORDERS } from "../../constants/design-tokens";
import {
  BET_AMOUNTS,
  CONTROL_MODES,
  AUTO_MODE,
  GAME_BOARD,
} from "../../constants/config";
import {
  panelStyle,
  surfaceStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  cashoutButtonStyle,
  iconButtonStyle,
  tileDefaultStyle,
  segmentedContainerStyle,
  segmentActiveStyle,
  segmentInactiveStyle,
  inputStyle,
  selectStyle,
  createBrightnessHandler,
  getTileStyle,
  mergeStyles,
} from "../../utils/styles";

type GridCreatorProps = {
  rows?: number;
  cols?: number;
};

export default function GridCreator({
  rows = GAME_BOARD.rows,
  cols = GAME_BOARD.cols,
}: GridCreatorProps) {
  // ========== GAME STATE ==========
  const [opened, setOpened] = useState<boolean[]>(
    Array(rows * cols).fill(false),
  );
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [revealedMines, setRevealedMines] = useState<boolean[]>(
    Array(rows * cols).fill(false),
  );
  const [clickedByUser, setClickedByUser] = useState<boolean[]>(
    Array(rows * cols).fill(false),
  );
  const [autoRevealed, setAutoRevealed] = useState<boolean[]>(
    Array(rows * cols).fill(false),
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [multiplier, setMultiplier] = useState(1);

  // ========== PLAYER STATE ==========
  const [credit, setCredit] = useState(10000);
  const [betAmount, setBetAmount] = useState(10.0);
  const [minesCount, setMinesCount] = useState(1);

  // ========== UI STATE ==========
  const [controlMode, setControlMode] = useState<"manual" | "auto">("manual");
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [showAutoSettings, setShowAutoSettings] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState(0);

  // ========== AUTO MODE STATE ==========
  const [selectedTiles, setSelectedTiles] = useState<boolean[]>(
    Array(rows * cols).fill(false),
  );
  const [autoPlayCount, setAutoPlayCount] = useState(1);
  const [autoPickCount, setAutoPickCount] = useState(1);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [autoPlayResult, setAutoPlayResult] = useState<"win" | "loss" | null>(
    null,
  );
  const [showAutoModeWinPanel, setShowAutoModeWinPanel] = useState(false);
  const [autoWinAmount, setAutoWinAmount] = useState(0);
  const [autoMultiplier, setAutoMultiplier] = useState(1);

  // ========== AUTO MODE STRATEGY & STOP CONDITIONS ==========
  const [stopOnProfitEnabled, setStopOnProfitEnabled] = useState(false);
  const [stopOnProfitAmount, setStopOnProfitAmount] = useState(0);
  const [stopOnLossEnabled, setStopOnLossEnabled] = useState(false);
  const [stopOnLossAmount, setStopOnLossAmount] = useState(0);
  const [onWinAction, setOnWinAction] = useState<
    "reset" | "increase" | "decrease" | "none"
  >("reset");
  const [onLossAction, setOnLossAction] = useState<
    "reset" | "increase" | "decrease" | "none"
  >("increase");
  const [onWinPercent, setOnWinPercent] = useState(0);
  const [onLossPercent, setOnLossPercent] = useState(0);

  // ========== REFS ==========
  const gameplayRef = useRef<Gameplay | null>(null);
  const autoModeRef = useRef<AutoMode | null>(null);
  const autoPlayLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialRunsRef = useRef(0);
  const creditAtAutoStartRef = useRef(0);
  const baseBetAmountRef = useRef(0);

  const handleClick = (i: number) => {
    if (!gameStarted || !gameplayRef.current || gameOver) return;

    const result = gameplayRef.current.revealCell(i);

    if (result.success) {
      const newOpened = opened.slice();
      const newClickedByUser = clickedByUser.slice();

      newOpened[i] = true;
      newClickedByUser[i] = true;
      setOpened(newOpened);
      setClickedByUser(newClickedByUser);

      if (result.isMine) {
        // Hit a mine - reveal the ENTIRE board
        const totalCells = rows * cols;
        const newRevealedMines = Array(totalCells).fill(false);
        const newOpenedFull = opened.slice();
        const newAutoRevealed = Array(totalCells).fill(false);

        const allMines = gameplayRef.current.getMinePositions();
        const minesSet = new Set(Array.from(allMines));

        // Reveal all tiles
        for (let idx = 0; idx < totalCells; idx++) {
          if (minesSet.has(idx)) {
            // It's a mine
            newRevealedMines[idx] = true;
          } else {
            // It's a gem
            newOpenedFull[idx] = true;
          }

          // Mark as auto-revealed if not the clicked tile
          if (idx !== i) {
            newAutoRevealed[idx] = true;
          }
        }

        setRevealedMines(newRevealedMines);
        setOpened(newOpenedFull);
        setAutoRevealed(newAutoRevealed);
        setGameOver(true);
        setGameStarted(false);
      } else {
        // Gem revealed - update multiplier
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
        setClickedByUser(Array(rows * cols).fill(false));
        setAutoRevealed(Array(rows * cols).fill(false));
        setMultiplier(1);
      }
    } else {
      // Start new game
      const betAmount = getPlayAmount();
      if (credit < betAmount) {
        alert("Insufficient credits!");
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
      setClickedByUser(Array(rows * cols).fill(false));
      setAutoRevealed(Array(rows * cols).fill(false));
      setMultiplier(1);
    }
  };

  const getPlayAmount = (): number => betAmount;

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
      const isCurrentlySelected = newSelected[i];
      const currentSelectedCount = newSelected.filter((s) => s).length;
      const maxSelectableTiles = rows * cols - minesCount;

      // Allow deselecting always, or selecting if below max
      if (isCurrentlySelected || currentSelectedCount < maxSelectableTiles) {
        newSelected[i] = !newSelected[i];
        setSelectedTiles(newSelected);
      }
    }
  };

  const handleStartAutoPlay = () => {
    const selectedCount = selectedTiles.filter((s) => s).length;

    // Must be in auto mode, idle, and have at least one tile selected
    if (
      controlMode !== "auto" ||
      selectedCount === 0 ||
      gameStarted ||
      autoPlayActive
    )
      return;

    setAutoPlayResult(null);
    initialRunsRef.current = autoPickCount;
    creditAtAutoStartRef.current = credit;
    baseBetAmountRef.current = betAmount;
    setAutoPlayActive(true);
  };

  const handleStopAutoPlay = () => {
    setAutoPlayActive(false);
    if (autoPlayLoopRef.current) {
      clearTimeout(autoPlayLoopRef.current);
      autoPlayLoopRef.current = null;
    }
    setOpened(Array(rows * cols).fill(false));
    setRevealedMines(Array(rows * cols).fill(false));
    setAutoRevealed(Array(rows * cols).fill(false));
    setClickedByUser(Array(rows * cols).fill(false));
  };

  // Reset selectedTiles when minesCount changes
  useEffect(() => {
    setSelectedTiles(Array(rows * cols).fill(false));
  }, [minesCount, rows, cols]);

  // Clamp runs input when switching to auto mode
  useEffect(() => {
    if (controlMode === "auto" && !gameStarted) {
      setAutoPickCount((prev) => Math.max(0, prev));
    }
  }, [controlMode, gameStarted]);

  // Reset grid when switching to auto mode
  useEffect(() => {
    if (controlMode === "auto") {
      setOpened(Array(rows * cols).fill(false));
      setRevealedMines(Array(rows * cols).fill(false));
      setAutoRevealed(Array(rows * cols).fill(false));
      setClickedByUser(Array(rows * cols).fill(false));
      setGameStarted(false);
      setGameOver(false);
    }
  }, [controlMode, rows, cols]);

  // Auto mode auto-pick behavior (manual mode)
  useEffect(() => {
    if (!autoModeRef.current) {
      autoModeRef.current = new AutoMode(600);
    }

    const auto = autoModeRef.current;
    const shouldRun =
      controlMode === "auto" &&
      gameStarted &&
      !gameOver &&
      !showCashoutModal &&
      !autoPlayActive;

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
  }, [
    controlMode,
    gameStarted,
    gameOver,
    showCashoutModal,
    opened,
    autoPlayActive,
  ]);

  // Auto play loop effect
  useEffect(() => {
    if (!autoPlayActive) return;

    const totalCells = rows * cols;
    let isRunning = true;
    let currentBetAmount = betAmount;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        autoPlayLoopRef.current = setTimeout(resolve, ms);
      });

    const applyBetStrategy = (didWin: boolean) => {
      const action = didWin ? onWinAction : onLossAction;
      const percent = didWin ? onWinPercent : onLossPercent;

      if (action === "reset") {
        currentBetAmount = baseBetAmountRef.current;
      } else if (action === "increase") {
        const increase = (baseBetAmountRef.current * percent) / 100;
        currentBetAmount += increase;
      } else if (action === "decrease") {
        const decrease = (baseBetAmountRef.current * percent) / 100;
        currentBetAmount = Math.max(0, currentBetAmount - decrease);
      } else if (action === "none") {
        // no change
      }
      currentBetAmount = Math.max(0, currentBetAmount);
      setBetAmount(currentBetAmount);
    };

    const checkStopConditions = (currentCredit: number) => {
      const sessionProfit = currentCredit - creditAtAutoStartRef.current;

      if (
        stopOnProfitEnabled &&
        stopOnProfitAmount > 0 &&
        sessionProfit >= stopOnProfitAmount
      ) {
        return true; // Stop
      }
      if (
        stopOnLossEnabled &&
        stopOnLossAmount > 0 &&
        sessionProfit <= -stopOnLossAmount
      ) {
        return true; // Stop
      }
      return false;
    };

    const runLoop = async () => {
      while (isRunning) {
        // Use current bet amount for this round
        const roundBet = currentBetAmount;

        setCredit((prev) => {
          const newCredit = prev - roundBet;
          if (newCredit < 0) {
            // Insufficient credits, stop autoplay
            setTimeout(() => handleStopAutoPlay(), 0);
            return prev;
          }
          return newCredit;
        });

        const newOpened = Array(totalCells).fill(true);
        const newRevealedMines = Array(totalCells).fill(false);
        const newAutoRevealed = Array(totalCells).fill(true);
        const newClickedByUser = Array(totalCells).fill(false);
        const newMinePositions = new Set<number>();

        // Generate exactly minesCount random mine positions
        while (newMinePositions.size < minesCount) {
          const randomPos = Math.floor(Math.random() * totalCells);
          newMinePositions.add(randomPos);
        }

        // Mark mines in the revealed array
        newMinePositions.forEach((pos) => {
          newRevealedMines[pos] = true;
        });

        // Check if any selected tiles contain mines
        const selectedIndices = selectedTiles
          .map((isSelected, idx) => (isSelected ? idx : -1))
          .filter((idx) => idx !== -1);
        const hasMineinSelected = selectedIndices.some((idx) =>
          newMinePositions.has(idx),
        );
        const isWin = !hasMineinSelected;

        setMinePositions(newMinePositions);
        setOpened(newOpened);
        setRevealedMines(newRevealedMines);
        setAutoRevealed(newAutoRevealed);
        setClickedByUser(newClickedByUser);

        // Only show win panel if all selected tiles are gems
        if (isWin) {
          // Calculate win amount based on selected tiles and bet amount
          const selectedCount = selectedIndices.length;
          const totalSafeTiles = totalCells - minesCount;

          // Calculate multiplier based on probability
          let multiplier = 1;
          for (let i = 0; i < selectedCount; i++) {
            multiplier *= (totalSafeTiles - i) / (totalCells - i);
          }
          multiplier = 1 / multiplier;

          const winnings = roundBet * multiplier;
          setAutoWinAmount(winnings);
          setAutoMultiplier(multiplier);

          // Add winnings to credit
          setCredit((prev) => {
            const newCredit = prev + winnings;

            // Check stop conditions after adding winnings
            if (checkStopConditions(newCredit)) {
              setTimeout(() => handleStopAutoPlay(), 0);
            }

            return newCredit;
          });

          setShowAutoModeWinPanel(true);
        } else {
          // Loss - check stop conditions
          setCredit((prev) => {
            if (checkStopConditions(prev)) {
              setTimeout(() => handleStopAutoPlay(), 0);
            }
            return prev;
          });
        }

        await sleep(1000);

        if (!isRunning) break;

        // Apply bet strategy after result is shown
        applyBetStrategy(isWin);

        setShowAutoModeWinPanel(false);
        setOpened(Array(totalCells).fill(false));
        setRevealedMines(Array(totalCells).fill(false));
        setAutoRevealed(Array(totalCells).fill(false));
        setClickedByUser(Array(totalCells).fill(false));

        if (initialRunsRef.current > 0) {
          setAutoPickCount((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              setTimeout(() => handleStopAutoPlay(), 0);
              return 0;
            }
            return next;
          });
        }

        await sleep(1000);
      }
    };

    runLoop();

    return () => {
      isRunning = false;
      if (autoPlayLoopRef.current) {
        clearTimeout(autoPlayLoopRef.current);
        autoPlayLoopRef.current = null;
      }
    };
  }, [
    autoPlayActive,
    rows,
    cols,
    minesCount,
    selectedTiles,
    betAmount,
    stopOnProfitEnabled,
    stopOnProfitAmount,
    stopOnLossEnabled,
    stopOnLossAmount,
    onWinAction,
    onLossAction,
    onWinPercent,
    onLossPercent,
  ]);

  useEffect(() => {
    return () => {
      if (autoPlayLoopRef.current) {
        clearTimeout(autoPlayLoopRef.current);
        autoPlayLoopRef.current = null;
      }
    };
  }, []);

  const cells: number[] = Array.from({ length: rows * cols }, (_, i) => i);

  return (
    <div className="flex flex-col items-center w-full max-h-[calc(100vh-32px)] overflow-hidden">
      <div
        className="w-full flex-1 overflow-y-auto"
        style={{ backgroundColor: COLORS.app_bg }}
      >
        {/* Master wrapper - controls ALL width */}
        <div className="w-full max-w-[340px] mx-auto px-3 flex flex-col gap-2 py-3">
          <div className="flex items-center justify-between gap-2 shrink-0 w-full">
            <div
              className="rounded-xl px-3 py-1.5 flex items-center justify-center backdrop-blur-sm flex-1"
              style={{
                minWidth: 100,
                height: 28,
                backgroundColor: COLORS.panel,
                border: BORDERS.standard,
                boxShadow: SHADOWS.md,
              }}
            >
              <p
                className="text-[10px] font-semibold whitespace-nowrap"
                style={{ color: COLORS.text_primary }}
              >
                Credit: {credit.toFixed(2)}
              </p>
            </div>
            {gameStarted && (
              <div
                className="rounded-xl px-3 py-1.5 flex items-center justify-center backdrop-blur-sm flex-1"
                style={{
                  minWidth: 100,
                  height: 28,
                  backgroundColor: COLORS.panel,
                  border: BORDERS.standard,
                  boxShadow: SHADOWS.md,
                }}
              >
                <p
                  className="text-[10px] font-semibold whitespace-nowrap"
                  style={{ color: COLORS.text_primary }}
                >
                  Multiplier: {multiplier.toFixed(2)}x
                </p>
              </div>
            )}
          </div>

          {/* Grid Panel */}
          <div
            className="rounded-xl p-3 w-full shrink-0"
            style={{
              backgroundColor: COLORS.panel,
              border: BORDERS.standard,
              boxShadow: `${SHADOWS.xl}, ${SHADOWS.inset_light}`,
            }}
          >
            <div
              className="grid gap-2 w-full aspect-square mx-auto"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {cells.map((i) => {
                const isSelected = controlMode === "auto" && selectedTiles[i];
                const isAutoTileSelection =
                  controlMode === "auto" && !gameStarted;
                const isAutoRevealedTile = autoRevealed[i];
                const wasClickedByUser = clickedByUser[i];
                const shouldApplyAutoStyle =
                  isAutoRevealedTile && !wasClickedByUser;

                return revealedMines[i] ? (
                  <div
                    key={i}
                    className="w-full aspect-square rounded-md inline-flex items-center justify-center tile-hover overflow-hidden"
                    style={{
                      backgroundColor: shouldApplyAutoStyle
                        ? "#16213E"
                        : COLORS.tile_default,
                      border: isSelected
                        ? `2px solid ${COLORS.tile_selected}`
                        : BORDERS.standard,
                      boxShadow: SHADOWS.md,
                      opacity: shouldApplyAutoStyle ? 0.6 : 1,
                      filter: shouldApplyAutoStyle
                        ? "brightness(0.9)"
                        : "brightness(1)",
                    }}
                    aria-label={`mine-${i}`}
                  >
                    <Image
                      src={mineImage}
                      alt="mine"
                      className={`${shouldApplyAutoStyle ? "scale-[1.3]" : "scale-[1.8]"} object-contain pointer-events-none select-none`}
                      width={SIZES.image_size}
                      height={SIZES.image_size}
                    />
                  </div>
                ) : opened[i] ? (
                  <div
                    key={i}
                    className="w-full aspect-square rounded-md inline-flex items-center justify-center tile-hover overflow-hidden"
                    style={{
                      backgroundColor: shouldApplyAutoStyle
                        ? "#16213E"
                        : COLORS.tile_default,
                      border: isSelected
                        ? `2px solid ${COLORS.tile_selected}`
                        : BORDERS.standard,
                      boxShadow: SHADOWS.md,
                      opacity: shouldApplyAutoStyle ? 0.6 : 1,
                      filter: shouldApplyAutoStyle
                        ? "brightness(0.9)"
                        : "brightness(1)",
                    }}
                    aria-label={`gem-${i}`}
                  >
                    <Image
                      src={gemImage}
                      alt="gem"
                      className={`${shouldApplyAutoStyle ? "scale-[1.3]" : "scale-[1.8]"} object-contain pointer-events-none select-none`}
                      width={SIZES.image_size}
                      height={SIZES.image_size}
                    />
                  </div>
                ) : (
                  <button
                    key={i}
                    className="w-full aspect-square rounded-md inline-flex items-center justify-center cursor-pointer tile-hover transition-all duration-200"
                    style={{
                      backgroundColor: isSelected
                        ? COLORS.tile_selected
                        : hoveredTile === i
                          ? COLORS.tile_hover
                          : COLORS.tile_default,
                      border: isSelected
                        ? `1px solid ${COLORS.tile_selected}`
                        : `1px solid rgba(34, 48, 85, 1)`,
                      boxShadow: isSelected
                        ? SHADOWS.selected_glow
                        : hoveredTile === i
                          ? SHADOWS.tile_glow
                          : SHADOWS.sm,
                    }}
                    onClick={() => {
                      if (isAutoTileSelection) {
                        handleTileSelect(i);
                      } else {
                        handleClick(i);
                      }
                    }}
                    onMouseEnter={() =>
                      !isAutoTileSelection && setHoveredTile(i)
                    }
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
                backgroundColor:
                  autoPlayResult === "win" ? COLORS.success : COLORS.error,
                color: "#FFFFFF",
                border:
                  autoPlayResult === "win" ? BORDERS.success : BORDERS.error,
              }}
            >
              {autoPlayResult === "win" ? "🎉 Won!" : "❌ Lost!"}
            </div>
          )}

          {/* Control Panel */}
          <div
            className="rounded-lg p-3 w-full shrink-0"
            style={{
              backgroundColor: COLORS.panel,
              border: BORDERS.standard,
              boxShadow: `${SHADOWS.lg}, ${SHADOWS.inset_light}`,
            }}
          >
            <div className="grid grid-cols-2 gap-2 items-stretch w-full">
              {/* Row 1: Segmented Control (Manual/Auto) | Auto Settings Icon Button */}
              <div
                className="h-7 rounded-full p-0.5 flex w-full"
                style={{
                  backgroundColor: COLORS.surface,
                  border: BORDERS.standard,
                  opacity: gameStarted || autoPlayActive ? 0.5 : 1,
                  pointerEvents:
                    gameStarted || autoPlayActive ? "none" : "auto",
                }}
              >
                <button
                  disabled={gameStarted || autoPlayActive}
                  className="flex-1 h-full rounded-full text-[11px] font-semibold leading-none flex items-center justify-center transition whitespace-nowrap disabled:cursor-not-allowed"
                  style={{
                    color:
                      controlMode === "manual"
                        ? COLORS.text_primary
                        : COLORS.text_muted,
                    backgroundColor:
                      controlMode === "manual"
                        ? COLORS.primary_action
                        : "transparent",
                    boxShadow:
                      controlMode === "manual"
                        ? `0 1px 3px ${COLORS.primary_action}4d`
                        : "none",
                  }}
                  onClick={() => setControlMode("manual")}
                  onMouseEnter={(e) => {
                    if (controlMode !== "manual" && !gameStarted) {
                      e.currentTarget.style.color = COLORS.text_primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (controlMode !== "manual" && !gameStarted) {
                      e.currentTarget.style.color = COLORS.text_muted;
                    }
                  }}
                  title={
                    gameStarted || autoPlayActive
                      ? "Cannot change mode during active round"
                      : ""
                  }
                >
                  Manual
                </button>
                <button
                  disabled={gameStarted || autoPlayActive}
                  className="flex-1 h-full rounded-full text-[11px] font-semibold leading-none flex items-center justify-center transition whitespace-nowrap disabled:cursor-not-allowed"
                  style={{
                    color:
                      controlMode === "auto"
                        ? COLORS.text_primary
                        : COLORS.text_muted,
                    backgroundColor:
                      controlMode === "auto"
                        ? COLORS.primary_action
                        : "transparent",
                    boxShadow:
                      controlMode === "auto"
                        ? `0 1px 3px ${COLORS.primary_action}4d`
                        : "none",
                  }}
                  onClick={() => setControlMode("auto")}
                  onMouseEnter={(e) => {
                    if (controlMode !== "auto" && !gameStarted) {
                      e.currentTarget.style.color = COLORS.text_primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (controlMode !== "auto" && !gameStarted) {
                      e.currentTarget.style.color = COLORS.text_muted;
                    }
                  }}
                  title={
                    gameStarted || autoPlayActive
                      ? "Cannot change mode during active round"
                      : ""
                  }
                >
                  Auto
                </button>
              </div>

              {/* Row 1 Col 2: Auto Settings Button */}
              <div className="justify-self-end">
                <button
                  onClick={() => setShowAutoSettings(true)}
                  disabled={controlMode !== "auto" || autoPlayActive}
                  className="h-7 w-7 rounded-md flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor:
                      controlMode === "auto"
                        ? COLORS.surface
                        : "rgba(255, 255, 255, 0.02)",
                    border: BORDERS.standard,
                    color:
                      controlMode === "auto"
                        ? COLORS.text_primary
                        : COLORS.text_muted,
                  }}
                  onMouseEnter={(e) => {
                    if (controlMode === "auto") {
                      e.currentTarget.style.backgroundColor =
                        COLORS.surface_hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (controlMode === "auto") {
                      e.currentTarget.style.backgroundColor = COLORS.surface;
                    }
                  }}
                  title={
                    controlMode === "auto"
                      ? autoPlayActive
                        ? "Autoplay running"
                        : "Auto settings"
                      : "Enable Auto mode to access settings"
                  }
                >
                  <Settings2 size={16} />
                </button>
              </div>

              {/* Row 2: Play Button | Bet Stepper */}
              {(() => {
                const hasClickedAnyTile = clickedByUser.some(
                  (clicked) => clicked,
                );
                const hasSelectedTiles = selectedTiles.some(
                  (selected) => selected,
                );
                const isCashoutDisabled = gameStarted && !hasClickedAnyTile;
                const isStartAutoplayDisabled =
                  controlMode === "auto" &&
                  !autoPlayActive &&
                  (gameStarted || !hasSelectedTiles);
                const isButtonDisabled =
                  controlMode === "manual"
                    ? isCashoutDisabled
                    : isStartAutoplayDisabled;

                return (
                  <button
                    disabled={isButtonDisabled}
                    className="h-7 w-full rounded-md px-3 text-xs font-semibold leading-none flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: gameStarted
                        ? isCashoutDisabled
                          ? "rgba(16, 185, 129, 0.5)"
                          : COLORS.cashout_action
                        : COLORS.primary_action,
                      color: "#FFFFFF",
                      boxShadow:
                        gameStarted && !isCashoutDisabled
                          ? SHADOWS.success_glow
                          : SHADOWS.sm,
                    }}
                    onClick={
                      controlMode === "auto"
                        ? autoPlayActive
                          ? handleStopAutoPlay
                          : handleStartAutoPlay
                        : handlePlayButton
                    }
                    {...(isButtonDisabled ? {} : createBrightnessHandler())}
                    title={
                      isCashoutDisabled
                        ? "Click at least one tile to cashout"
                        : isStartAutoplayDisabled
                          ? "Select at least one tile to start"
                          : autoPlayActive
                            ? "Stop autoplay"
                            : ""
                    }
                  >
                    {gameStarted
                      ? "Cashout"
                      : controlMode === "auto"
                        ? autoPlayActive
                          ? "Stop Autoplay"
                          : "Start Autoplay"
                        : "Play"}
                  </button>
                );
              })()}

              {/* Row 2 Col 2: Bet Amount Input */}
              <div
                className="h-7 flex-1 rounded-md px-2.5 flex items-center justify-between"
                style={{
                  backgroundColor: COLORS.surface,
                  border: BORDERS.standard,
                }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: COLORS.text_primary }}
                >
                  Bet
                </span>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  step={0.01}
                  value={betAmount.toFixed(2)}
                  onChange={(e) =>
                    setBetAmount(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="h-5 w-20 rounded px-1 text-xs font-medium text-center tabular-nums disabled:opacity-50 transition"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: COLORS.text_primary,
                  }}
                  disabled={gameStarted || autoPlayActive}
                />
              </div>

              {/* Row 3 Col 1: Mines Selector */}
              <select
                value={minesCount}
                onChange={(e) => setMinesCount(Number(e.target.value))}
                className="h-7 flex-1 rounded-md px-2.5 text-xs font-medium leading-none disabled:opacity-50 transition appearance-none"
                style={{
                  backgroundColor: COLORS.surface,
                  border: BORDERS.standard,
                  color: COLORS.text_primary,
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22${COLORS.text_muted.replace("#", "%23")}%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.2em 1.2em",
                  paddingRight: "2rem",
                }}
                disabled={gameStarted || autoPlayActive}
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                  <option
                    key={num}
                    value={num}
                    style={{
                      backgroundColor: "#111A2E",
                      color: COLORS.text_primary,
                    }}
                  >
                    {num} Mines
                  </option>
                ))}
              </select>

              {/* Row 3 Col 2: Pick Random or Empty Panel in Auto Mode */}
              {controlMode === "manual" ? (
                <button
                  className="h-7 flex-1 rounded-md px-2.5 text-xs font-medium leading-none flex items-center justify-center transition"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: BORDERS.standard,
                    color: COLORS.text_primary,
                  }}
                  onClick={handlePickRandom}
                  disabled={!gameStarted || gameOver}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor =
                        COLORS.surface_hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.surface;
                  }}
                >
                  Pick Random
                </button>
              ) : (
                <div
                  className="h-7 flex-1 rounded-md px-2.5 flex items-center justify-between"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: BORDERS.standard,
                  }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: COLORS.text_primary }}
                  >
                    Runs
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={autoPickCount}
                    onChange={(e) =>
                      setAutoPickCount(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="h-5 w-12 rounded px-1 text-xs font-medium text-center tabular-nums disabled:opacity-50 transition"
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: COLORS.text_primary,
                    }}
                    disabled={gameStarted || autoPlayActive}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cashout Modal */}
      {showCashoutModal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
        >
          <div
            className="rounded-xl p-3 flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300"
            style={{
              width: 200,
              backgroundColor: "rgba(23, 36, 69, 0.95)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <h2
              className="text-xs font-medium"
              style={{ color: COLORS.text_muted }}
            >
              You Won!
            </h2>
            <p
              className="text-xl font-bold text-center"
              style={{
                color: "#10B981",
                textShadow: "0 0 6px rgba(16, 185, 129, 0.35)",
              }}
            >
              ${cashoutAmount.toFixed(2)}
            </p>
            <button
              onClick={() => setShowCashoutModal(false)}
              className="h-7 rounded-md text-xs font-semibold px-3 text-white transition-all hover:brightness-110 active:brightness-95"
              style={{
                backgroundColor: COLORS.cashout_action,
                marginTop: "2px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Auto Mode Win Panel - appears during reveal, closes when grid closes */}
      {showAutoModeWinPanel && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
        >
          <div
            className="rounded-xl p-3 flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300"
            style={{
              width: 200,
              backgroundColor: "rgba(23, 36, 69, 0.95)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <h2
              className="text-xs font-medium"
              style={{ color: COLORS.text_muted }}
            >
              You Won!
            </h2>
            <p
              className="text-xl font-bold text-center"
              style={{
                color: "#10B981",
                textShadow: "0 0 6px rgba(16, 185, 129, 0.35)",
              }}
            >
              ${autoWinAmount.toFixed(2)}
            </p>
            <p className="text-sm font-semibold" style={{ color: "#10B981" }}>
              {autoMultiplier.toFixed(2)}x
            </p>
            <p
              className="text-[10px] font-medium"
              style={{ color: COLORS.text_muted }}
            >
              Round {initialRunsRef.current - autoPickCount + 1}
            </p>
          </div>
        </div>
      )}

      {/* Auto Settings Modal */}
      {showAutoSettings && (
        <div
          className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div
            className="rounded-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh]"
            style={{
              width: "min(360px, 92vw)",
              backgroundColor: "rgba(15, 29, 58, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <h2
                className="text-lg font-semibold"
                style={{ color: COLORS.text_primary }}
              >
                Auto Settings
              </h2>
              <button
                onClick={() => setShowAutoSettings(false)}
                className="text-lg flex items-center justify-center w-6 h-6 rounded hover:brightness-110 transition-all"
                style={{ color: COLORS.text_muted }}
              >
                ✕
              </button>
            </div>

            {/* Game Settings Section */}
            <div
              className="flex flex-col gap-3 pb-3 border-b"
              style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <p
                className="text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: "rgba(255, 255, 255, 0.4)" }}
              >
                Game Settings
              </p>

              <div>
                <label
                  className="block text-[11px] font-medium mb-1.5"
                  style={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  Number of Mines
                </label>
                <select
                  value={minesCount}
                  onChange={(e) => setMinesCount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg text-sm font-medium appearance-none"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: COLORS.text_primary,
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.4)%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1rem 1rem",
                    paddingRight: "2rem",
                  }}
                  disabled={gameStarted || autoPlayActive}
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                    <option
                      key={num}
                      value={num}
                      style={{
                        backgroundColor: "#111A2E",
                        color: COLORS.text_primary,
                      }}
                    >
                      {num} Mines
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-[11px] font-medium mb-1.5"
                  style={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  Bet Amount
                </label>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  step={0.01}
                  value={betAmount.toFixed(2)}
                  onChange={(e) =>
                    setBetAmount(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: COLORS.text_primary,
                  }}
                  disabled={gameStarted || autoPlayActive}
                />
              </div>

              <div>
                <label
                  className="block text-[11px] font-medium mb-1.5"
                  style={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  Number of Runs (0 = infinite)
                </label>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={autoPickCount}
                  onChange={(e) =>
                    setAutoPickCount(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: COLORS.text_primary,
                  }}
                  disabled={autoPlayActive}
                />
              </div>
            </div>

            {/* Stop Conditions Section */}
            <div
              className="flex flex-col gap-3 pb-3 border-b"
              style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <p
                className="text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: "rgba(255, 255, 255, 0.4)" }}
              >
                Stop Conditions
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={stopOnProfitEnabled}
                  onChange={(e) => setStopOnProfitEnabled(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{
                    cursor: "pointer",
                    accentColor: COLORS.primary_action,
                  }}
                  disabled={autoPlayActive}
                />
                <label
                  className="text-[11px] font-medium flex-1"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    cursor: "pointer",
                  }}
                >
                  Stop on Profit
                </label>
                <input
                  type="number"
                  min={0}
                  max={99999}
                  step={0.01}
                  value={stopOnProfitAmount}
                  onChange={(e) =>
                    setStopOnProfitAmount(
                      Math.max(0, Number(e.target.value) || 0),
                    )
                  }
                  placeholder="0.00"
                  className="w-20 px-2 py-1 rounded text-xs font-medium text-right focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: COLORS.text_primary,
                  }}
                  disabled={autoPlayActive || !stopOnProfitEnabled}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={stopOnLossEnabled}
                  onChange={(e) => setStopOnLossEnabled(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{
                    cursor: "pointer",
                    accentColor: COLORS.primary_action,
                  }}
                  disabled={autoPlayActive}
                />
                <label
                  className="text-[11px] font-medium flex-1"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    cursor: "pointer",
                  }}
                >
                  Stop on Loss
                </label>
                <input
                  type="number"
                  min={0}
                  max={99999}
                  step={0.01}
                  value={stopOnLossAmount}
                  onChange={(e) =>
                    setStopOnLossAmount(
                      Math.max(0, Number(e.target.value) || 0),
                    )
                  }
                  placeholder="0.00"
                  className="w-20 px-2 py-1 rounded text-xs font-medium text-right focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: COLORS.text_primary,
                  }}
                  disabled={autoPlayActive || !stopOnLossEnabled}
                />
              </div>
            </div>

            {/* Bet Strategy Section */}
            <div className="flex flex-col gap-3 pb-3">
              <p
                className="text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: "rgba(255, 255, 255, 0.4)" }}
              >
                Bet Strategy
              </p>

              <div className="flex items-center gap-2">
                <label
                  className="text-[11px] font-medium w-14"
                  style={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  On Win
                </label>
                <select
                  value={onWinAction}
                  onChange={(e) => setOnWinAction(e.target.value as any)}
                  className="flex-1 px-2 py-1 rounded text-xs font-medium appearance-none"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: COLORS.text_primary,
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.4)%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.35rem center",
                    backgroundSize: "0.8rem 0.8rem",
                    paddingRight: "1.5rem",
                  }}
                  disabled={autoPlayActive}
                >
                  <option value="reset">Reset</option>
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                  <option value="none">None</option>
                </select>
                {(onWinAction === "increase" || onWinAction === "decrease") && (
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={onWinPercent}
                    onChange={(e) =>
                      setOnWinPercent(Math.max(1, Number(e.target.value) || 0))
                    }
                    placeholder="%"
                    className="w-16 px-2 py-1 rounded text-xs font-medium text-right focus:outline-none focus:ring-1 transition-all"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: COLORS.text_primary,
                    }}
                    disabled={autoPlayActive}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label
                  className="text-[11px] font-medium w-14"
                  style={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  On Loss
                </label>
                <select
                  value={onLossAction}
                  onChange={(e) => setOnLossAction(e.target.value as any)}
                  className="flex-1 px-2 py-1 rounded text-xs font-medium appearance-none"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: COLORS.text_primary,
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.4)%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.35rem center",
                    backgroundSize: "0.8rem 0.8rem",
                    paddingRight: "1.5rem",
                  }}
                  disabled={autoPlayActive}
                >
                  <option value="reset">Reset</option>
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                  <option value="none">None</option>
                </select>
                {(onLossAction === "increase" ||
                  onLossAction === "decrease") && (
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={onLossPercent}
                    onChange={(e) =>
                      setOnLossPercent(Math.max(1, Number(e.target.value) || 0))
                    }
                    placeholder="%"
                    className="w-16 px-2 py-1 rounded text-xs font-medium text-right focus:outline-none focus:ring-1 transition-all"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: COLORS.text_primary,
                    }}
                    disabled={autoPlayActive}
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="flex gap-2 pt-2 shrink-0 border-t"
              style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <button
                onClick={() => setShowAutoSettings(false)}
                className="flex-1 h-8 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-1"
                style={{
                  backgroundColor: COLORS.primary_action,
                  color: "#FFFFFF",
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
