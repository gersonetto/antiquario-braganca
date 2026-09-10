export function SorteioButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-auto border px-4 py-1.5 text-sm font-medium transition-colors duration-150"
      style={{
        fontFamily: "'Cinzel', serif",
        letterSpacing: '0.03em',
        background: 'var(--brand)',
        color: 'var(--brand-ink)',
        borderColor: 'var(--gold)',
      }}
    >
      ✦ Invocar
    </button>
  );
}
