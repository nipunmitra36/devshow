import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Stroke({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

export const ArrowRightIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Stroke>
);
export const ArrowLeftIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></Stroke>
);
export const ExternalIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Stroke>
);
/** Soft fill for the closed shape of a two-tone icon; the outline stays at full strength. */
const tone = { fill: "currentColor", fillOpacity: 0.18 } as const;

export const CommitIcon = (p: IconProps) => (
  <Stroke {...p}><circle cx="12" cy="12" r="4" {...tone} /><path d="M2 12h6M16 12h6" /></Stroke>
);
export const CalendarIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" {...tone} />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" strokeWidth={2.4} />
  </Stroke>
);
export const RepoIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 19.5v-14A2.5 2.5 0 0 1 7.5 3H19v14H7.5A2.5 2.5 0 0 0 5 19.5Z" {...tone} />
    <path d="M5 19.5A2.5 2.5 0 0 0 7.5 22H19v-5M9 7.5h6" />
  </Stroke>
);
export const FlameIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 21.5a7 7 0 0 0 7-7c0-4.2-3-6.3-4-9.5-1.5 1.5-2 3-2 4.5-1.2-1.8-2.7-3.7-3.2-6.5C7.3 5.5 5 9.2 5 14.5a7 7 0 0 0 7 7Z" {...tone} />
    <path d="M12 21.5a3 3 0 0 1-3-3c0-2 1.5-3 3-4.5 1.5 1.5 3 2.5 3 4.5a3 3 0 0 1-3 3Z" />
  </Stroke>
);
export const PullRequestIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="6" cy="6" r="2.5" {...tone} />
    <circle cx="6" cy="18" r="2.5" {...tone} />
    <circle cx="18" cy="18" r="2.5" {...tone} />
    <path d="M6 8.5v7M18 15.5V9a3 3 0 0 0-3-3h-4M13 3.5 10.5 6 13 8.5" />
  </Stroke>
);
export const IssueIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="8.5" {...tone} />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </Stroke>
);
export const ReviewIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 14.5v-9Z" {...tone} />
    <path d="m9 10 2 2 4-4" />
  </Stroke>
);
export const TrophyIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" {...tone} />
    <path d="M8 6H4.5a3 3 0 0 0 3.6 4.4M16 6h3.5a3 3 0 0 1-3.6 4.4M12 13v4M8.5 20h7M10 17h4" />
  </Stroke>
);
export const UsersIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="9" cy="8" r="3.5" {...tone} />
    <path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.5 3.5 5.2" />
  </Stroke>
);
export const MapPinIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z" {...tone} />
    <circle cx="12" cy="9.5" r="2.5" />
  </Stroke>
);
export const BuildingIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16Z" {...tone} />
    <path d="M15 9h4a1 1 0 0 1 1 1v11M2.5 21h19M8 8h3M8 12h3M8 16h3" />
  </Stroke>
);
export const LinkIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></Stroke>
);
export const AlertIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M12 3.5 2.5 20h19L12 3.5Z" {...tone} /><path d="M12 10v4.5M12 17.5v.01" /></Stroke>
);
export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}><circle cx="11" cy="11" r="6.5" {...tone} /><path d="m20 20-4.2-4.2" /></Stroke>
);
export const SparkIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></Stroke>
);
export const DownloadIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></Stroke>
);
export const ShareIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M12 15V4M8 8l4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /></Stroke>
);
export const XIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M6 6l12 12M18 6 6 18" /></Stroke>
);
export const SunIcon = (p: IconProps) => (
  <Stroke {...p}><circle cx="12" cy="12" r="4" {...tone} /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></Stroke>
);
export const MoonIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" {...tone} /></Stroke>
);
