export const MUNICIPALITY_COLORS: Record<string, string> = {
  御坊市: "#3b82f6",
  由良町: "#10b981",
  日高町: "#f59e0b",
  美浜町: "#ef4444",
  日高川町: "#8b5cf6",
  印南町: "#ec4899",
  みなべ町: "#06b6d4",
};

export const MUNICIPALITY_LIGHT: Record<string, string> = {
  御坊市: "#dbeafe",
  由良町: "#d1fae5",
  日高町: "#fef3c7",
  美浜町: "#fee2e2",
  日高川町: "#ede9fe",
  印南町: "#fce7f3",
  みなべ町: "#cffafe",
};

export function getMuniColor(muni: string): string {
  return MUNICIPALITY_COLORS[muni] ?? "#9ca3af";
}

export function getMuniLightColor(muni: string): string {
  return MUNICIPALITY_LIGHT[muni] ?? "#f3f4f6";
}

export function formatBudget(amount: number): string {
  if (amount >= 100_000) {
    return `${(amount / 100_000).toFixed(1)}億円`;
  }
  if (amount >= 10_000) {
    return `${Math.round(amount / 10).toLocaleString()}万円`;
  }
  return `${amount.toLocaleString()}千円`;
}

export function formatBudgetFull(amount: number): string {
  return `${amount.toLocaleString()}千円`;
}
