/**
 * @nexus/ui-kit — Spacing Tokens
 * Grade de 4px — todos os espaçamentos são múltiplos de 4
 */

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
};

// Aliases semânticos
export const space = {
  xs: spacing[1], // 4px  — micro gaps, ícone+texto
  sm: spacing[2], // 8px  — gaps internos de componente
  md: spacing[4], // 16px — padding padrão de card
  lg: spacing[6], // 24px — padding de seção
  xl: spacing[8], // 32px — espaçamento entre blocos
  '2xl': spacing[12], // 48px — espaçamento de página
  '3xl': spacing[16], // 64px — hero sections
};

// Variáveis CSS geradas
export const spacingVars = Object.entries(spacing)
  .map(([k, v]) => `  --spacing-${k}: ${v};`)
  .join('\n');
