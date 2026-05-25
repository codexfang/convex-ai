import { useEffect, useMemo, useState } from 'react';
import InputBox from './components/InputBox';
import ModeToggle from './components/ModeToggle';
import ResultPanel from './components/ResultPanel';
import { convertUnits, getAllUnits, UNIT_DEFINITIONS } from './engine/converter';
import { parseQuery } from './engine/parser';

const starterExamples = ['72 F to C', '5 miles to km', '100 usd to eur', '3 hours to seconds'];

const makeManualParsed = ({ value, fromId, toId }) => {
  if (String(value).trim() === '') {
    return { ok: false, error: 'Enter a value to convert.' };
  }

  const [fromCategory, from] = fromId.split(':');
  const [toCategory, to] = toId.split(':');

  if (fromCategory !== toCategory) {
    return { ok: false, error: 'Choose units from the same conversion context.' };
  }

  return {
    ok: true,
    value: Number(value),
    from,
    to,
    category: fromCategory,
    query: '',
    breakdown: {
      value: Number(value),
      from: UNIT_DEFINITIONS[fromCategory].units[from].label,
      to: UNIT_DEFINITIONS[toCategory].units[to].label,
      category: fromCategory,
    },
  };
};

export default function App() {
  const allUnits = useMemo(() => getAllUnits(), []);
  const groupedUnits = useMemo(
    () =>
      Object.entries(UNIT_DEFINITIONS).map(([category]) => ({
        category,
        units: allUnits.filter((unit) => unit.category === category),
      })),
    [allUnits],
  );

  const [mode, setMode] = useState('smart');
  const [query, setQuery] = useState('72 F to C');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [manual, setManual] = useState({ value: '5', fromId: 'length:mi', toId: 'length:km' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const parsed = useMemo(() => {
    if (mode === 'smart') return parseQuery(debouncedQuery);
    return makeManualParsed(manual);
  }, [debouncedQuery, manual, mode]);

  const conversion = useMemo(() => {
    if (!parsed.ok) return null;
    return convertUnits(parsed);
  }, [parsed]);

  const error = !parsed.ok ? parsed.error : conversion && !conversion.ok ? conversion.error : '';

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const handleManualChange = (field, value) => {
    setManual((current) => {
      if (field === 'fromId') {
        const category = value.split(':')[0];
        const compatibleTo = current.toId.startsWith(`${category}:`) ? current.toId : groupedUnits.find((group) => group.category === category).units[1]?.id;
        return { ...current, fromId: value, toId: compatibleTo ?? value };
      }
      return { ...current, [field]: value };
    });
  };

  const activeManualCategory = manual.fromId.split(':')[0];
  const compatibleManualUnits = allUnits.filter((unit) => unit.category === activeManualCategory);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <h1>Convex AI</h1>
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </header>

      <section className="workspace">
        <div className="control-panel">
          {mode === 'smart' ? (
            <>
              <InputBox value={query} onChange={setQuery} />
              <div className="examples" aria-label="Example conversions">
                {starterExamples.map((example) => (
                  <button key={example} type="button" onClick={() => setQuery(example)}>
                    {example}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="manual-card">
              <label>
                <span>Value</span>
                <input
                  inputMode="decimal"
                  type="number"
                  value={manual.value}
                  onChange={(event) => handleManualChange('value', event.target.value)}
                />
              </label>
              <label>
                <span>From</span>
                <select value={manual.fromId} onChange={(event) => handleManualChange('fromId', event.target.value)}>
                  {groupedUnits.map((group) => (
                    <optgroup key={group.category} label={group.category}>
                      {group.units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>
                <span>To</span>
                <select value={manual.toId} onChange={(event) => handleManualChange('toId', event.target.value)}>
                  {compatibleManualUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {parsed.ok ? (
            <div className="parse-card">
              <span>Parsed breakdown</span>
              <dl>
                <div>
                  <dt>Value</dt>
                  <dd>{parsed.breakdown.value}</dd>
                </div>
                <div>
                  <dt>From</dt>
                  <dd>{parsed.breakdown.from}</dd>
                </div>
                <div>
                  <dt>To</dt>
                  <dd>{parsed.breakdown.to}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>

        <ResultPanel parsed={parsed} conversion={conversion} error={error} onCopy={handleCopy} copied={copied} />
      </section>
    </main>
  );
}
