import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToothInfo } from "@/lib/teethData";

interface ToothReferenceTableProps {
  teeth: ToothInfo[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  title?: string;
}

/**
 * Clickable tooth-number reference table for confirmation during consent.
 * Highlights the currently selected tooth and lets the clinician click any
 * row to select it.
 */
export function ToothReferenceTable({
  teeth,
  selectedId,
  onSelect,
  title = "Tooth Reference",
}: ToothReferenceTableProps) {
  const [internalSel, setInternalSel] = useState<string | null>(null);
  const sel = selectedId ?? internalSel;

  const handleClick = (id: string) => {
    if (onSelect) onSelect(id);
    else setInternalSel(id);
  };

  const grouped = {
    "Upper Right": teeth.filter((t) => t.arch === "upper" && t.side === "right"),
    "Upper Left": teeth.filter((t) => t.arch === "upper" && t.side === "left"),
    "Lower Left": teeth.filter((t) => t.arch === "lower" && t.side === "left"),
    "Lower Right": teeth.filter((t) => t.arch === "lower" && t.side === "right"),
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {sel && (
          <Badge variant="secondary" className="font-mono">
            Selected: {sel} — {teeth.find((t) => t.id === sel)?.name}
          </Badge>
        )}
      </div>
      <ScrollArea className="h-[280px] pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(grouped).map(([label, group]) => (
            <div key={label}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {label}
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left text-muted-foreground">
                     <th className="py-0.5 pr-2 font-medium w-10">No.</th>
                     <th className="py-0.5 font-medium">Tooth Name</th>
                   </tr>
                 </thead>
                 <tbody>
                   {group.map((t) => {
                     const active = sel === t.id;
                     return (
                       <tr
                         key={t.id}
                         onClick={() => handleClick(t.id)}
                         className={`cursor-pointer border-t border-border/50 transition-colors ${
                           active ? "bg-primary/15 text-foreground" : "hover:bg-accent"
                         }`}
                       >
                         <td className="py-0.5 pr-2 font-mono font-semibold">{t.id}</td>
                         <td className="py-0.5">{t.name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
