/**
 * Design Tokens
 * Centralized design system values for colors, sizes, and spacing
 */

// ========== COLORS ==========
export const COLORS = {
  // Background
  app_bg: 'rgba(17, 26, 46, 0.8)',
  panel: '#172445',

  // Surface & Borders
  surface: 'rgba(17, 26, 46, 0.7)',
  surface_hover: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(43, 63, 112, 0.4)',
  border_hover: '#2B3F70',

  // Text
  text_primary: '#EAF0FF',
  text_muted: '#A7B2D6',

  // Action Colors
  primary_action: '#3B82F6', // Play button
  cashout_action: '#10B981', // Cashout button
  
  // Tile Colors
  tile_default: '#203056',
  tile_hover: '#2B3F70',
  tile_selected: '#3B82F6',

  // Status Colors
  success: '#22C55E',
  success_border: '#16A34A',
  error: '#EF4444',
  error_border: '#DC2626',
};

// ========== SIZING ==========
export const SIZES = {
  // Heights
  control_h: 'h-7', // 28px - standard control height
  control_h_sm: 'h-6', // 24px - small buttons
  control_h_lg: 'h-10', // 40px - large buttons
  control_h_xl: 'h-8', // 32px - modal buttons

  // Widths  
  control_w: 'w-7', // 28px - icon button
  control_w_sm: 'w-6', // 24px - small buttons

  // Font Sizes
  text_xs: 'text-xs', // 12px
  text_sm: 'text-[11px]', // 11px - segmented tabs
  text_base: 'text-sm', // 14px

  // Padding
  px_sm: 'px-2.5', // 10px
  px_md: 'px-3', // 12px
  py_sm: 'py-1.5', // 6px
  py_md: 'py-2', // 8px
  p_sm: 'p-3', // 12px
  p_md: 'p-4', // 16px

  // Border Radius
  rounded_sm: 'rounded-md', // 6px - controls, tiles
  rounded_md: 'rounded-lg', // 8px - panels
  rounded_lg: 'rounded-xl', // 12px - major panels
  rounded_full: 'rounded-full', // pills

  // Gaps
  gap_xs: 'gap-1',
  gap_sm: 'gap-2',
  gap_md: 'gap-3',

  // Other
  image_scale: 1.8, // Scale multiplier for mine/gem images
  image_size: 60, // Base image width/height in px

  // Shadows
  shadow_sm: '0 2px 6px rgba(0, 0, 0, 0.3)',
  shadow_md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  shadow_lg: '0 12px 30px rgba(0, 0, 0, 0.35)',
  shadow_xl: '0 20px 40px rgba(0, 0, 0, 0.7)',
};

// ========== TYPOGRAPHY ==========
export const TYPOGRAPHY = {
  // Font Weights
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',

  // Line Heights
  tight: 'leading-none',
  regular: 'leading-normal',
};

// ========== SHADOWS & EFFECTS ==========
export const SHADOWS = {
  // Box shadows as style objects
  sm: '0 2px 6px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 12px 30px rgba(0, 0, 0, 0.35)',
  xl: '0 20px 40px rgba(0, 0, 0, 0.7)',
  
  // Glow shadows
  primary_glow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  success_glow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  tile_glow: '0 4px 12px rgba(43, 63, 112, 0.6)',
  selected_glow: '0 4px 12px rgba(59, 130, 246, 0.5)',
  
  // Insets
  inset_light: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
};

// ========== BORDERS & OUTLINES ==========
export const BORDERS = {
  standard: `1px solid ${COLORS.border}`,
  selected: `1px solid ${COLORS.tile_selected}`,
  hover: `1px solid ${COLORS.border_hover}`,
  success: `2px solid ${COLORS.success_border}`,
  error: `2px solid ${COLORS.error_border}`,
};

// ========== Z-INDEX ==========
export const Z_INDEX = {
  modal: 50,
  tooltip: 40,
  overlay: 30,
};

// ========== SPACING ==========
export const SPACING = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
};
