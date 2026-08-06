import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

export function Facebook({ size = 24, width, height, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width || size}
      height={height || size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M15 8h-2a2 2 0 0 0-2 2v2H9v3h2v6h3v-6h2.5l.5-3h-3v-1.5c0-.8.3-1.5 1.4-1.5H17V6.2A8.8 8.8 0 0 0 15 6Z" />
    </svg>
  );
}

export function Instagram({ size = 24, width, height, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width || size}
      height={height || size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="16" height="16" x="4" y="4" rx="4" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M16.8 7.2h.01" />
    </svg>
  );
}
