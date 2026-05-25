import { UNIT_INDEX } from './converter';

const normalize = (input) =>
  input
    .toLowerCase()
    .replace(/[°º]/g, '°')
    .replace(/([0-9])([a-z°])/gi, '$1 $2')
    .replace(/\binto\b/g, 'to')
    .replace(/\bconvert\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const levenshtein = (a, b) => {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }

  return matrix[b.length][a.length];
};

const scoreAlias = (term, alias) => {
  if (term === alias) return 0;
  if (alias.startsWith(term) || term.startsWith(alias)) return 0.2;
  const distance = levenshtein(term, alias);
  const maxLength = Math.max(term.length, alias.length);
  return distance / maxLength;
};

export const findUnit = (rawTerm, preferredCategory) => {
  const term = rawTerm.toLowerCase().trim().replace(/[.,;:!?]+$/g, '');
  if (!term) return null;

  const candidates = UNIT_INDEX
    .filter((entry) => !preferredCategory || entry.category === preferredCategory)
    .map((entry) => ({ ...entry, score: scoreAlias(term, entry.alias) }))
    .filter((entry) => entry.score <= (term.length <= 2 ? 0 : 0.36))
    .sort((a, b) => a.score - b.score || a.alias.length - b.alias.length);

  return candidates[0] ?? null;
};

const parseNumber = (normalized) => {
  const match = normalized.match(/[-+]?\d+(?:,\d{3})*(?:\.\d+)?|[-+]?\.\d+/);
  if (!match) return null;
  return {
    value: Number(match[0].replace(/,/g, '')),
    raw: match[0],
    index: match.index,
  };
};

const wordsAfterNumber = (normalized, numberMatch) => {
  const after = normalized.slice(numberMatch.index + numberMatch.raw.length).trim();
  return after.split(' ').filter(Boolean);
};

export const parseQuery = (query) => {
  const original = query ?? '';
  const normalized = normalize(original);

  if (!normalized) {
    return { ok: false, error: "Type a conversion like '72 F to C'." };
  }

  const numberMatch = parseNumber(normalized);
  if (!numberMatch || !Number.isFinite(numberMatch.value)) {
    return { ok: false, error: "Add a numeric value, like '5 miles to km'." };
  }

  const tokens = wordsAfterNumber(normalized, numberMatch);
  const connectorIndex = tokens.findIndex((token) => token === 'to' || token === 'in' || token === 'as');

  let sourceTerm = '';
  let targetTerm = '';

  if (connectorIndex > 0) {
    sourceTerm = tokens.slice(0, connectorIndex).join(' ');
    targetTerm = tokens.slice(connectorIndex + 1).join(' ');
  } else if (connectorIndex === 0) {
    targetTerm = tokens.slice(1).join(' ');
  } else if (tokens.length >= 2) {
    sourceTerm = tokens[0];
    targetTerm = tokens.slice(1).join(' ');
  }

  if (!sourceTerm || !targetTerm) {
    return { ok: false, error: "Could not parse units. Try '10 miles to km'." };
  }

  const from = findUnit(sourceTerm);
  if (!from) {
    return { ok: false, error: `Could not recognize '${sourceTerm}'. Try a unit like miles, kg, F, or USD.` };
  }

  const to = findUnit(targetTerm, from.category);
  if (!to) {
    return { ok: false, error: `Could not convert ${from.label} to '${targetTerm}'. Choose a compatible unit.` };
  }

  return {
    ok: true,
    query: original,
    value: numberMatch.value,
    from: from.key,
    to: to.key,
    category: from.category,
    sourceTerm,
    targetTerm,
    breakdown: {
      value: numberMatch.value,
      from: from.label,
      to: to.label,
      category: from.category,
    },
  };
};
