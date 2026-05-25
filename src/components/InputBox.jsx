export default function InputBox({ value, onChange }) {
  return (
    <label className="input-card">
      <span>Natural language query</span>
      <input
        autoComplete="off"
        inputMode="text"
        placeholder="Try: 72 F to C, 5 miles to km, 100 usd to eur"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
