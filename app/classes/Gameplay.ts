export class Gameplay {
  private rows: number;
  private cols: number;
  private minesCount: number;
  private minePositions: Set<number>;
  private revealedCells: Set<number>;
  private isGameActive: boolean;
  private betAmount: number;

  constructor(rows: number, cols: number, minesCount: number, betAmount: number) {
    this.rows = rows;
    this.cols = cols;
    this.minesCount = minesCount;
    this.betAmount = betAmount;
    this.minePositions = new Set();
    this.revealedCells = new Set();
    this.isGameActive = false;
  }

  startGame(): void {
    this.isGameActive = true;
    this.revealedCells.clear();
    this.placeMines();
  }

  private placeMines(): void {
    this.minePositions.clear();
    const totalCells = this.rows * this.cols;
    
    while (this.minePositions.size < this.minesCount) {
      const randomPosition = Math.floor(Math.random() * totalCells);
      this.minePositions.add(randomPosition);
    }
  }

  revealCell(cellIndex: number): { success: boolean; isMine: boolean; gameOver: boolean } {
    if (!this.isGameActive || this.revealedCells.has(cellIndex)) {
      return { success: false, isMine: false, gameOver: false };
    }

    this.revealedCells.add(cellIndex);
    const isMine = this.minePositions.has(cellIndex);

    if (isMine) {
      this.isGameActive = false;
      return { success: true, isMine: true, gameOver: true };
    }

    return { success: true, isMine: false, gameOver: false };
  }

  getMultiplier(): number {
    const safeCells = this.rows * this.cols - this.minesCount;
    const revealedSafeCells = this.revealedCells.size;
    
    if (revealedSafeCells === 0) return 1;
    
    // Simple multiplier calculation based on revealed cells
    return 1 + (revealedSafeCells / safeCells) * this.minesCount;
  }

  cashout(): number {
    if (!this.isGameActive) return 0;
    
    this.isGameActive = false;
    return this.betAmount * this.getMultiplier();
  }

  isActive(): boolean {
    return this.isGameActive;
  }

  getRevealedCells(): number[] {
    return Array.from(this.revealedCells);
  }

  getMinePositions(): number[] {
    return Array.from(this.minePositions);
  }

  reset(): void {
    this.isGameActive = false;
    this.revealedCells.clear();
    this.minePositions.clear();
  }
}
