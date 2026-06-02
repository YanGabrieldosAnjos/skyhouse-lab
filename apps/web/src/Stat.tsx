type Props = { label: string; value: string };

export function Stat({ label, value }: Props) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
    </div>
  );
}
