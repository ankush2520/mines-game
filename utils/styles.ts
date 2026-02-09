/**
 * Style Utilities
 * Reusable style objects and helper functions for consistent styling
 */

import { COLORS, SHADOWS, SIZES, BORDERS } from '../constants/design-tokens';

// ========== COMPONENT STYLE OBJECTS ==========

// Panel/Container Styles
export const panelStyle = {
  backgroundColor: COLORS.panel,
  border: BORDERS.standard,
  boxShadow: `${SHADOWS.xl}, ${SHADOWS.inset_light}`,
};

export const surfaceStyle = {
  backgroundColor: COLORS.surface,
  border: BORDERS.standard,
};

// ========== BUTTON STYLES ==========

export const buttonBaseStyle = {
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  userSelect: 'none' as const,
};

export const primaryButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: COLORS.primary_action,
  color: COLORS.text_primary,
  boxShadow: SHADOWS.sm,
};

export const secondaryButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: COLORS.surface,
  border: BORDERS.standard,
  color: COLORS.text_primary,
};

export const cashoutButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: COLORS.cashout_action,
  color: COLORS.text_primary,
  boxShadow: SHADOWS.success_glow,
};

export const iconButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: COLORS.surface,
  border: BORDERS.standard,
  color: COLORS.text_primary,
};

// ========== TILE STYLES ==========

export const tileDefaultStyle = {
  backgroundColor: COLORS.tile_default,
  border: BORDERS.standard,
  boxShadow: SHADOWS.sm,
  transition: 'all 0.2s ease',
};

export const tileHoverStyle = {
  backgroundColor: COLORS.tile_hover,
  border: BORDERS.hover,
  boxShadow: SHADOWS.tile_glow,
};

export const tileSelectedStyle = {
  backgroundColor: COLORS.tile_selected,
  border: BORDERS.selected,
  boxShadow: SHADOWS.selected_glow,
};

export const tileRevealedStyle = {
  backgroundColor: COLORS.tile_default,
  border: BORDERS.standard,
  boxShadow: SHADOWS.md,
};

// ========== SEGMENTED CONTROL STYLES ==========

export const segmentedContainerStyle = {
  backgroundColor: COLORS.surface,
  border: BORDERS.standard,
  borderRadius: '9999px',
  padding: '0.125rem',
};

export const segmentInactiveStyle = {
  color: COLORS.text_muted,
  backgroundColor: 'transparent',
  boxShadow: 'none',
};

export const segmentActiveStyle = {
  color: COLORS.text_primary,
  backgroundColor: COLORS.primary_action,
  boxShadow: `0 1px 3px ${COLORS.primary_action}4d`,
};

// ========== INPUT STYLES ==========

export const inputStyle = {
  backgroundColor: COLORS.surface,
  border: BORDERS.standard,
  color: COLORS.text_primary,
  transition: 'border-color 0.2s ease',
};

export const selectStyle = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.5rem center',
  backgroundSize: '1.2em 1.2em',
  paddingRight: '2rem',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22${COLORS.text_muted.replace('#', '%23')}%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e")`,
};

// ========== MODAL STYLES ==========

export const modalBackdropStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
};

export const modalContentStyle = {
  ...panelStyle,
  borderRadius: '8px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
};

// ========== HELPER FUNCTIONS ==========

/**
 * Get text color based on active/hovered state
 */
export function getTextColor(isActive: boolean): string {
  return isActive ? COLORS.text_primary : COLORS.text_muted;
}

/**
 * Get background color for button based on state
 */
export function getButtonBackground(isActive: boolean, isCashout: boolean = false): string {
  if (isCashout && isActive) return COLORS.cashout_action;
  if (isActive) return COLORS.primary_action;
  return COLORS.surface;
}

/**
 * Get tile style based on state
 */
export function getTileStyle(
  isRevealed: boolean,
  isSelected: boolean,
  isHovered: boolean
): Record<string, any> {
  if (isRevealed) return tileRevealedStyle;
  if (isSelected) return tileSelectedStyle;
  if (isHovered) return tileHoverStyle;
  return tileDefaultStyle;
}

/**
 * Create a button hover effect handler
 */
export function createHoverHandler(
  element: HTMLElement | null,
  enterColor: string,
  leaveColor: string
): { onMouseEnter: () => void; onMouseLeave: () => void } {
  return {
    onMouseEnter: () => {
      if (element) {
        element.style.backgroundColor = enterColor;
      }
    },
    onMouseLeave: () => {
      if (element) {
        element.style.backgroundColor = leaveColor;
      }
    },
  };
}

/**
 * Create a brightness effect handler (used for button press)
 */
export function createBrightnessHandler(): {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => void;
} {
  return {
    onMouseEnter: (e) => {
      (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
    },
    onMouseLeave: (e) => {
      (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
    },
    onMouseDown: (e) => {
      (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.95)';
    },
    onMouseUp: (e) => {
      (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
    },
  };
}

/**
 * Combine multiple style objects
 */
export function mergeStyles(...styles: Record<string, any>[]): Record<string, any> {
  return Object.assign({}, ...styles);
}
