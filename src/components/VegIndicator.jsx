/**
 * Standard Indian veg/non-veg marker: a bordered square with a filled dot.
 * Green square + dot = vegetarian, red = non-vegetarian.
 */
export default function VegIndicator({ veg, size = 14 }) {
  const border = veg ? 'border-emerald-700' : 'border-ember-500';
  const dot = veg ? 'bg-emerald-700' : 'bg-ember-500';
  return (
    <span
      role="img"
      aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      title={veg ? 'Veg' : 'Non-veg'}
      className={`inline-flex shrink-0 items-center justify-center border-2 ${border} p-[3px]`}
      style={{ width: size + 6, height: size + 6 }}
    >
      <span className={`h-full w-full rounded-full ${dot}`} />
    </span>
  );
}
