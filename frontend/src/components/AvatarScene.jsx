import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React from "react";
import { Suspense, useMemo, useRef } from "react";
import avatarUrl from "../assets/avatar.glb?url";

const mouthOpenAmount = {
  REST: 0,
  A: 0.9,
  E: 0.42,
  O: 0.82,
  M: 0.05,
  F: 0.18,
  L: 0.36,
  S: 0.12,
  X: 0.28,
};

const mouthOpenTargets = [
  "mouthOpen",
  "jawOpen",
  "viseme_aa",
  "viseme_AA",
  "A",
  "aa",
];

function findMorphIndex(dictionary, names) {
  if (!dictionary) return undefined;

  for (const name of names) {
    if (dictionary[name] !== undefined) {
      return dictionary[name];
    }
  }

  const lowerCaseNames = names.map((name) => name.toLowerCase());
  const match = Object.entries(dictionary).find(([name]) =>
    lowerCaseNames.some((targetName) => name.toLowerCase().includes(targetName))
  );
  return match?.[1];
}

function Avatar({ speaking, lipSync = [], speechStartTime = 0 }) {
  const group = useRef();
  const { scene } = useGLTF(avatarUrl);

  const model = useMemo(() => {
    const clonedScene = scene.clone(true);
    const morphMeshes = [];
    let headBone = null;

    clonedScene.traverse((object) => {
      if (object.name === "Head") {
        headBone = object;
      }

      if (object.morphTargetDictionary && object.morphTargetInfluences) {
        const mouthOpenIndex = findMorphIndex(object.morphTargetDictionary, mouthOpenTargets);
        const smileIndex = findMorphIndex(object.morphTargetDictionary, ["mouthSmile", "smile"]);
        if (mouthOpenIndex !== undefined) {
          morphMeshes.push({ mesh: object, mouthOpenIndex, smileIndex });
        }
      }

      if (object.isMesh || object.isSkinnedMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return { scene: clonedScene, morphMeshes, headBone };
  }, [scene]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const elapsed = speaking ? (performance.now() - speechStartTime) / 1000 : 0;
    const cue = lipSync.find((item) => elapsed >= item.start && elapsed <= item.end);
    const targetOpen = cue ? mouthOpenAmount[cue.value] ?? 0.25 : speaking ? 0.18 : 0;

    if (group.current) {
      group.current.position.y = -1.12 + Math.sin(t * 1.15) * 0.015;
    }

    if (model.headBone) {
      model.headBone.rotation.y = Math.sin(t * 0.65) * 0.08;
      model.headBone.rotation.x = Math.sin(t * 0.9) * 0.035;
    }

    for (const item of model.morphMeshes) {
      const { mesh, mouthOpenIndex, smileIndex } = item;
      mesh.morphTargetInfluences[mouthOpenIndex] +=
        (targetOpen - mesh.morphTargetInfluences[mouthOpenIndex]) * 0.45;

      if (smileIndex !== undefined) {
        const targetSmile = speaking ? 0.12 : 0.03;
        mesh.morphTargetInfluences[smileIndex] +=
          (targetSmile - mesh.morphTargetInfluences[smileIndex]) * 0.08;
      }
    }
  });

  return (
    <group ref={group} position={[0, -1.12, 0]} rotation={[0, 0, 0]} scale={1.45}>
      <primitive object={model.scene} />
    </group>
  );
}

function LoadingAvatar() {
  return (
    <mesh position={[0, 0.5, 0]}>
      <capsuleGeometry args={[0.45, 1.4, 8, 20]} />
      <meshStandardMaterial color="#254441" roughness={0.7} />
    </mesh>
  );
}

export default function AvatarScene({ speaking, lipSync, speechStartTime }) {
  return (
    <Canvas shadows camera={{ position: [0, 1.2, 3.6], fov: 32 }}>
      <color attach="background" args={["#f4f0e8"]} />
      <ambientLight intensity={0.75} />
      <directionalLight castShadow position={[2.5, 4, 3]} intensity={1.8} />
      <Suspense fallback={<LoadingAvatar />}>
        <Avatar speaking={speaking} lipSync={lipSync} speechStartTime={speechStartTime} />
      </Suspense>
      <Environment preset="city" />
      <OrbitControls
        enablePan={false}
        target={[0, 0.75, 0]}
        minDistance={2.2}
        maxDistance={4.8}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}

useGLTF.preload(avatarUrl);
