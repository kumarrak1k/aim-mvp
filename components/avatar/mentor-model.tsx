"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

type MentorModelProps = {
  speaking?: boolean;
  visemeWeights?: Record<string, number>;
};

type GLTFResult = {
  scene: THREE.Group;
};

export function MentorModel({
  speaking = false,
  visemeWeights = {},
}: MentorModelProps) {
  const { scene } = useGLTF("/avatar/mentor.glb") as unknown as GLTFResult;
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const meshes: THREE.Mesh[] = [];

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh);
      }
    });

    for (const mesh of meshes) {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) continue;

      const morphDict = mesh.morphTargetDictionary;
      const morphInfluences = mesh.morphTargetInfluences;

      Object.entries(morphDict).forEach(([name, index]) => {
        const targetValue = visemeWeights[name] ?? 0;
        morphInfluences[index] = THREE.MathUtils.lerp(
          morphInfluences[index] ?? 0,
          targetValue,
          0.28
        );
      });
    }
  }, [clonedScene, visemeWeights]);

  useEffect(() => {
    let frameId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      if (groupRef.current) {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          speaking ? 0.04 : 0,
          0.04
        );

        groupRef.current.position.y = -1.7 + Math.sin(elapsed * 1.6) * 0.015;
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [speaking]);

  return (
    <group ref={groupRef} position={[0, -1.7, 0]} scale={1.8}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/avatar/mentor.glb");