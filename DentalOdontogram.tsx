import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Info, ChevronDown } from "lucide-react";
import { TeethViewer } from "./TeethViewer";
import { Odontogram2D } from "./Odontogram2D";
import { getTeeth, ToothInfo, Dentition, ToothMark, MARK_META } from "@/lib/teethData";
import { ToothReferenceTable } from "./ToothReferenceTable";
import referenceChart from "@/assets/dental-chart-reference.jpeg";

export type OdontogramMode = Dentition;

const MARK_OPTIONS: { value: ToothMark; label: string }[] = [
  { value: "none", label: "None / Healthy" },
  { value: "missing", label: "X — Missing" },
  { value: "caries", label: "O — Caries" },
  { value: "extracted", label: "/ — Extracted" },
  { value: "rootCanal", label: "R — Root Canal" },
  { value: "crown", label: "C — Crown" },
  { value: "filling", label: "F — Filling" },
];

export interface DentalOdontogramProps {
  /** Initial dentition. "adult" = permanent (1–32). "deciduous" = primary (A–T). */
  defaultMode?: OdontogramMode;
  /** Controlled marks map: { toothId: markType }. */
  marks?: Record<string, ToothMark>;
  /** Called whenever the marks map changes. */
  onMarksChange?: (marks: Record<string, ToothMark>, teeth: ToothInfo[]) => void;
  /** Hide the 3D preview entirely. */
  hide3D?: boolean;
  /** Optional className for the outer Card. */
  className?: string;
}

/**
 * Dental Odontogram — Universal Numbering System (ADA standard).
 * - Adult permanent teeth 1–32; Deciduous primary teeth A–T
 * - Charting marks: X Missing, O Caries, / Extracted, R Root Canal, C Crown, F Filling
 * - 2D hospital-style chart + 3D preview
 */
