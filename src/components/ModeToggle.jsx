export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle" aria-label="Conversion mode">
      <button
        className={mode === 'smart' ? 'active' : ''}
        type="button"
        onClick={() => onChange('smart')}
      >
        Smart Search
      </button>
      <button
        className={mode === 'manual' ? 'active' : ''}
        type="button"
        onClick={() => onChange('manual')}
      >
        Manual Mode
      </button>
    </div>
  );
}
