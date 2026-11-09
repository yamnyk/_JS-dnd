export function shippingFee({ weightKg, express, country }) {
  if (typeof weightKg !== 'number' || !(weightKg > 0)) return null;
  let fee = 15;
  if (weightKg <= 1) fee = 5;
  else if (weightKg <= 5) fee = 9;
  if (express) fee = fee * 1.5;
  if (country === 'PT') fee = Math.max(0, fee - 2);
  return fee;
}
