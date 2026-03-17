/**
 * @nexus/ui-kit — Border Radius Tokens
 */

export const radii = {
  none: '0px',
  sm: '4px',
  md: '8px', // padrão para botões e inputs
  lg: '12px', // cards
  xl: '16px', // modais
  '2xl': '24px', // painéis grandes
  full: '9999px', // badges, avatares, pills
};

export const radiiVars = Object.entries(radii)
  .map(([k, v]) => `  --radii-${k}: ${v};`)
  .join('\n');
