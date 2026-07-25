import { useMemo, useState } from "react";
import { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToothInfo, ToothType } from "@/lib/teethData";

interface ToothProps {
  tooth: ToothInfo;
  position: [number, number, number];
  rotation: [number, number, number];
  selected: boolean;
  onClick: (id: string) => void;
}

/** Build a 2D anatomical profile (radial vs height) for LatheGeometry. */
function profileFor(type: ToothType): THREE.Vector2[] {
  // Y goes from root tip (bottom) up to incisal/occlusal top.
  // Each tooth: root → cervix (neck) → crown bulge → top.
  const pts: THREE.Vector2[] = [];
  switch (type) {
    case "incisor":
      pts.push(
        new THREE.Vector2(0.001, 0),
        new THREE.Vector2(0.10, 0.1),
        new THREE.Vector2(0.16, 0.4),
        new THREE.Vector2(0.20, 0.9),
        new THREE.Vector2(0.22, 1.25), // cervix (CEJ)
        new THREE.Vector2(0.30, 1.45), // crown bulge
        new THREE.Vector2(0.32, 1.75),
        new THREE.Vector2(0.28, 1.95),
        new THREE.Vector2(0.18, 2.05),
        new THREE.Vector2(0.001, 2.08),
      );
      break;
    case "canine":
      pts.push(
        new THREE.Vector2(0.001, 0),
        new THREE.Vector2(0.10, 0.15),
        new THREE.Vector2(0.18, 0.5),
        new THREE.Vector2(0.22, 1.1),
        new THREE.Vector2(0.24, 1.45),
        new THREE.Vector2(0.34, 1.65),
        new THREE.Vector2(0.30, 1.95),
        new THREE.Vector2(0.20, 2.15),
        new THREE.Vector2(0.001, 2.25),
      );
      break;
    case "premolar":
      pts.push(
        new THREE.Vector2(0.001, 0),
        new THREE.Vector2(0.12, 0.15),
        new THREE.Vector2(0.20, 0.55),
        new THREE.Vector2(0.24, 1.0),
        new THREE.Vector2(0.26, 1.30),
        new THREE.Vector2(0.38, 1.55),
        new THREE.Vector2(0.40, 1.85),
        new THREE.Vector2(0.34, 2.0),
        new THREE.Vector2(0.001, 2.05),
      );
      break;
    case "molar":
      pts.push(
        new THREE.Vector2(0.001, 0),
        new THREE.Vector2(0.18, 0.15),
        new THREE.Vector2(0.28, 0.5),
        new THREE.Vector2(0.32, 0.95),
        new THREE.Vector2(0.34, 1.25),
        new THREE.Vector2(0.50, 1.45),
        new THREE.Vector2(0.52, 1.75),
        new THREE.Vector2(0.46, 1.92),
        new THREE.Vector2(0.001, 1.95),
      );
      break;
  }
  return pts;
}

/** Build a more realistic crown/root group per tooth type. */
function buildToothGeometry(type: ToothType): THREE.BufferGeometry {
  const profile = profileFor(type);
  const segments = 28;
  const lathe = new THREE.LatheGeometry(profile, segments);

  // Reshape lathe to be elliptical (mesio-distal vs bucco-lingual)
  // Incisors are wide & flat (x wide, z thin). Molars are roughly square.
  const widthMap: { x: number; z: number } = ({
    incisor: { x: 1.6, z: 0.7 },
    canine: { x: 1.2, z: 1.1 },
    premolar: { x: 1.15, z: 1.2 },
    molar: { x: 1.4, z: 1.4 },
  } as Record<ToothType, { x: number; z: number }>)[type];

  const pos = lathe.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // Only deform crown (above CEJ ~ y=1.25). Roots stay round.
    const crownBlend = THREE.MathUtils.smoothstep(y, 1.0, 1.6);
    const sx = THREE.MathUtils.lerp(1, widthMap.x, crownBlend);
    const sz = THREE.MathUtils.lerp(1, widthMap.z, crownBlend);
    pos.setX(i, x * sx);
    pos.setZ(i, z * sz);

    // Add cusps for molars/premolars by displacing top vertices
    if (type === "molar" && y > 1.7) {
      const ang = Math.atan2(z, x);
      // 4 cusps -> sin(2*ang) creates 4-lobed top
      const cusp = Math.cos(2 * ang) * 0.08;
      pos.setY(i, y + cusp);
    } else if (type === "premolar" && y > 1.7) {
      const ang = Math.atan2(z, x);
      // 2 cusps (buccal + lingual) → cos(ang) gives one direction
      const cusp = Math.abs(Math.cos(ang)) * 0.12 - 0.03;
      pos.setY(i, y + cusp);
    } else if (type === "incisor" && y > 1.9) {
      // slight mamelon waves on incisal edge
      const wave = Math.cos(Math.atan2(z, x) * 3) * 0.015;
      pos.setY(i, y + wave);
    }
  }
  lathe.computeVertexNormals();

  // For molars, also build a second root and merge
  if (type === "molar") {
    const rootProfile: THREE.Vector2[] = [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.12, 0.15),
      new THREE.Vector2(0.16, 0.6),
      new THREE.Vector2(0.18, 1.0),
      new THREE.Vector2(0.001, 1.05),
    ];
    const r1 = new THREE.LatheGeometry(rootProfile, 16);
    r1.translate(0.18, 0, 0);
    const r2 = r1.clone();
    r2.translate(-0.36, 0, 0);
    // remove original single root from main geometry by clipping low y? Skip — visual is fine.
    const merged = mergeGeometries([lathe, r1, r2], false);
    if (merged) {
      merged.computeVertexNormals();
      return merged;
    }
  }

  return lathe;
}

const geometryCache = new Map<ToothType, THREE.BufferGeometry>();
function getToothGeometry(type: ToothType): THREE.BufferGeometry {
  if (!geometryCache.has(type)) geometryCache.set(type, buildToothGeometry(type));
  return geometryCache.get(type)!;
}

export function Tooth3D({ tooth, position, rotation, selected, onClick }: ToothProps) {
  const [hovered, setHovered] = useState(false);
  const geometry = useMemo(() => getToothGeometry(tooth.type), [tooth.type]);

  const color = selected
    ? "hsl(0, 75%, 55%)"
    : hovered
    ? "hsl(200, 85%, 70%)"
    : "hsl(46, 55%, 94%)";

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(tooth.id);
  };

  // Upper teeth: flip Y so crown points down, roots up.
  const yScale = tooth.arch === "upper" ? -1 : 1;
  // Center the tooth so origin is at the cervix (~y=1.3 in profile).
  const yOffset = -1.3;

  return (
    <group position={position} rotation={rotation}>
      <group
        scale={[1, yScale, 1]}
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh geometry={geometry} position={[0, yOffset, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={color}
            roughness={0.25}
            metalness={0.0}
            clearcoat={0.6}
            clearcoatRoughness={0.2}
            sheen={0.3}
            sheenColor={"hsl(40, 50%, 90%)"}
            emissive={selected ? "hsl(0, 75%, 30%)" : "#000"}
            emissiveIntensity={selected ? 0.3 : 0}
          />
        </mesh>
      </group>
    </group>
  );
}