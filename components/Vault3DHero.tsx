"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Vault3DHeroProps = {
  toolCount?: number;
};

function Core() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;

    group.current.rotation.y += delta * 0.22;
    group.current.rotation.x += delta * 0.04;

    const pulse =
      1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.035;

    group.current.scale.setScalar(pulse);
  });

  return (
    <group ref={group}>
      {/* Large outer wire sphere */}
      <mesh>
        <sphereGeometry args={[1.35, 32, 24]} />
        <meshBasicMaterial
          color="#6575ff"
          wireframe
          transparent
          opacity={0.42}
        />
      </mesh>

      {/* Inner glowing sphere */}
      <mesh>
        <sphereGeometry args={[0.82, 48, 48]} />
        <meshStandardMaterial
          color="#7555ff"
          emissive="#5b35ff"
          emissiveIntensity={2.8}
          roughness={0.12}
          metalness={0.25}
        />
      </mesh>

      {/* Inner wire shell */}
      <mesh scale={1.12}>
        <sphereGeometry args={[0.82, 20, 20]} />
        <meshBasicMaterial
          color="#a78bfa"
          wireframe
          transparent
          opacity={0.32}
        />
      </mesh>

      {/* Core glow */}
      <mesh scale={1.32}>
        <sphereGeometry args={[0.82, 32, 32]} />
        <meshBasicMaterial
          color="#6045ff"
          transparent
          opacity={0.075}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Orbit({
  radius,
  rotation,
  color,
  speed,
  tube = 0.025,
}: {
  radius: number;
  rotation: [number, number, number];
  color: string;
  speed: number;
  tube?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;

    ref.current.rotation.z += delta * speed;
    ref.current.rotation.y += delta * speed * 0.35;
  });

  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, tube, 16, 180]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 650;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 2.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(
        2 * Math.random() - 1
      );

      positions[i * 3] =
        radius *
        Math.sin(phi) *
        Math.cos(theta);

      positions[i * 3 + 1] =
        radius *
        Math.sin(phi) *
        Math.sin(theta);

      positions[i * 3 + 2] =
        radius * Math.cos(phi);
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        positions,
        3
      )
    );

    return geometry;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;

    ref.current.rotation.y += delta * 0.025;
    ref.current.rotation.x += delta * 0.008;
  });

  return (
    <points
      ref={ref}
      geometry={geometry}
    >
      <pointsMaterial
        color="#8fa0ff"
        size={0.055}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Scene() {
  const scene = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!scene.current) return;

    const targetX =
      state.pointer.y * 0.12;

    const targetY =
      state.pointer.x * 0.18;

    scene.current.rotation.x +=
      (targetX - scene.current.rotation.x) *
      0.025;

    scene.current.rotation.y +=
      (targetY - scene.current.rotation.y) *
      0.025;
  });

  return (
    <group ref={scene}>
      <ambientLight intensity={1.2} />

      <pointLight
        position={[4, 4, 5]}
        intensity={12}
        color="#7565ff"
      />

      <pointLight
        position={[-4, -2, 3]}
        intensity={8}
        color="#3977ff"
      />

      <Particles />

      <Core />

      <Orbit
        radius={1.75}
        rotation={[1.05, 0.2, 0]}
        color="#4f8cff"
        speed={0.7}
        tube={0.032}
      />

      <Orbit
        radius={2.05}
        rotation={[0.2, 1.1, 0.7]}
        color="#a855f7"
        speed={-0.45}
        tube={0.028}
      />

      <Orbit
        radius={2.35}
        rotation={[1.6, 0.4, 1.2]}
        color="#6675ff"
        speed={0.3}
        tube={0.022}
      />
    </group>
  );
}

export default function Vault3DHero({
  toolCount = 740,
}: Vault3DHeroProps) {
  return (
    <section className="relative min-h-[620px] overflow-hidden bg-[#050714]">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute left-1/2 top-1/2
          h-[500px] w-[500px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-indigo-600/20
          blur-[120px]"
        />

        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(100,116,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,255,.12) 1px, transparent 1px)",
            backgroundSize: "55px 55px",
          }}
        />
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-[1]">
        <Canvas
          camera={{
            position: [0, 0, 6],
            fov: 48,
            near: 0.1,
            far: 100,
          }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference:
              "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(
              new THREE.Color("#050714"),
              1
            );
          }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Hero content */}
      <div
        className="
        relative z-10
        flex min-h-[620px]
        flex-col items-center
        px-5 pt-12
        text-center
        pointer-events-none
        "
      >
        <div
          className="
          rounded-full
          border border-white/10
          bg-white/[0.06]
          px-4 py-2
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.22em]
          text-indigo-200
          backdrop-blur-md
          "
        >
          AI INTELLIGENCE VAULT
        </div>

        <h1
          className="
          mt-6
          text-4xl
          font-black
          tracking-[-0.05em]
          text-white
          sm:text-6xl
          "
        >
          Discover
          <span
            className="
            block
            bg-gradient-to-r
            from-blue-400
            via-indigo-400
            to-purple-400
            bg-clip-text
            text-transparent
            "
          >
            Intelligence.
          </span>
        </h1>

        <p
          className="
          mt-5
          max-w-xl
          text-sm
          leading-7
          text-slate-300
          sm:text-base
          "
        >
          Explore, compare and discover{" "}
          <strong className="text-white">
            {toolCount}+
          </strong>{" "}
          AI tools through the world&apos;s
          intelligent software vault.
        </p>

        <div className="mt-6 flex gap-2">
          <Stat
            value={`${toolCount}+`}
            label="AI TOOLS"
          />

          <Stat
            value="100%"
            label="DISCOVERABLE"
          />

          <Stat
            value="AI"
            label="INTELLIGENCE"
          />
        </div>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div
      className="
      rounded-xl
      border border-white/10
      bg-white/[0.06]
      px-4 py-3
      backdrop-blur-md
      "
    >
      <div className="text-lg font-bold text-white">
        {value}
      </div>

      <div
        className="
        text-[9px]
        uppercase
        tracking-wider
        text-slate-400
        "
      >
        {label}
      </div>
    </div>
  );
}
