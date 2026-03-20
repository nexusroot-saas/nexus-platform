/**
 * @nexus/ui-kit — Styleguide
 * Página de referência visual para desenvolvedores.
 * Rota: /styleguide (apenas em desenvolvimento)
 *
 * Exibe todas as cores, espaçamentos, tipografia e componentes disponíveis.
 */

import { primitive, brandMap } from '../tokens/colors.js';
import { Button } from '../components/Button.jsx';
import { Badge } from '../components/Badge.jsx';
import { Card, CardHeader, CardBody } from '../components/Card.jsx';
import { Input } from '../components/Input.jsx';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 16,
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-sans)',
          borderBottom: '1px solid var(--color-border-default)',
          paddingBottom: 8,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function ColorSwatch({ name, value }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          background: value,
          border: '1px solid rgba(0,0,0,.08)',
        }}
      />
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-text-tertiary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-text-tertiary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function Styleguide() {
  return (
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '40px 24px',
        fontFamily: 'var(--font-sans)',
        background: 'var(--color-surface-bg)',
        minHeight: '100vh',
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 8,
          letterSpacing: '-0.5px',
        }}
      >
        Nexus UI-Kit — Styleguide
      </h1>
      <p
        style={{
          color: 'var(--color-text-secondary)',
          marginBottom: 40,
          fontSize: 14,
        }}
      >
        Referência de tokens e componentes. Mude a classe do{' '}
        <code
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--color-surface-alt)',
            padding: '1px 6px',
            borderRadius: 4,
          }}
        >
          &lt;body&gt;
        </code>{' '}
        para ver a troca de tema.
      </p>

      {/* Temas */}
      <Section title="Temas de submarca">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(brandMap).map(([key, val]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 8,
                background: val.soft,
                border: `1px solid ${val.primary}20`,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: val.primary,
                }}
              />
              <span
                style={{ fontSize: 13, fontWeight: 500, color: val.primary }}
              >
                Nexus{key.charAt(0) + key.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Cores primitivas */}
      <Section title="Paleta primitiva — Azul (NexusMed)">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(primitive.blue).map(([k, v]) => (
            <ColorSwatch key={k} name={`blue-${k}`} value={v} />
          ))}
        </div>
      </Section>

      {/* Tipografia */}
      <Section title="Tipografia">
        {[
          { label: 'text-4xl / 32px', size: 32, weight: 600 },
          { label: 'text-3xl / 24px', size: 24, weight: 600 },
          { label: 'text-2xl / 20px', size: 20, weight: 600 },
          { label: 'text-xl / 18px', size: 18, weight: 500 },
          { label: 'text-lg / 16px', size: 16, weight: 400 },
          { label: 'text-base / 14px', size: 14, weight: 400 },
          { label: 'text-sm / 13px', size: 13, weight: 400 },
          { label: 'text-xs / 12px', size: 12, weight: 400 },
        ].map(({ label, size, weight }) => (
          <div key={label} style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: size,
                fontWeight: weight,
                color: 'var(--color-text-primary)',
              }}
            >
              {label} — Prontuário eletrônico
            </span>
          </div>
        ))}
      </Section>

      {/* Botões */}
      <Section title="Button">
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badge">
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Badge variant="success">Ativo</Badge>
          <Badge variant="danger">Cancelado</Badge>
          <Badge variant="warning">Pendente</Badge>
          <Badge variant="info">Em atendimento</Badge>
          <Badge variant="neutral">Rascunho</Badge>
          <Badge variant="brand">NexusMed</Badge>
        </div>
      </Section>

      {/* Card */}
      <Section title="Card">
        <Card style={{ maxWidth: 400 }}>
          <CardHeader title="Paciente">
            <Badge variant="success">Ativo</Badge>
          </CardHeader>
          <CardBody>
            <p
              style={{
                fontSize: 14,
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              João da Silva · CPF 111.111.111-11
            </p>
          </CardBody>
        </Card>
      </Section>

      {/* Input */}
      <Section title="Input">
        <div style={{ maxWidth: 360 }}>
          <Input label="Nome completo" placeholder="João da Silva" />
          <Input label="E-mail" type="email" placeholder="joao@email.com" />
          <Input
            label="Com erro"
            placeholder="campo obrigatório"
            error="Este campo é obrigatório."
          />
        </div>
      </Section>
    </div>
  );
}
