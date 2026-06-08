# Convex AI

Convex AI is a fully static React + Vite web app for fast natural language unit conversion. Type queries like `72 F to C`, `5 miles to km`, `100 usd to eur`, or `3 hours to seconds` and get an instant parsed breakdown, formula, and conversion result.

## Features

- Smart parser for natural language conversion queries
- Real-time debounced conversion preview
- Manual mode with traditional value/from/to controls
- Length, weight, temperature, time, and simulated currency conversions
- Static JSON exchange rates for browser-only currency support
- Copyable results and graceful validation messages
- Responsive SaaS-style interface for desktop and mobile
- GitHub Pages-compatible Vite configuration

## How Smart Parsing Works

The parser in `src/engine/parser.js` normalizes user input, extracts the first numeric value, detects connector words such as `to`, `in`, and `as`, then resolves unit aliases through a rule-based unit index. It supports common synonyms like `miles`, `mi`, `fahrenheit`, `F`, `hours`, `hr`, and currency codes. A small Levenshtein-based fuzzy matcher helps tolerate near matches while keeping units constrained to compatible categories. The converter in `src/engine/converter.js` performs factor-based conversions for length, weight, and time, formula-based conversions for temperature, and static-rate conversions for currencies from `src/data/rates.json`.

## Tech Stack

- React
- Vite
- JavaScript modules
- CSS
- Intl API concepts for locale-aware number formatting


