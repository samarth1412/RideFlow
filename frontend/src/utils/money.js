export function formatUSD(value) {
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(safe);
}

