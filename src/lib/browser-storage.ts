export function loadLocal<T = unknown>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const value = window.localStorage.getItem("cms_" + key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocal(key: string, value: unknown) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("cms_" + key, JSON.stringify(value));
  } catch {
    // Local storage can be unavailable in private mode or blocked browsers.
  }
}
