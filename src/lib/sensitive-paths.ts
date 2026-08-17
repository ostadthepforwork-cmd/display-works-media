export const SENSITIVE_PATH_DISALLOW = [
  "/.env",
  "/.env.local",
  "/.env.production",
  "/.git/",
  "/.git/config",
  "/.git/HEAD",
  "/.htaccess",
  "/.htpasswd",
  "/.config/",
  "/config/",
  "/storage/",
  "/storage/logs/",
  "/logs/",
  "/backup/",
  "/backups/",
  "/database/",
  "/vendor/",
  "/bootstrap/",
  "/composer.json",
  "/composer.lock",
  "/package.json",
  "/package-lock.json",
  "/pnpm-lock.yaml",
  "/yarn.lock",
  "/server-status",
  "/phpmyadmin/",
  "/wp-admin/",
  "/wp-login.php",
];

const SENSITIVE_PATH_PATTERNS = [
  /^\/\.(?!well-known(?:\/|$))/i,
  /^\/(?:storage|logs|backup|backups|database|vendor|bootstrap|config)(?:\/|$)/i,
  /^\/(?:composer|package|package-lock|pnpm-lock|yarn)\.(?:json|lock|yaml)$/i,
  /^\/(?:server-status|phpmyadmin|wp-admin|wp-login\.php)(?:\/|$)/i,
  /\.(?:env|log|sql|bak|backup|old|orig|save|swp|zip|tar|tgz|gz|7z)(?:$|\?)/i,
  /(?:^|[\/._-])(?:credential|credentials|secret|secrets|token|tokens|key|keys|password|passwd)(?:[\/._-]|$)/i,
];

export function isSensitiveProbePath(pathname: string) {
  if (!pathname) return false;
  const cleanPath = pathname.split("?")[0] || "/";
  return SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(cleanPath));
}

export function sensitiveProbeIntentDetail(pathname: string) {
  const cleanPath = pathname.split("?")[0] || pathname;
  if (cleanPath.startsWith("/.git")) return "Git metadata probe blocked";
  if (cleanPath.startsWith("/.") || cleanPath.includes("/.")) return "Dotfile or hidden credential probe blocked";
  if (cleanPath.includes("/storage/") || cleanPath.endsWith(".log")) return "Server log probe blocked";
  if (cleanPath.includes("credential") || cleanPath.includes("secret") || cleanPath.includes("token")) {
    return "Credential/config probe blocked";
  }
  if (/\.(?:sql|bak|backup|old|zip|tar|tgz|gz|7z)$/i.test(cleanPath)) return "Backup file probe blocked";
  return "Sensitive path probe blocked";
}