export function DentalOdontogram({
  defaultMode = "adult",
  marks: controlledMarks,
  onMarksChange,
  hide3D = false,
  className,
}: DentalOdontogramProps) {
  const [mode, setMode] = useState<OdontogramMode>(defaultMode);
  const [showLabels, setShowLabels] = useState(true);
  const [internalMarks, setInternalMarks] = useState<Record<string, ToothMark>>({});
  const [activeMark, setActiveMark] = useState<ToothMark>("caries");
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const isControlled = controlledMarks !== undefined;
  const marks = isControlled ? controlledMarks! : internalMarks;
  const teeth = useMemo(() => getTeeth(mode), [mode]);

  const updateMarks = (next: Record<string, ToothMark>) => {
    if (!isControlled) setInternalMarks(next);
    onMarksChange?.(next, teeth);
  };

  const onToothClick = (id: string) => {
    const next = { ...marks };
    if (activeMark === "none" || next[id] === activeMark) {
      delete next[id];
      setLastSelectedId(null);
    } else {
      next[id] = activeMark;
      setLastSelectedId(id);
    }
    updateMarks(next);
  };

  const clearAll = () => updateMarks({});

  // Selection set (3D preview shows highlighted teeth as marked)
  const selectedSet = useMemo(() => new Set(Object.keys(marks)), [marks]);

  // For 3D preview map teeth — we need ToothInfo arch/side/index but TeethArch was built around old indexing.
  // It still works because indexInQuadrant range is 0..7 (adult) / 0..4 (deciduous). 

  const markedEntries = Object.entries(marks);
  const adultRangeNote = mode === "adult" ? "Permanent (1–32)" : "Deciduous (A–T)";

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2 flex-wrap">
            Dental Chart — Universal Numbering System
            <Badge variant="secondary">{adultRangeNote}</Badge>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Numbering legend" className="text-muted-foreground hover:text-foreground">
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm">
                <p className="font-semibold mb-2">Universal Numbering</p>
                <p className="text-muted-foreground mb-2">
                  Permanent teeth are numbered <strong>1–32</strong>, beginning at the maxillary upper-right
                  third molar (#1), continuing across the upper arch to the upper-left third molar (#16),
                  then down to the mandibular lower-left third molar (#17) and across to the lower-right
                  third molar (#32).
                </p>
                <p className="text-muted-foreground">
                  Primary (deciduous) teeth use letters <strong>A–T</strong>, following the same path
                  (A = upper-right 2nd molar … T = lower-right 2nd molar).
                </p>
              </PopoverContent>
            </Popover>
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="text-xs text-primary hover:text-primary/80 underline underline-offset-2">
                  View Reference Chart
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl z-[200]">
                <img src={referenceChart} alt="Hospital reference: Dental Chart — Universal Numbering System" className="w-full h-auto rounded-md" />
              </DialogContent>
            </Dialog>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Pick a charting symbol below, then click any tooth to mark it. Click again to clear.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="odontogram-labels" className="text-xs">Labels</Label>
          <Switch id="odontogram-labels" checked={showLabels} onCheckedChange={setShowLabels} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as OdontogramMode);
            clearAll();
          }}
        >
          <TabsList className="mb-3">
            <TabsTrigger value="adult">Permanent (Adult — 32)</TabsTrigger>
            <TabsTrigger value="deciduous">Deciduous (Primary — 20)</TabsTrigger>
          </TabsList>

          {/* Mark picker */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
              Charting Mark:
            </span>
            {MARK_OPTIONS.map((opt) => {
              const isActive = activeMark === opt.value;
              const meta = opt.value === "none" ? null : MARK_META[opt.value];
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setActiveMark(opt.value)}
                  className={`px-2 py-1 rounded-md border text-xs flex items-center gap-1.5 transition-colors ${
                    isActive ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-accent"
                  }`}
                >
                  {meta && <span className="font-bold" style={{ color: meta.color }}>{meta.symbol}</span>}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <TabsContent value={mode} forceMount className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                2D Chart
              </div>
              <div className="w-full rounded-lg border bg-accent/30 overflow-auto touch-pan-x">
                <div className="min-w-[700px] md:min-w-0">
                  <Odontogram2D
                    teeth={teeth}
                    marks={marks}
                    onToothClick={onToothClick}
                    showLabels={showLabels}
                  />
                </div>
              </div>
            {!hide3D && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  3D Preview
                </div>
                <div className="h-[420px] w-full rounded-lg border bg-accent/30 overflow-hidden relative" style={{ zIndex: 0, isolation: 'isolate' }}>
                  <TeethViewer
                    teeth={teeth}
                    selected={selectedSet}
                    onToggle={onToothClick}
                    showLabels={showLabels}
                  />
                </div>
              </div>
            )}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 hover:text-foreground transition-colors group">
                Tooth Reference Table
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ToothReferenceTable
                  teeth={teeth}
                  selectedId={lastSelectedId}
                  onSelect={onToothClick}
                  title={mode === "adult" ? "Permanent (1–32)" : "Deciduous (A–T)"}
                />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm">
            <span className="font-semibold">{markedEntries.length}</span>{" "}
            <span className="text-muted-foreground">tooth/teeth marked</span>
          </div>
          <Button variant="outline" size="sm" onClick={clearAll} disabled={markedEntries.length === 0}>
            Clear all marks
          </Button>
        </div>

        {markedEntries.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {markedEntries.map(([id, mark]) => {
              const t = teeth.find((x) => x.id === id);
              if (!t || mark === "none") return null;
              const meta = MARK_META[mark];
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className="cursor-pointer gap-1.5"
                  onClick={() => {
                    const next = { ...marks };
                    delete next[id];
                    updateMarks(next);
                  }}
                >
                  <span className="font-bold" style={{ color: meta.color }}>{meta.symbol}</span>
                  <span>{id} · {t.name}</span>
                  <span className="text-muted-foreground">({meta.label}) ✕</span>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
