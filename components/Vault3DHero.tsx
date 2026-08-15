"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";

type HeroProps = {
  toolCount?: number;
};

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 3.2 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] =
        radius * Math.sin(phi) * Math.cos(theta);

      positions[i * 3 + 1] =
        radius * Math.sin(phi) * Math.sin(theta);

      positions[i * 3 + 2] =
        radius * Math.cos(phi);
    }

    const g = new THREE.BufferGeometry();

    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    return g;
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    pointsRef.current.rotation.y += delta * 0.025;
    pointsRef.current.rotation.x += delta * 0.008;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.025}
        color="#8b9cff"
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

function Orbit({
  rotation,
  radius,
  color,
  speed,
}: {
  rotation: [number, number, number];
  radius: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;

    ref.current.rotation.z += delta * speed;
    ref.current.rotation.y += delta * speed * 0.35;
  });

  return (
    <mesh
      ref={ref}
      rotation={rotation}
    >
      <torusGeometry
        args={[radius, 0.018, 16, 160]}
      />

      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function Core() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;

    group.current.rotation.y += delta * 0.25;
    group.current.rotation.x += delta * 0.06;
  });

  return (
    <group ref={group}>
      {/* Outer wire sphere */}
      <mesh>
        <sphereGeometry args={[1.05, 32, 32]} />

        <meshBasicMaterial
          color="#647cff"
          wireframe
          transparent
          opacity={0.28}
        />
      </mesh>

      {/* Inner intelligence core */}
      <mesh>
        <sphereGeometry args={[0.72, 48, 48]} />

        <meshStandardMaterial
          color="#7c5cff"
          emissive="#4f46e5"
          emissiveIntensity={1.8}
          roughness={0.18}
          metalness={0.35}
          transparent
          opacity={0.94}
        />
      </mesh>

      {/* Inner glow */}
      <mesh scale={1.16}>
        <sphereGeometry args={[0.72, 32, 32]} />

        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.08}
        />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.55} />

      <pointLight
        position={[3, 3, 4]}
        intensity={8}
        color="#6366f1"
      />

      <pointLight
        position={[-3, -2, 2]}
        intensity={5}
        color="#8b5cf6"
      />

      <Core />

      <Orbit
        radius={1.65}
        rotation={[0.8, 0.25, 0.2]}
        color="#5b8cff"
        speed={0.22}
      />

      <Orbit
        radius={1.95}
        rotation={[1.45, 0.15, 0.75]}
        color="#a855f7"
        speed={-0.16}
      />

      <Orbit
        radius={2.25}
        rotation={[0.15, 1.2, 0.35]}
        color="#8b9cff"
        speed={0.1}
      />

      <ParticleField />
    </>
  );
}

export default function Vault3DHero({
  toolCount = 740,
}: HeroProps) {
  return (
    <section className="relative min-h-[620px] overflow-hidden bg-[#050714]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[100px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.12),transparent_52%)]" />

        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(129,140,248,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.12) 1px, transparent 1px)",
            backgroundSize: "55px 55px",
          }}
        />
      </div>

      {/* 3D */}
      <div className="absolute inset-0">
        <Canvas
          camera={{
            position: [0, 0, 6],
            fov: 45,
          }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Hero text */}
      <div className="relative z-10 flex min-h-[620px] flex-col items-center justify-start px-5 pt-12 text-center pointer-events-none">
        <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-200 backdrop-blur-md">
          AI INTELLIGENCE VAULT
        </div>

        <h2 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
          Discover
          <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Intelligence.
          </span>
        </h2>

        <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
          Explore, compare and discover{" "}
          <strong className="text-white">
            {toolCount}+
          </strong>{" "}
          AI tools through the world&apos;s intelligent software vault.
        </p>

        <div className="mt-6 flex gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-md">
            <div className="text-lg font-bold text-white">
              {toolCount}+
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              AI Tools
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-md">
            <div className="text-lg font-bold text-white">
              100%
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              Discoverable
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-md">
            <div className="text-lg font-bold text-white">
              AI
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Mobile performance hint */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[8px] uppercase tracking-wider text-slate-400 backdrop-blur-md">
        AI 3D
      </div>
    </section>
  );
}
