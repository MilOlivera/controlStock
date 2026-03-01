export function formatStock(value: number) {
  const integer = Math.floor(value);
  const decimal = value - integer;

  let fraction = "";

  if (decimal >= 0.74) fraction = "3/4";
  else if (decimal >= 0.49) fraction = "1/2";
  else if (decimal >= 0.24) fraction = "1/4";

  if (!fraction) return `${integer}`;
  if (integer === 0) return fraction;

  return `${integer} + ${fraction}`;
}