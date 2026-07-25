import { ToothInfo, ToothType, ToothMark, MARK_META } from "@/lib/teethData";
import { cn } from "@/lib/utils";

interface Odontogram2DProps {
  teeth: ToothInfo[];
  marks: Record<string, ToothMark>;
  onToothClick: (id: string) => void;
  showLabels: boolean;
}

/** Realistic 2D tooth icon (crown + roots) per type, viewed from the buccal/facial side. */
function ToothIcon({
  type,
  arch,
  marked,
}: {
  type: ToothType;
  arch: "upper" | "lower";
  marked: boolean;
}) {
  const crownFill = marked ? "hsl(46, 55%, 88%)" : "hsl(46, 55%, 94%)";
  const crownStroke = "hsl(220, 15%, 45%)";
  const rootFill = "hsl(40, 35%, 82%)";
  const rootStroke = "hsl(220, 15%, 55%)";

  let crown: JSX.Element;
  let roots: JSX.Element;

  switch (type) {
    case "incisor":
      crown = <path d="M10 4 Q20 0 30 4 L31 22 Q20 26 9 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1" />;
      roots = <path d="M12 22 Q20 50 28 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1" />;
      break;
    case "canine":
      crown = <path d="M11 6 Q20 -2 29 6 L31 20 Q20 28 9 20 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1" />;
      roots = <path d="M12 20 Q20 56 28 20 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1" />;
      break;
    case "premolar":
      crown = <path d="M9 8 Q14 2 20 6 Q26 2 31 8 L32 22 Q20 26 8 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1" />;
      roots = <path d="M14 22 Q15 48 20 50 Q25 48 26 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1" />;
      break;
    case "molar":
      crown = <path d="M6 8 Q11 2 16 6 Q20 2 24 6 Q29 2 34 8 L34 24 Q20 28 6 24 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1" />;
      roots = (
        <>
          <path d="M9 24 Q10 48 14 50 Q17 48 17 24 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1" />
          <path d="M23 24 Q23 48 26 50 Q30 48 31 24 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1" />
        </>
      );
      break;
  }

  return (
    <svg viewBox="0 0 40 60" className="w-full h-full" style={{ transform: arch === "upper" ? "scaleY(-1)" : undefined }}>
      {roots}
      {crown}
    </svg>
  );
}

function MarkOverlay({ mark }: { mark: ToothMark }) {
  if (mark === "none") return null;
  const meta = MARK_META[mark];
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none font-bold text-base sm:text-xl"
      style={{ color: meta.color, textShadow: "0 0 2px hsl(var(--background))" }}
    >
      {meta.symbol}
    </div>
  );
}

function ToothCell({
  tooth,
  mark,
  onToothClick,
  showLabels,
  arch,
}: {
  tooth: ToothInfo;
  mark: ToothMark;
  onToothClick: (id: string) => void;
  showLabels: boolean;
  arch: "upper" | "lower";
}) {
  const marked = mark !== "none";
  return (
    <div className="flex flex-col items-center">
      {arch === "upper" && showLabels && (
        <span className={cn("text-[9px] sm:text-[11px] font-bold leading-none mb-0.5", marked ? "text-destructive" : "text-foreground")}>
          {tooth.id}
        </span>
      )}
      <button
        onClick={() => onToothClick(tooth.id)}
        title={`${tooth.id} · ${tooth.name}${marked ? ` — ${MARK_META[mark].label}` : ""}`}
        className={cn(
          "relative w-5 h-9 sm:w-7 sm:h-12 rounded-sm border transition-colors hover:bg-accent",
          marked ? "border-destructive/60" : "border-transparent"
        )}
      >
        <ToothIcon type={tooth.type} arch={arch} marked={marked} />
        <MarkOverlay mark={mark} />
      </button>
      {arch === "lower" && showLabels && (
        <span className={cn("text-[9px] sm:text-[11px] font-bold leading-none mt-0.5", marked ? "text-destructive" : "text-foreground")}>
          {tooth.id}
        </span>
      )}
      <span className="text-[8px] sm:text-[9px] text-muted-foreground leading-none mt-0.5">{tooth.abbr}</span>
    </div>
  );
}

function ArchRow({
  rightTeeth,
  leftTeeth,
  marks,
  onToothClick,
  showLabels,
  arch,
}: {
  rightTeeth: ToothInfo[];
  leftTeeth: ToothInfo[];
  marks: Record<string, ToothMark>;
  onToothClick: (id: string) => void;
  showLabels: boolean;
  arch: "upper" | "lower";
}) {
  return (
    <div className="flex items-end gap-1 sm:gap-2">
      <div className="flex gap-px sm:gap-0.5">
        {rightTeeth.map((t) => (
          <ToothCell key={t.id} tooth={t} mark={marks[t.id] ?? "none"} onToothClick={onToothClick} showLabels={showLabels} arch={arch} />
        ))}
      </div>
      <div className="w-px self-stretch bg-border mx-0.5 sm:mx-1" />
      <div className="flex gap-px sm:gap-0.5">
        {leftTeeth.map((t) => (
          <ToothCell key={t.id} tooth={t} mark={marks[t.id] ?? "none"} onToothClick={onToothClick} showLabels={showLabels} arch={arch} />
        ))}
      </div>
    </div>
  );
}

export function Odontogram2D({ teeth, marks, onToothClick, showLabels }: Odontogram2DProps) {
  // Right side rendered with 3rd molar at far end, central incisor at midline.
  // For upper-right, we want order [3rd molar ... central incisor] left→right.
  // indexInQuadrant 0 = central incisor; 7 = 3rd molar (adult). So reverse for right side.
  const upperRight = teeth.filter((t) => t.arch === "upper" && t.side === "right").sort((a, b) => b.indexInQuadrant - a.indexInQuadrant);
  const upperLeft = teeth.filter((t) => t.arch === "upper" && t.side === "left").sort((a, b) => a.indexInQuadrant - b.indexInQuadrant);
  const lowerRight = teeth.filter((t) => t.arch === "lower" && t.side === "right").sort((a, b) => b.indexInQuadrant - a.indexInQuadrant);
  const lowerLeft = teeth.filter((t) => t.arch === "lower" && t.side === "left").sort((a, b) => a.indexInQuadrant - b.indexInQuadrant);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 sm:gap-3 p-4 sm:p-3 bg-card rounded-lg">
      {/* Upper arch header */}
      <div className="w-full max-w-4xl flex justify-between text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
        <span><span className="text-destructive">RIGHT</span> <span className="hidden sm:inline">(Patient's Right)</span></span>
        <span className="text-foreground">MAXILLARY (UPPER)</span>
        <span><span className="text-destructive">LEFT</span> <span className="hidden sm:inline">(Patient's Left)</span></span>
      </div>
      <ArchRow rightTeeth={upperRight} leftTeeth={upperLeft} marks={marks} onToothClick={onToothClick} showLabels={showLabels} arch="upper" />

      {/* Midline divider */}
      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-full max-w-4xl py-1">
        <div className="flex-1 h-px bg-border" />
        <span className="bg-muted px-2 py-0.5 rounded text-[9px]">Midline</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Lower arch */}
      <ArchRow rightTeeth={lowerRight} leftTeeth={lowerLeft} marks={marks} onToothClick={onToothClick} showLabels={showLabels} arch="lower" />
      <div className="w-full max-w-4xl flex justify-between text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
        <span><span className="text-destructive">RIGHT</span></span>
        <span className="text-foreground">MANDIBULAR (LOWER)</span>
        <span><span className="text-destructive">LEFT</span></span>
      </div>
    </div>
  );
}
