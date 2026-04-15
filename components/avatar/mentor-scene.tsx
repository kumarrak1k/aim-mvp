"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type MentorSceneProps = {
  speaking?: boolean;
  visemeWeights?: Record<string, number>;
};

function ProceduralMentor({
  speaking = false,
  visemeWeights = {},
}: MentorSceneProps) {
  const mouthOpen =
    visemeWeights.viseme_aa ||
    visemeWeights.viseme_O ||
    visemeWeights.viseme_U ||
    (speaking ? 0.35 : 0.05);

  return (
    <group position={[0, -0.1, 0]}>
      {/* Head */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.72, 48, 48]} />
        <meshStandardMaterial color="#d7b899" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Hair / hood top */}
      <mesh position={[0, 0.48, 0.06]}>
        <sphereGeometry args={[0.78, 40, 40, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#6a4a2f" roughness={1} />
      </mesh>

      {/* Beard */}
      <mesh position={[0, -0.22, 0.2]} rotation={[0.25, 0, 0]}>
        <sphereGeometry args={[0.42, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
        <meshStandardMaterial color="#8a6a4f" roughness={1} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.2, 0.22, 0.58]}>
        <sphereGeometry args={[0.06, 20, 20]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.2, 0.22, 0.58]}>
        <sphereGeometry args={[0.06, 20, 20]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* Brows */}
      <mesh position={[-0.2, 0.32, 0.57]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.16, 0.03, 0.03]} />
        <meshStandardMaterial color="#5b4331" />
      </mesh>
      <mesh position={[0.2, 0.32, 0.57]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.16, 0.03, 0.03]} />
        <meshStandardMaterial color="#5b4331" />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.06, 0.67]}>
        <coneGeometry args={[0.07, 0.22, 20]} />
        <meshStandardMaterial color="#cda98a" roughness={0.9} />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, -0.15, 0.66]} scale={[1, 0.25 + mouthOpen, 1]}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial color="#3d1d1d" roughness={1} />
      </mesh>

      {/* Robe shoulders */}
      <mesh position={[0, -0.95, 0]}>
        <cylinderGeometry args={[1.05, 0.65, 1.05, 32]} />
        <meshStandardMaterial color="#4b3a2a" roughness={1} />
      </mesh>
    </group>
  );
}

export function MentorScene({
  speaking = false,
  visemeWeights = {},
}: MentorSceneProps) {
  return (
    <div className="h-[460px] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black">
      <Canvas camera={{ position: [0, 0.25, 3.1], fov: 28 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#07070b"]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 3, 2]} intensity={2.4} />
        <directionalLight position={[-2, 2, 1]} intensity={0.8} />
        <pointLight position={[0, 1.2, 2]} intensity={1.1} />
        <ProceduralMentor speaking={speaking} visemeWeights={visemeWeights} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minAzimuthAngle={-0.25}
          maxAzimuthAngle={0.25}
          minPolarAngle={Math.PI / 2.3}
          maxPolarAngle={Math.PI / 1.85}
        />
      </Canvas>
    </div>
  );
}