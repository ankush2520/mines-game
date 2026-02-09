/**
 * Game Configuration
 * Constants for game mechanics and user-configurable values
 */

// ========== GAME BOARD ==========
export const GAME_BOARD = {
  rows: 5,
  cols: 5,
  min_mines: 1,
  max_mines: 24,
};

// ========== BET AMOUNTS ==========
export const BET_AMOUNTS = [10, 20, 30, 50, 100, 200];

// ========== AUTO PLAY ==========
export const AUTO_MODE = {
  pick_interval: 600, // milliseconds between auto-picks
  max_runs: 1000, // maximum auto-play runs
  result_duration: 1000, // how long to show win/loss result (ms)
};

// ========== CONTROL MODES ==========
export const CONTROL_MODES = {
  MANUAL: 'manual',
  AUTO: 'auto',
} as const;

export type ControlMode = (typeof CONTROL_MODES)[keyof typeof CONTROL_MODES];

// ========== GAME STATES ==========
export const GAME_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
} as const;

export type GameState = (typeof GAME_STATES)[keyof typeof GAME_STATES];

// ========== AUTO PLAY RESULTS ==========
export const AUTO_PLAY_RESULTS = {
  WIN: 'win',
  LOSS: 'loss',
} as const;

export type AutoPlayResult = (typeof AUTO_PLAY_RESULTS)[keyof typeof AUTO_PLAY_RESULTS];
