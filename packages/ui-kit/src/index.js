/**
 * @nexus/ui-kit
 * Design System da plataforma Nexus — tokens e componentes agnósticos de marca
 *
 * Uso:
 *   import { Button, Badge, Card, CardHeader, CardBody, Input } from '@nexus/ui-kit';
 *   import { primitive, semantic, brandMap } from '@nexus/ui-kit/tokens';
 */

// Componentes
export { Button }              from '../components/Button.jsx';
export { Badge }               from '../components/Badge.jsx';
export { Card, CardHeader, CardBody } from '../components/Card.jsx';
export { Input }               from '../components/Input.jsx';

// Tokens JS (para uso em lógica, não em CSS)
export { primitive, semantic, brandMap } from '../tokens/colors.js';
export { spacing, space }      from '../tokens/spacing.js';
export { fontFamily, fontSize, fontWeight } from '../tokens/typography.js';
export { radii }               from '../tokens/radii.js';
