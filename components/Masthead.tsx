export function Masthead() {
  return (
    <div
      style={{
        background: 'var(--brand)',
        color: 'var(--brand-ink)',
        padding: '30px 24px 26px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        textAlign: 'center',
        borderBottom: '3px double var(--gold)',
      }}
    >
      <svg viewBox="0 0 46 54" aria-hidden="true" style={{ width: 46, height: 54 }}>
        <path d="M23 2 L28 9 L23 7 L18 9 Z" fill="var(--gold)" />
        <path
          d="M12 10 H34 L34 30 C34 40 23 48 23 48 C23 48 12 40 12 30 Z"
          fill="none"
          stroke="var(--gold)"
          strokeWidth={2.2}
        />
        <path d="M23 16 V38 M16 22 H30" stroke="var(--gold)" strokeWidth={1.6} />
      </svg>
      <h1
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 600,
          fontSize: '1.7rem',
          letterSpacing: '0.05em',
          margin: '2px 0 0',
        }}
      >
        Antiquário de Relíquias Mágicas de Bragança
      </h1>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: '1.05rem',
          color: 'var(--gold)',
          margin: 0,
        }}
      >
        Catálogo de relicários, sob a guarda do mestre
      </p>
    </div>
  );
}
