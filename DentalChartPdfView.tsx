import { useMemo } from 'react';
import { getTeeth, MARK_META, type ToothInfo, type ToothMark, type ToothType } from '@/lib/teethData';

interface DentalChartPdfViewProps {
  marks: Record<string, ToothMark>;
  mode?: 'adult' | 'deciduous';
}

/* ── Lightweight static tooth icon (same shapes as Odontogram2D) ── */

function StaticToothIcon({ type, arch, marked }: { type: ToothType; arch: 'upper' | 'lower'; marked: boolean }) {
  const crownFill = marked ? '#e8d9a0' : '#f0ead6';
  const crownStroke = '#6b7a94';
  const rootFill = '#c9b997';
  const rootStroke = '#7a8a9e';

  let crown: JSX.Element;
  let roots: JSX.Element;

  switch (type) {
    case 'incisor':
      crown = <path d="M10 4 Q20 0 30 4 L31 22 Q20 26 9 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1" />;
      roots = <path d="M12 22 Q20 50 28 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1" />;
      break;
    case 'canine':
      crown = <path d="M11 6 Q20 -2 29 6 L31 20 Q20 28 9 20 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1" />;
      roots = <path d="M12 20 Q20 56 28 20 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1" />;
      break;
    case 'premolar':
      crown = <path d="M9 8 Q14 2 20 6 Q26 2 31 8 L32 22 Q20 26 8 22 Z" fill={crownFill} stroke={crownStroke} strokeWidth="1" />;
      roots = <path d="M14 22 Q15 48 20 50 Q25 48 26 22 Z" fill={rootFill} stroke={rootStroke} strokeWidth="1" />;
      break;
    case 'molar':
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
    <svg viewBox="0 0 40 60" style={{ width: '100%', height: '100%', transform: arch === 'upper' ? 'scaleY(-1)' : undefined }}>
      {roots}
      {crown}
    </svg>
  );
}

function StaticMarkOverlay({ mark }: { mark: ToothMark }) {
  if (mark === 'none') return null;
  const meta = MARK_META[mark];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        fontWeight: 'bold',
        fontSize: '14px',
        color: meta.color,
        textShadow: '0 0 2px #fff',
      }}
    >
      {meta.symbol}
    </div>
  );
}

function StaticToothCell({ tooth, mark, arch }: { tooth: ToothInfo; mark: ToothMark; arch: 'upper' | 'lower' }) {
  const marked = mark !== 'none';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {arch === 'upper' && (
        <span style={{ fontSize: '8px', fontWeight: 'bold', lineHeight: 1, marginBottom: '1px', color: marked ? '#dc2626' : '#1e293b' }}>
          {tooth.id}
        </span>
      )}
      <div
        style={{
          position: 'relative',
          width: '22px',
          height: '38px',
          borderRadius: '2px',
          border: marked ? '1px solid rgba(220,38,38,0.6)' : '1px solid transparent',
        }}
      >
        <StaticToothIcon type={tooth.type} arch={arch} marked={marked} />
        <StaticMarkOverlay mark={mark} />
      </div>
      {arch === 'lower' && (
        <span style={{ fontSize: '8px', fontWeight: 'bold', lineHeight: 1, marginTop: '1px', color: marked ? '#dc2626' : '#1e293b' }}>
          {tooth.id}
        </span>
      )}
    </div>
  );
}

function StaticArchRow({
  rightTeeth,
  leftTeeth,
  marks,
  arch,
}: {
  rightTeeth: ToothInfo[];
  leftTeeth: ToothInfo[];
  marks: Record<string, ToothMark>;
  arch: 'upper' | 'lower';
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
      <div style={{ display: 'flex', gap: '1px' }}>
        {rightTeeth.map((t) => (
          <StaticToothCell key={t.id} tooth={t} mark={marks[t.id] ?? 'none'} arch={arch} />
        ))}
      </div>
      <div style={{ width: '1px', alignSelf: 'stretch', background: '#cbd5e1', margin: '0 2px' }} />
      <div style={{ display: 'flex', gap: '1px' }}>
        {leftTeeth.map((t) => (
          <StaticToothCell key={t.id} tooth={t} mark={marks[t.id] ?? 'none'} arch={arch} />
        ))}
      </div>
    </div>
  );
}

