import { formatConversionValue } from '../engine/converter';

const unitText = (unit, value) => {
  if (!unit) return '';
  return Math.abs(Number(value)) === 1 ? unit.label : unit.plural;
};

export default function ResultPanel({ parsed, conversion, error, onCopy, copied }) {
  if (error) {
    return (
      <section className="result-panel empty-state" aria-live="polite">
        <p>{error}</p>
      </section>
    );
  }

  if (!parsed?.ok || !conversion?.ok) {
    return (
      <section className="result-panel empty-state" aria-live="polite">
        <p>Start with a value and units to see an instant conversion.</p>
      </section>
    );
  }

  const fromLabel = unitText(conversion.fromUnit, parsed.value);
  const toLabel = unitText(conversion.toUnit, conversion.value);
  const resultText = `${formatConversionValue(parsed.value)} ${fromLabel} = ${formatConversionValue(conversion.value)} ${toLabel}`;

  return (
    <section className="result-panel" aria-live="polite">
      <div className="result-header">
        <div>
          <span className="eyebrow">Conversion result</span>
          <h2>
            {formatConversionValue(parsed.value)}
            <span>{fromLabel}</span>
            <strong>→</strong>
            {formatConversionValue(conversion.value)}
            <span>{toLabel}</span>
          </h2>
        </div>
        <button type="button" className="copy-button" onClick={() => onCopy(resultText)}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="formula">
        <span>Formula</span>
        <p>{conversion.formula}</p>
        {conversion.rateDate ? <small>Static exchange rates dated {conversion.rateDate}</small> : null}
      </div>

      <div className="breakdown">
        <div>
          <span>Value</span>
          <strong>{formatConversionValue(parsed.value)}</strong>
        </div>
        <div>
          <span>From</span>
          <strong>{conversion.fromUnit.label}</strong>
        </div>
        <div>
          <span>To</span>
          <strong>{conversion.toUnit.label}</strong>
        </div>
        <div>
          <span>Context</span>
          <strong>{parsed.category}</strong>
        </div>
      </div>
    </section>
  );
}
