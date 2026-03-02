export function logInfo(label: string, data?: any) {
  console.log(
    `%c${label}`,
    "color: #22c55e; font-weight: bold",
    data || ""
  );
}

export function logWarn(label: string, data?: any) {
  console.warn(
    `%c${label}`,
    "color: #eab308; font-weight: bold",
    data || ""
  );
}

export function logError(label: string, error?: any) {
  console.error(
    `%c${label}`,
    "color: #ef4444; font-weight: bold",
    error || ""
  );
}