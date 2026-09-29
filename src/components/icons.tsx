import type { SVGProps } from "react";

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path
        d="M3 11.5 12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1H9.5a.5.5 0 0 0 .5-.5V15a2 2 0 0 1 4 0v4.5a.5.5 0 0 0 .5.5h3a1 1 0 0 0 1-1v-9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 3v4M16 3v4M3.5 9.5h17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path
        d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdminIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <circle cx="9" cy="8" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 12.5c1.9 0 3.5 1.8 3.5 4M18 6a2.2 2.2 0 1 1 0 4.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PrintIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path
        d="M7 8.5V4.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="4" y="8.5" width="16" height="8" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M7 15.5v4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 12h2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path
        d="M11.5 4H5a1 1 0 0 0-1 1v6.5a1 1 0 0 0 .3.7l9 9a1 1 0 0 0 1.4 0l6.5-6.5a1 1 0 0 0 0-1.4l-9-9a1 1 0 0 0-.7-.3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  );
}

export function LoginIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path
        d="M9 8V6.5A2.5 2.5 0 0 1 11.5 4h5A2.5 2.5 0 0 1 19 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 9 17.5V16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 12h-10m0 0 3-3m-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path
        d="M15 8V6.5A2.5 2.5 0 0 0 12.5 4h-5A2.5 2.5 0 0 0 5 6.5v11A2.5 2.5 0 0 0 7.5 20h5a2.5 2.5 0 0 0 2.5-2.5V16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.5 12h10m0 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
