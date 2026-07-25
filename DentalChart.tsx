import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DentalOdontogram } from "./DentalOdontogram";
import type { ToothMark } from "@/lib/teethData";
import type { OdontogramMode, DentalOdontogramProps } from "./DentalOdontogram";

export interface DentalChartProps {
  /** Title shown in the header. */
  title?: string;
  /** Subtitle / description below the title. */
  subtitle?: string;
  /** Pass-through props to DentalOdontogram. */
  defaultMode?: OdontogramMode;
  marks?: Record<string, ToothMark>;
  onMarksChange?: DentalOdontogramProps["onMarksChange"];
  hide3D?: boolean;
  /** Show the marked-teeth summary below the chart. */
  showSummary?: boolean;
  /** Optional className for the outermost wrapper. */
  className?: string;
}

/**
 * Self-contained Dental Chart component.
 *
 * Drop this single component into any React app to get:
 * - Header with title + badge
 * - Full dental odontogram (2D chart, 3D preview, reference table)
 * - Optional marked-teeth summary
 *
 * Usage:
 * ```tsx
 * import { DentalChart } from "@/components/teeth/DentalChart";
 * <DentalChart />
 * ```
 */
export function DentalChart({
  title = "Dental Odontogram",
  subtitle = "Universal Numbering System — 2D chart + 3D preview",
  defaultMode = "adult",
  marks: controlledMarks,
  onMarksChange,
  hide3D = false,
  showSummary = true,
  className,
}: DentalChartProps) {
  const [internalMarks, setInternalMarks] = useState<Record<string, ToothMark>>({});
  const marks = controlledMarks ?? internalMarks;

  const handleMarksChange: DentalOdontogramProps["onMarksChange"] = (m, teeth) => {
    if (controlledMarks === undefined) setInternalMarks(m);
    onMarksChange?.(m, teeth);
  };

  return (
    <div className={className}>
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Badge variant="secondary" className="hidden md:inline-flex">
            Universal Numbering
          </Badge>
        </div>
      </header>

      <main className="container py-6 space-y-4">
        <DentalOdontogram
          defaultMode={defaultMode}
          onMarksChange={handleMarksChange}
          hide3D={hide3D}
        />

        {showSummary && Object.keys(marks).length > 0 && (
          <p className="text-sm text-muted-foreground">
            Marked teeth:{" "}
            <span className="font-mono">
              {Object.entries(marks)
                .map(([id, m]) => `${id}:${m}`)
                .join(", ")}
            </span>
          </p>
        )}
      </main>
    </div>
  );
}
