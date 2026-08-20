type IconProps = {
  size?: number;
  className?: string;
};

function svgProps({ size = 18, className }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };
}

export function IconOverview(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function IconBoard(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="10" y="4" width="5" height="11" rx="1" />
      <rect x="17" y="4" width="4" height="8" rx="1" />
    </svg>
  );
}

export function IconBrain(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5.8V16a2 2 0 0 0 2 2h2v2h2v-4H8a1 1 0 0 1-1-1v-2.2A3 3 0 0 0 9 8h1V5a1 1 0 0 0-1-1Z" />
      <path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5.8V16a2 2 0 0 1-2 2h-2v2h-2v-4h3a1 1 0 0 0 1-1v-2.2A3 3 0 0 1 15 8h-1V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function IconCanvas(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <circle cx="7" cy="8" r="3" />
      <circle cx="17" cy="7" r="2.5" />
      <circle cx="15" cy="16" r="3" />
      <path d="m9.7 9.7 4.6-1.5M9.2 10.6 13.8 14" />
    </svg>
  );
}

export function IconAgents(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="4" y="5" width="16" height="12" rx="2" />
      <path d="M8 17v2M16 17v2M9 9h6M9 12h4" />
    </svg>
  );
}

export function IconSettings(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

export function IconFolder(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

export function IconCursor(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="m4 4 7 16 2-6 6-2L4 4Z" />
    </svg>
  );
}

export function IconFile(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6Z" />
      <path d="M14 3v6h6" />
    </svg>
  );
}
