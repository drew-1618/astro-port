/* A single HUD readout: tiny uppercase label above a monospace value. */
export default function Telemetry({ label, value, className = '', valueClassName = '' }) {
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <span className="hud-label">{label}</span>
      <span className={`hud-value truncate ${valueClassName}`}>{value}</span>
    </div>
  );
}