/**
 * Static, non-interactive dental chart for PDF rendering.
 * Shows 2D odontogram with marks + summary table of marked teeth.
 * All colors are hard-coded (no CSS variables) for html2pdf compatibility.
 */
export function DentalChartPdfView({ marks, mode = 'adult' }: DentalChartPdfViewProps) {
  const teeth = useMemo(() => getTeeth(mode), [mode]);

  const upperRight = teeth.filter((t) => t.arch === 'upper' && t.side === 'right').sort((a, b) => b.indexInQuadrant - a.indexInQuadrant);
  const upperLeft = teeth.filter((t) => t.arch === 'upper' && t.side === 'left').sort((a, b) => a.indexInQuadrant - b.indexInQuadrant);
  const lowerRight = teeth.filter((t) => t.arch === 'lower' && t.side === 'right').sort((a, b) => b.indexInQuadrant - a.indexInQuadrant);
  const lowerLeft = teeth.filter((t) => t.arch === 'lower' && t.side === 'left').sort((a, b) => a.indexInQuadrant - b.indexInQuadrant);

  const markedEntries = Object.entries(marks).filter(([, m]) => m !== 'none');

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#fff' }} className="pdf-section dental-chart-pdf">
      <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#1e293b' }}>
        Dental Chart — Universal Numbering System
      </div>

      {/* Static 2D Odontogram */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        {/* Upper arch label */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '7px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', padding: '0 4px' }}>
          <span><span style={{ color: '#dc2626' }}>RIGHT</span></span>
          <span style={{ color: '#1e293b' }}>MAXILLARY (UPPER)</span>
          <span><span style={{ color: '#dc2626' }}>LEFT</span></span>
        </div>
        <StaticArchRow rightTeeth={upperRight} leftTeeth={upperLeft} marks={marks} arch="upper" />

        {/* Midline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', width: '100%' }}>
          <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
          <span>Midline</span>
          <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
        </div>

        {/* Lower arch */}
        <StaticArchRow rightTeeth={lowerRight} leftTeeth={lowerLeft} marks={marks} arch="lower" />
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '7px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', padding: '0 4px' }}>
          <span><span style={{ color: '#dc2626' }}>RIGHT</span></span>
          <span style={{ color: '#1e293b' }}>MANDIBULAR (LOWER)</span>
          <span><span style={{ color: '#dc2626' }}>LEFT</span></span>
        </div>
      </div>

      {/* Marked teeth summary table */}
      {markedEntries.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, marginBottom: '4px', color: '#1e293b' }}>
            Marked Teeth Summary ({markedEntries.length} tooth/teeth)
          </div>
          <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse' }}>
            <thead style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#64748b', textAlign: 'left', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <th style={{ padding: '3px 6px', fontWeight: 600 }}>No.</th>
                <th style={{ padding: '3px 6px', fontWeight: 600 }}>Tooth Name</th>
                <th style={{ padding: '3px 6px', fontWeight: 600 }}>Mark</th>
                <th style={{ padding: '3px 6px', fontWeight: 600 }}>Symbol</th>
              </tr>
            </thead>
            <tbody>
              {markedEntries.map(([id, mark]) => {
                const t = teeth.find((x) => x.id === id);
                if (!t || mark === 'none') return null;
                const meta = MARK_META[mark];
                return (
                  <tr key={id} style={{ borderBottom: '1px solid #e2e8f0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <td style={{ padding: '3px 6px', fontWeight: 600, fontFamily: 'monospace' }}>{id}</td>
                    <td style={{ padding: '3px 6px' }}>{t.name}</td>
                    <td style={{ padding: '3px 6px' }}>{meta.label}</td>
                    <td style={{ padding: '3px 6px', fontWeight: 'bold', color: meta.color }}>{meta.symbol}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {markedEntries.length === 0 && (
        <div style={{ marginTop: '8px', fontSize: '9px', color: '#94a3b8', fontStyle: 'italic' }}>
          No teeth marked
        </div>
      )}
    </div>
  );
}
