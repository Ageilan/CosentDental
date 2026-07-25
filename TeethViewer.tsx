import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { ToothInfo } from "@/lib/teethData";
import { TeethArch } from "./TeethArch";

interface TeethViewerProps {
  teeth: ToothInfo[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  showLabels: boolean;
}

export function TeethViewer({ teeth, selected, onToggle, showLabels }: TeethViewerProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 4, 7], fov: 45 }}
      className="rounded-lg"
    >
      <color attach="background" args={["hsl(210, 40%, 96%)"]} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
      <Suspense fallback={null}>
        <TeethArch
          teeth={teeth}
          selected={selected}
          onToggle={onToggle}
          showLabels={showLabels}
        />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={14}
        maxPolarAngle={Math.PI - 0.2}
        minPolarAngle={0.2}
      />
    </Canvas>
  );
}