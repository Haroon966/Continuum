type IconProps = {
  size?: number;
  className?: string;
};

type CursorIconProps = IconProps & {
  /** dark = black cube; light = white-bg mark for primary/CTA buttons */
  variant?: "dark" | "light";
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

export function IconCursor({
  size = 22,
  className,
  variant = "dark",
}: CursorIconProps) {
  return (
    <img
      className={`icon-cursor icon-cursor-${variant}${className ? ` ${className}` : ""}`}
      src={variant === "light" ? "/cursor-white.jpg" : "/cursor.jpeg"}
      alt=""
      width={size}
      height={size}
      aria-hidden
    />
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

export function IconLink(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M10 13a5 5 0 0 0 7.54.54l1.92-1.92a5 5 0 0 0-7.07-7.07L11 6" />
      <path d="M14 11a5 5 0 0 0-7.54-.54L4.54 12.4a5 5 0 0 0 7.07 7.07L13 18" />
    </svg>
  );
}

export function IconExternalLink(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function IconChat(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6Z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  );
}

export function IconImage(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="m21 15-4.5-4.5L8 19" />
    </svg>
  );
}

export function IconCode(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m14 5-4 14" />
    </svg>
  );
}

/** Sprout / seed — for “seeded” edge labels */
export function IconSeed(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M12 22v-8" />
      <path d="M12 14c-3.5 0-6-2.2-6-5.5C6 5 9 3 12 2c3 1 6 3 6 6.5 0 3.3-2.5 5.5-6 5.5Z" />
      <path d="M12 14c1.2-2 2-4.2 2-6.5" />
    </svg>
  );
}

export function IconBranch(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <path d="M6 8v8M8 6h6a4 4 0 0 1 4 4v0" />
    </svg>
  );
}
