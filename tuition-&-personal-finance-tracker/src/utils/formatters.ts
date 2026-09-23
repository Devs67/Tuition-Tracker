export function formatINR(amount: number): string {
  const rounded = Math.round(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rounded);
}

// Default export alias for formatCurrency
export const formatCurrency = (amount: number): string => formatINR(amount);

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

