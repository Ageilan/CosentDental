import { Html } from "@react-three/drei";
import { ToothInfo } from "@/lib/teethData";
import { Tooth3D } from "./Tooth3D";

interface TeethArchProps {
  teeth: ToothInfo[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  showLabels: boolean;
}

/**
 * Lays out teeth along an elliptical arch for upper and lower jaws.
 * Each quadrant occupies one half of an ellipse.
 */
export function TeethArch({ teeth, selected, onToggle, showLabels }: TeethArchProps) {
  const upper = teeth.filter((t) => t.arch === "upper");
  const lower = teeth.filter((t) => t.arch === "lower");
  const perQuadrant = upper.length / 2; // 8 adult, 5 ped

  // ellipse radii
  const a = 3.2; // x radius (width)
  const b = 2.6; // z radius (depth)
  const upperY = 0.9;
  const lowerY = -0.9;

  function placeTooth(t: ToothInfo) {
    // angle from midline; 0 = front (z = -b), increasing toward sides
    const total = perQuadrant;
    // distribute across 0..PI/2 of the ellipse front-half
    const frac = (t.indexInQuadrant + 0.5) / total;
    const angle = frac * (Math.PI * 0.95) * 0.5 + 0.02; // 0..~0.5pi
    // For right side, angle is to the +x; for left, mirror to -x.
    const sign = t.side === "left" ? -1 : 1;
    const x = sign * a * Math.sin(angle);
    const z = -b * Math.cos(angle);
    const y = t.arch === "upper" ? upperY : lowerY;

    // tooth faces outward; rotate around Y so its "front" (z-) points toward +radial
    const yaw = sign * angle; // outward
    return {
      position: [x, y, z] as [number, number, number],
      rotation: [0, yaw, 0] as [number, number, number],
    };
  }

  // Gum arches as tori segments (visual base)
  return (
    <group>
      {/* Upper gum */}
      <mesh position={[0, upperY + 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[a * 0.95, 0.25, 16, 64, Math.PI]} />
        <meshStandardMaterial color="hsl(350, 55%, 60%)" roughness={0.6} />
      </mesh>
      {/* Lower gum */}
      <mesh position={[0, lowerY - 0.55, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <torusGeometry args={[a * 0.95, 0.25, 16, 64, Math.PI]} />
        <meshStandardMaterial color="hsl(350, 55%, 60%)" roughness={0.6} />
      </mesh>

      {[...upper, ...lower].map((t) => {
        const { position, rotation } = placeTooth(t);
        return (
          <group key={t.id}>
            <Tooth3D
              tooth={t}
              position={position}
              rotation={rotation}
              selected={selected.has(t.id)}
              onClick={onToggle}
            />
            {showLabels && (
              <Html
                position={[
                  position[0] * 1.25,
                  position[1] + (t.arch === "upper" ? 1.4 : -1.4),
                  position[2] * 1.25,
                ]}
                center
                distanceFactor={10}
              >
                <div
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold pointer-events-none border ${
                    selected.has(t.id)
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-card text-card-foreground border-border"
                  }`}
                >
                  {t.id}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}