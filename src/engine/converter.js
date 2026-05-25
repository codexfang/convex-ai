import ratesData from '../data/rates.json';

export const UNIT_DEFINITIONS = {
  length: {
    baseUnit: 'm',
    units: {
      m: { label: 'Meter', plural: 'Meters', factor: 1, aliases: ['m', 'meter', 'meters', 'metre', 'metres'] },
      km: { label: 'Kilometer', plural: 'Kilometers', factor: 1000, aliases: ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'] },
      mi: { label: 'Mile', plural: 'Miles', factor: 1609.344, aliases: ['mi', 'mile', 'miles'] },
      ft: { label: 'Foot', plural: 'Feet', factor: 0.3048, aliases: ['ft', 'foot', 'feet'] },
      in: { label: 'Inch', plural: 'Inches', factor: 0.0254, aliases: ['in', 'inch', 'inches'] },
    },
  },
  weight: {
    baseUnit: 'g',
    units: {
      kg: { label: 'Kilogram', plural: 'Kilograms', factor: 1000, aliases: ['kg', 'kilogram', 'kilograms', 'kilo', 'kilos'] },
      g: { label: 'Gram', plural: 'Grams', factor: 1, aliases: ['g', 'gram', 'grams'] },
      lb: { label: 'Pound', plural: 'Pounds', factor: 453.59237, aliases: ['lb', 'lbs', 'pound', 'pounds'] },
      oz: { label: 'Ounce', plural: 'Ounces', factor: 28.349523125, aliases: ['oz', 'ounce', 'ounces'] },
    },
  },
  temperature: {
    units: {
      c: { label: 'Celsius', plural: 'Celsius', aliases: ['c', 'celsius', 'centigrade', '°c'] },
      f: { label: 'Fahrenheit', plural: 'Fahrenheit', aliases: ['f', 'fahrenheit', '°f'] },
      k: { label: 'Kelvin', plural: 'Kelvin', aliases: ['k', 'kelvin'] },
    },
  },
  time: {
    baseUnit: 'sec',
    units: {
      sec: { label: 'Second', plural: 'Seconds', factor: 1, aliases: ['s', 'sec', 'secs', 'second', 'seconds'] },
      min: { label: 'Minute', plural: 'Minutes', factor: 60, aliases: ['min', 'mins', 'minute', 'minutes'] },
      hr: { label: 'Hour', plural: 'Hours', factor: 3600, aliases: ['h', 'hr', 'hrs', 'hour', 'hours'] },
      day: { label: 'Day', plural: 'Days', factor: 86400, aliases: ['d', 'day', 'days'] },
    },
  },
  currency: {
    units: Object.fromEntries(
      Object.keys(ratesData.rates).map((code) => [
        code.toLowerCase(),
        {
          label: code,
          plural: code,
          aliases: [code.toLowerCase(), code],
        },
      ]),
    ),
  },
};

export const UNIT_INDEX = Object.entries(UNIT_DEFINITIONS).flatMap(([category, definition]) =>
  Object.entries(definition.units).flatMap(([key, unit]) =>
    unit.aliases.map((alias) => ({
      alias: alias.toLowerCase(),
      key,
      category,
      label: unit.label,
      plural: unit.plural,
    })),
  ),
);

const roundResult = (value) => {
  if (!Number.isFinite(value)) return value;
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.001 || abs >= 1000000)) {
    return Number(value.toPrecision(7));
  }
  return Number(value.toFixed(6));
};

const formatNumber = (value, maximumFractionDigits = 6) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : undefined,
  }).format(value);

const getUnit = (category, unitKey) => UNIT_DEFINITIONS[category]?.units?.[unitKey];

const convertTemperature = (value, from, to) => {
  const celsius =
    from === 'c' ? value :
    from === 'f' ? (value - 32) * (5 / 9) :
    value - 273.15;

  if (to === 'c') return celsius;
  if (to === 'f') return (celsius * 9) / 5 + 32;
  return celsius + 273.15;
};

const formulaForTemperature = (value, from, to) => {
  if (from === to) return 'Same temperature scale, so the value is unchanged.';
  const pair = `${from}-${to}`;
  const formulas = {
    'f-c': `(${formatNumber(value)} - 32) x 5/9`,
    'c-f': `(${formatNumber(value)} x 9/5) + 32`,
    'c-k': `${formatNumber(value)} + 273.15`,
    'k-c': `${formatNumber(value)} - 273.15`,
    'f-k': `((${formatNumber(value)} - 32) x 5/9) + 273.15`,
    'k-f': `((${formatNumber(value)} - 273.15) x 9/5) + 32`,
  };
  return formulas[pair] ?? 'Convert through Celsius as the intermediate scale.';
};

export const getAllUnits = () =>
  Object.entries(UNIT_DEFINITIONS).flatMap(([category, definition]) =>
    Object.entries(definition.units).map(([key, unit]) => ({
      key,
      category,
      id: `${category}:${key}`,
      label: unit.label,
      plural: unit.plural,
    })),
  );

export const convertUnits = ({ value, from, to, category }) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return { ok: false, error: 'Enter a valid number to convert.' };
  }

  if (!from || !to || !category) {
    return { ok: false, error: "Could not parse units. Try '10 miles to km'." };
  }

  const fromUnit = getUnit(category, from);
  const toUnit = getUnit(category, to);

  if (!fromUnit || !toUnit) {
    return { ok: false, error: "Could not parse units. Try '10 miles to km'." };
  }

  if (category === 'currency') {
    const fromRate = ratesData.rates[from.toUpperCase()];
    const toRate = ratesData.rates[to.toUpperCase()];
    const result = roundResult((numericValue / fromRate) * toRate);
    return {
      ok: true,
      value: result,
      formula: `${formatNumber(numericValue)} ${from.toUpperCase()} / ${formatNumber(fromRate)} x ${formatNumber(toRate)}`,
      rateDate: ratesData.date,
      fromUnit,
      toUnit,
    };
  }

  if (category === 'temperature') {
    const result = roundResult(convertTemperature(numericValue, from, to));
    return {
      ok: true,
      value: result,
      formula: formulaForTemperature(numericValue, from, to),
      fromUnit,
      toUnit,
    };
  }

  const result = roundResult((numericValue * fromUnit.factor) / toUnit.factor);
  return {
    ok: true,
    value: result,
    formula: `${formatNumber(numericValue)} x ${formatNumber(fromUnit.factor)} / ${formatNumber(toUnit.factor)}`,
    fromUnit,
    toUnit,
  };
};

export const formatConversionValue = (value) => formatNumber(value, 6);
